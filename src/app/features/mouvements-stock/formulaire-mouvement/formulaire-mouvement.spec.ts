import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { FormulaireMouvement } from './formulaire-mouvement';
import { provideAppConfig } from '../../../core/config/app-config';
import type { OperationStock } from '../mouvement-api';

const BASE = '/api/v1/mouvements-stock';

@Component({
  imports: [FormulaireMouvement],
  template: `<app-formulaire-mouvement
    [operation]="operation()"
    [articleId]="7"
    (enregistre)="enregistre.set(true)"
  />`,
})
class Hote {
  readonly operation = signal<OperationStock>('sortie');
  readonly enregistre = signal(false);
}

async function monter(operation: OperationStock) {
  await TestBed.configureTestingModule({
    imports: [Hote],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideAppConfig()],
  }).compileComponents();

  const fixture = TestBed.createComponent(Hote);
  fixture.componentInstance.operation.set(operation);
  await fixture.whenStable();

  return fixture;
}

function saisir(racine: HTMLElement, selecteur: string, valeur: string): void {
  const controle = racine.querySelector<HTMLInputElement | HTMLSelectElement>(selecteur);
  if (controle === null) {
    throw new Error(`Contrôle introuvable : ${selecteur}`);
  }
  controle.value = valeur;
  controle.dispatchEvent(new Event('input'));
  controle.dispatchEvent(new Event('change'));
}

async function envoyer(fixture: Awaited<ReturnType<typeof monter>>): Promise<void> {
  (fixture.nativeElement as HTMLElement).querySelector('form')?.dispatchEvent(new Event('submit'));
  for (let tour = 0; tour < 5; tour += 1) {
    await Promise.resolve();
    fixture.detectChanges();
  }
}

describe('FormulaireMouvement', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('demande une source pour une sortie, pas un motif', async () => {
    const fixture = await monter('sortie');
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('#mouvement-source')).not.toBeNull();
    expect(racine.querySelector('#mouvement-motif')).toBeNull();
  });

  it('demande un motif pour une correction, pas une source', async () => {
    const fixture = await monter('correction-negative');
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('#mouvement-motif')).not.toBeNull();
    expect(racine.querySelector('#mouvement-source')).toBeNull();
  });

  it('refuse une quantité nulle sans appeler le serveur', async () => {
    const fixture = await monter('sortie');
    const racine = fixture.nativeElement as HTMLElement;

    saisir(racine, '#mouvement-source', 'VENTE');
    await envoyer(fixture);

    TestBed.inject(HttpTestingController).expectNone(`${BASE}/sortie`);
    expect(racine.textContent).toContain('La quantité doit être positive');
  });

  it('envoie une correction négative avec son motif', async () => {
    const fixture = await monter('correction-negative');
    const racine = fixture.nativeElement as HTMLElement;

    saisir(racine, '#mouvement-quantite', '3');
    saisir(racine, '#mouvement-motif', 'Casse à la manutention');
    await envoyer(fixture);

    const requete = TestBed.inject(HttpTestingController).expectOne(`${BASE}/correction-negative`);
    expect(requete.request.body).toEqual({
      articleId: 7,
      quantite: 3,
      motif: 'Casse à la manutention',
    });

    requete.flush({ id: 1, quantite: 3, typeMvt: 'CORRECTION_NEG' });
    await fixture.whenStable();
    expect(fixture.componentInstance.enregistre()).toBe(true);
  });

  it('montre un stock insuffisant dans son bandeau', async () => {
    const fixture = await monter('sortie');
    const racine = fixture.nativeElement as HTMLElement;

    saisir(racine, '#mouvement-quantite', '99');
    saisir(racine, '#mouvement-source', 'VENTE');
    await envoyer(fixture);

    TestBed.inject(HttpTestingController).expectOne(`${BASE}/sortie`).flush(
      {
        timestamp: '2026-08-19T11:00:43',
        status: 409,
        error: 'Conflict',
        message:
          "Stock insuffisant pour l'article 'Ciment 50 kg' : stock actuel 25, quantité demandée 99",
        path: '/api/v1/mouvements-stock/sortie',
      },
      { status: 409, statusText: 'Conflict' },
    );
    await fixture.whenStable();
    await fixture.whenStable();

    expect(racine.querySelector('.formulaire-mouvement__bandeau')?.textContent).toContain(
      'Stock insuffisant',
    );
    expect(fixture.componentInstance.enregistre()).toBe(false);
  });
});
