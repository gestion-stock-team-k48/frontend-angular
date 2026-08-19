import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import { ListeCategories } from './liste-categories';
import { provideAppConfig } from '../../../core/config/app-config';
import type { Categorie } from '../../../core/api/api-types';

const URL = '/api/v1/categories';

const CATEGORIES: Categorie[] = [
  { id: 2, code: 'OUT', designation: 'Outillage' },
  { id: 1, code: 'CIM', designation: 'Ciment' },
];

/**
 * `whenStable()` ne rend la main qu'une fois les requêtes terminées : tant qu'une requête
 * attend son `flush`, l'attente ne se dénoue pas. Les tests avancent donc par
 * `detectChanges()`, et n'attendent la stabilité qu'une fois le serveur simulé répondu.
 */
async function tourDeBoucle(fixture: { detectChanges: () => void }): Promise<void> {
  await Promise.resolve();
  fixture.detectChanges();
}

async function monter(categories: Categorie[] = CATEGORIES) {
  await TestBed.configureTestingModule({
    imports: [ListeCategories],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAppConfig(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ListeCategories);
  fixture.detectChanges();

  TestBed.inject(HttpTestingController).expectOne(URL).flush(categories);
  await fixture.whenStable();

  return fixture;
}

function codesAffiches(racine: HTMLElement): (string | undefined)[] {
  return Array.from(racine.querySelectorAll('tbody td:first-child')).map((cellule) =>
    cellule.textContent?.trim(),
  );
}

describe('ListeCategories', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('trie les catégories par code, sans repasser par le serveur', async () => {
    const fixture = await monter();

    expect(codesAffiches(fixture.nativeElement as HTMLElement)).toEqual(['CIM', 'OUT']);
  });

  it('inverse le tri au clic sur l’en-tête, toujours sans requête', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    racine.querySelectorAll<HTMLButtonElement>('.tableau__tri')[0]?.click();
    await fixture.whenStable();

    expect(codesAffiches(racine)).toEqual(['OUT', 'CIM']);
    TestBed.inject(HttpTestingController).expectNone(URL);
  });

  it('propose de créer une catégorie quand il n’y en a aucune', async () => {
    const fixture = await monter([]);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Aucune catégorie');
  });

  it('supprime après confirmation, puis recharge la liste', async () => {
    const fixture = await monter();
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
    await tourDeBoucle(fixture);

    const http = TestBed.inject(HttpTestingController);
    // La première ligne affichée est « Ciment », d'identifiant 1 : le tri change l'ordre,
    // pas la ligne visée.
    http.expectOne({ url: `${URL}/1`, method: 'DELETE' }).flush(null);
    await tourDeBoucle(fixture);
    await tourDeBoucle(fixture);

    http.expectOne(URL).flush(CATEGORIES);
    await fixture.whenStable();

    expect(codesAffiches(racine)).toEqual(['CIM', 'OUT']);
  });
});
