import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, type Observable } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { ListeCommandes } from './liste-commandes';
import { provideAppConfig } from '../../core/config/app-config';
import type { CommandeClient } from '../../core/api/api-types';
import type { CommandeVue } from './commande';

/**
 * Traduction locale au test : `shared` ne connaît aucune feature, pas même dans ses tests.
 * Celle des modules leur appartient et est vérifiée chez eux.
 */
function versVue(reponse: CommandeClient): CommandeVue {
  return {
    id: reponse.id,
    code: reponse.codeCommande,
    date: reponse.dateCommande,
    etat: reponse.etatCommande,
    tiersId: reponse.idClient,
    tiersNom: `${reponse.clientPrenom ?? ''} ${reponse.clientNom ?? ''}`.trim(),
    totalTtc: reponse.totalTtc,
    lignes: reponse.lignes ?? [],
  };
}

const URL = '/api/v1/commandes-client';

const COMMANDES: CommandeClient[] = [
  {
    id: 1,
    codeCommande: 'CC-0001',
    dateCommande: '2026-08-18',
    etatCommande: 'EN_PREPARATION',
    clientNom: 'Ngono',
    clientPrenom: 'Alice',
    totalTtc: 14310,
  },
  {
    id: 2,
    codeCommande: 'CC-0002',
    dateCommande: '2026-08-19',
    etatCommande: 'LIVREE',
    clientNom: 'Fokou',
    clientPrenom: 'Serge',
    totalTtc: 5000,
  },
];

function page(contenu: CommandeClient[]) {
  return {
    content: contenu,
    pageNumber: 0,
    pageSize: 20,
    totalElements: contenu.length,
    totalPages: 1,
    isLast: true,
  };
}

@Component({
  imports: [ListeCommandes],
  template: `<app-liste-commandes
    titre="Commandes client"
    sousTitre="Les commandes passées par les clients."
    libelleTiers="Client"
    cheminBase="/commandes-client"
    url="/api/v1/commandes-client"
    [versVue]="versVue"
    [supprimer]="supprimer"
  />`,
})
class Hote {
  readonly supprimees: number[] = [];
  readonly versVue = (reponse: CommandeClient) => versVue(reponse);
  readonly supprimer = (id: number): Observable<void> => {
    this.supprimees.push(id);
    return of(undefined);
  };
}

async function monter(contenu: CommandeClient[] = COMMANDES) {
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
  fixture.detectChanges();

  const requete = TestBed.inject(HttpTestingController).expectOne(
    (candidate) => candidate.url === URL,
  );
  requete.flush(page(contenu));
  await fixture.whenStable();

  return { fixture, requete };
}

describe('ListeCommandes', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('demande les commandes les plus récentes d’abord', async () => {
    const { requete } = await monter();

    expect(requete.request.params.get('sort')).toBe('dateCommande,desc');
  });

  it('affiche l’état et le montant de chaque commande', async () => {
    const { fixture } = await monter();
    const texte = ((fixture.nativeElement as HTMLElement).textContent ?? '').replace(/\s/gu, ' ');

    expect(texte).toContain('En préparation');
    expect(texte).toContain('Livrée');
    expect(texte).toContain('14 310 FCFA');
  });

  it('ne propose pas de supprimer une commande livrée', async () => {
    const { fixture } = await monter();
    const lignes = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');

    expect(lignes[0]?.textContent).toContain('Supprimer');
    // La commande livrée a déjà bougé le stock : le serveur refuserait, l'écran ne propose pas.
    expect(lignes[1]?.textContent).not.toContain('Supprimer');
  });

  it('supprime après confirmation', async () => {
    const { fixture } = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    const supprimer = Array.from(racine.querySelectorAll('tbody button')).find((bouton) =>
      bouton.textContent?.includes('Supprimer'),
    );
    (supprimer as HTMLButtonElement).click();
    await fixture.whenStable();

    const confirmer = Array.from(racine.querySelectorAll('dialog button')).find((bouton) =>
      bouton.textContent?.trim().startsWith('Supprimer'),
    );
    (confirmer as HTMLButtonElement).click();
    for (let tour = 0; tour < 4; tour += 1) {
      await Promise.resolve();
      fixture.detectChanges();
    }

    expect(fixture.componentInstance.supprimees).toEqual([1]);

    TestBed.inject(HttpTestingController)
      .expectOne((candidate) => candidate.url === URL)
      .flush(page(COMMANDES));
    await fixture.whenStable();
  });
});
