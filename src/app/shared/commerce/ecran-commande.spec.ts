import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, type Observable } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { EcranCommande } from './ecran-commande';
import { provideAppConfig } from '../../core/config/app-config';
import type { CommandeVue, SaisieCommande } from './commande';
import type { EtatCommande } from '../../core/api/api-types';

const URL_TIERS = '/api/v1/clients';
const URL_ARTICLES = '/api/v1/articles';

const CLIENTS = {
  content: [{ id: 7, nom: 'Ngono', prenom: 'Alice' }],
  pageNumber: 0,
  pageSize: 200,
  totalElements: 1,
  totalPages: 1,
  isLast: true,
};

const ARTICLES = {
  content: [{ id: 4, designation: 'Ciment', prixUnitaireHt: 6000, prixUnitaireTtc: 7155 }],
  pageNumber: 0,
  pageSize: 200,
  totalElements: 1,
  totalPages: 1,
  isLast: true,
};

@Component({
  imports: [EcranCommande],
  template: `<app-ecran-commande
    libelleTiers="Client"
    champTiers="idClient"
    cheminBase="/commandes-client"
    urlTiers="/api/v1/clients"
    urlArticles="/api/v1/articles"
    [commande]="commande()"
    [enregistrer]="enregistrer"
    [changerEtat]="changerEtat"
    (enregistree)="enregistree.set(true)"
  />`,
})
class Hote {
  readonly commande = signal<CommandeVue | null>(null);
  readonly saisieRecue = signal<SaisieCommande | null>(null);
  readonly etatDemande = signal<EtatCommande | null>(null);
  readonly enregistree = signal(false);

  readonly enregistrer = (saisie: SaisieCommande): Observable<unknown> => {
    this.saisieRecue.set(saisie);
    return of({ id: 1 });
  };

  readonly changerEtat = (etat: EtatCommande): Observable<unknown> => {
    this.etatDemande.set(etat);
    return of({ id: 1 });
  };
}

async function monter(commande: CommandeVue | null = null) {
  await TestBed.configureTestingModule({
    imports: [Hote],
    providers: [
      provideRouter([{ path: '**', children: [] }]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAppConfig(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(Hote);
  fixture.componentInstance.commande.set(commande);
  fixture.detectChanges();

  const http = TestBed.inject(HttpTestingController);
  http.expectOne((requete) => requete.url === URL_TIERS).flush(CLIENTS);
  http.expectOne((requete) => requete.url === URL_ARTICLES).flush(ARTICLES);
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

describe('EcranCommande', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('refuse une commande sans ligne complète', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    saisir(racine, '#commande-tiers', '7');
    await envoyer(fixture);

    expect(fixture.componentInstance.saisieRecue()).toBeNull();
    expect(racine.textContent).toContain('au moins une ligne complète');
  });

  it('remonte la saisie complète à l’action fournie', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    saisir(racine, '#commande-tiers', '7');
    saisir(racine, '#commande-date', '2026-08-19');

    (racine.querySelector('.lignes__ajouter') as HTMLButtonElement).click();
    await fixture.whenStable();

    saisir(racine, '.lignes__ligne select', '4');
    saisir(racine, '.lignes__ligne input[type="number"]', '3');
    await fixture.whenStable();

    await envoyer(fixture);

    expect(fixture.componentInstance.saisieRecue()).toEqual({
      code: '',
      date: '2026-08-19',
      tiersId: '7',
      lignes: [{ articleId: '4', quantite: 3 }],
    });
    expect(fixture.componentInstance.enregistree()).toBe(true);
  });

  it('estime le total pendant la saisie, en le disant estimé', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    (racine.querySelector('.lignes__ajouter') as HTMLButtonElement).click();
    await fixture.whenStable();
    saisir(racine, '.lignes__ligne select', '4');
    saisir(racine, '.lignes__ligne input[type="number"]', '2');
    await fixture.whenStable();

    const total = (racine.querySelector('.lignes__total')?.textContent ?? '').replace(/\s/gu, ' ');
    expect(total).toContain('Total estimé');
    expect(total).toContain('14 310 FCFA');
  });

  it('ferme la saisie dès que la commande est validée', async () => {
    const fixture = await monter({
      id: 3,
      code: 'CC-0003',
      date: '2026-08-19',
      etat: 'VALIDEE',
      tiersId: 7,
      tiersNom: 'Alice Ngono',
      totalTtc: 14310,
      lignes: [{ articleId: 4, articleDesignation: 'Ciment', quantite: 2, prixUnitaireTtc: 7155 }],
    });
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('form')).toBeNull();
    expect(racine.textContent).toContain('Ciment');
    // Depuis VALIDEE, le serveur n'accepte que la livraison ou l'annulation.
    const boutons = Array.from(racine.querySelectorAll('app-bouton')).map((bouton) =>
      bouton.textContent?.trim(),
    );
    expect(boutons).toContain('Marquer livrée');
    expect(boutons).toContain('Annuler la commande');
    expect(boutons).not.toContain('Valider la commande');
  });

  it('demande la transition choisie', async () => {
    const fixture = await monter({
      id: 3,
      code: 'CC-0003',
      etat: 'EN_PREPARATION',
      tiersId: 7,
      tiersNom: 'Alice Ngono',
      lignes: [],
    });
    const racine = fixture.nativeElement as HTMLElement;

    const valider = Array.from(racine.querySelectorAll('button')).find(
      (bouton) => bouton.textContent?.trim() === 'Valider la commande',
    );
    (valider as HTMLButtonElement).click();
    for (let tour = 0; tour < 4; tour += 1) {
      await Promise.resolve();
      fixture.detectChanges();
    }

    expect(fixture.componentInstance.etatDemande()).toBe('VALIDEE');
  });
});
