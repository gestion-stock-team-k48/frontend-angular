import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, type Observable } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { ListeTiers } from './liste-tiers';
import type { Client } from '../../core/api/api-types';

const URL = '/api/v1/clients';

const CLIENTS: Client[] = [
  { id: 1, nom: 'Ngono', prenom: 'Alice', email: 'alice@exemple.cm', ville: 'Douala' },
  { id: 2, nom: 'Fokou', prenom: 'Serge', email: 'serge@exemple.cm' },
];

function page(contenu: Client[]) {
  return {
    content: contenu,
    pageNumber: 0,
    pageSize: 20,
    totalElements: contenu.length,
    totalPages: contenu.length === 0 ? 0 : 1,
    isLast: true,
  };
}

@Component({
  imports: [ListeTiers],
  template: `<app-liste-tiers
    titre="Clients"
    sousTitre="Les clients de l'entreprise."
    singulier="client"
    cheminBase="/clients"
    url="/api/v1/clients"
    [supprimer]="supprimer"
  />`,
})
class Hote {
  readonly supprimes: number[] = [];

  readonly supprimer = (id: number): Observable<void> => {
    this.supprimes.push(id);
    return of(undefined);
  };
}

async function monter(contenu: Client[] = CLIENTS) {
  await TestBed.configureTestingModule({
    imports: [Hote],
    providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
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

describe('ListeTiers', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('demande la première page triée par nom', async () => {
    const { requete } = await monter();

    expect(requete.request.params.get('page')).toBe('0');
    expect(requete.request.params.get('sort')).toBe('nom,asc');
  });

  it('affiche un tiret là où le tiers n’a rien renseigné', async () => {
    const { fixture } = await monter();
    const lignes = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');

    expect(lignes[1]?.textContent).toContain('—');
  });

  it('supprime après confirmation et recharge la liste', async () => {
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

    expect(fixture.componentInstance.supprimes).toEqual([1]);

    TestBed.inject(HttpTestingController)
      .expectOne((candidate) => candidate.url === URL)
      .flush(page([CLIENTS[1] as Client]));
    await fixture.whenStable();
  });

  it('invite à créer quand la liste est vide', async () => {
    const { fixture } = await monter([]);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Aucun client');
  });
});
