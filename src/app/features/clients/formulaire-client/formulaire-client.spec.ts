import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import { FormulaireClient } from './formulaire-client';
import { provideAppConfig } from '../../../core/config/app-config';
import type { Client } from '../../../core/api/api-types';

const URL = '/api/v1/clients';

const CLIENT: Client = {
  id: 4,
  nom: 'Ngono',
  prenom: 'Alice',
  email: 'alice@exemple.cm',
  ville: 'Douala',
  photo: 'clients/abc.png',
};

async function monter(id: string | null) {
  await TestBed.configureTestingModule({
    imports: [FormulaireClient],
    providers: [
      // Une route attrape-tout : ces écrans naviguent après l'enregistrement.
      provideRouter([{ path: '**', children: [] }]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAppConfig(),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap(id === null ? {} : { id }) } },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(FormulaireClient);
  fixture.detectChanges();

  if (id !== null) {
    TestBed.inject(HttpTestingController).expectOne(`${URL}/${id}`).flush(CLIENT);
  }
  await fixture.whenStable();

  return fixture;
}

function saisir(racine: HTMLElement, selecteur: string, valeur: string): void {
  const controle = racine.querySelector<HTMLInputElement>(selecteur);
  if (controle === null) {
    throw new Error(`Contrôle introuvable : ${selecteur}`);
  }
  controle.value = valeur;
  controle.dispatchEvent(new Event('input'));
}

describe('FormulaireClient', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('crée un client sans rien demander au serveur au chargement', async () => {
    const fixture = await monter(null);
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.textContent).toContain('Nouveau client');
    // Pas de photo en création : le client doit exister avant qu'on lui attache un fichier.
    expect(racine.querySelector('#tiers-photo')).toBeNull();

    saisir(racine, '#tiers-nom', 'Ngono');
    saisir(racine, '#tiers-prenom', 'Alice');
    saisir(racine, '#tiers-email', 'alice@exemple.cm');
    racine.querySelector('form')?.dispatchEvent(new Event('submit'));
    for (let tour = 0; tour < 5; tour += 1) {
      await Promise.resolve();
      fixture.detectChanges();
    }

    const requete = TestBed.inject(HttpTestingController).expectOne({ url: URL, method: 'POST' });
    expect(requete.request.body).toEqual({
      nom: 'Ngono',
      prenom: 'Alice',
      email: 'alice@exemple.cm',
    });
    requete.flush(CLIENT);
    await fixture.whenStable();
  });

  it('charge le client à modifier et propose sa photo', async () => {
    const fixture = await monter('4');
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector<HTMLInputElement>('#tiers-nom')?.value).toBe('Ngono');
    expect(racine.querySelector('#tiers-photo')).not.toBeNull();
    expect(racine.textContent).toContain('clients/abc.png');
  });

  it('dit franchement qu’un client introuvable ne s’affichera pas', async () => {
    await TestBed.configureTestingModule({
      imports: [FormulaireClient],
      providers: [
        // Une route attrape-tout : ces écrans naviguent après l'enregistrement.
        provideRouter([{ path: '**', children: [] }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppConfig(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '99' }) } },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(FormulaireClient);
    fixture.detectChanges();

    TestBed.inject(HttpTestingController).expectOne(`${URL}/99`).flush(
      { status: 404, message: 'Client introuvable', path: '/api/v1/clients/99' },
      {
        status: 404,
        statusText: 'Not Found',
      },
    );
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain("n'existe plus");
  });
});
