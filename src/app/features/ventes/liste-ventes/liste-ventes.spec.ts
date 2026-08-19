import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import { ListeVentes } from './liste-ventes';
import { provideAppConfig } from '../../../core/config/app-config';
import type { Vente } from '../../../core/api/api-types';

const URL = '/api/v1/ventes';

const VENTES: Vente[] = [
  {
    id: 9,
    code: 'V-0009',
    dateVente: '2026-08-19T10:00:00',
    commentaire: 'Vente comptoir',
    lignes: [{ id: 1, articleDesignation: 'Ciment', quantite: 2, prixUnitaire: 7155 }],
  },
];

function page(contenu: Vente[]) {
  return {
    content: contenu,
    pageNumber: 0,
    pageSize: 20,
    totalElements: contenu.length,
    totalPages: 1,
    isLast: true,
  };
}

async function monter(contenu: Vente[] = VENTES) {
  await TestBed.configureTestingModule({
    imports: [ListeVentes],
    providers: [
      provideRouter([{ path: '**', children: [] }]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAppConfig(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ListeVentes);
  fixture.detectChanges();

  TestBed.inject(HttpTestingController)
    .expectOne((requete) => requete.url === URL)
    .flush(page(contenu));
  await fixture.whenStable();

  return fixture;
}

describe('ListeVentes', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('calcule le total de chaque vente à partir de ses lignes', async () => {
    const fixture = await monter();
    const texte = ((fixture.nativeElement as HTMLElement).textContent ?? '').replace(/\s/gu, ' ');

    // Le backend ne renvoie aucun total pour une vente : il est dérivé des lignes.
    expect(texte).toContain('14 310 FCFA');
  });

  it('ne propose ni modification ni suppression', async () => {
    const fixture = await monter();
    const lignes = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');

    expect(lignes[0]?.textContent).toContain('Ouvrir');
    expect(lignes[0]?.textContent).not.toContain('Supprimer');
    expect(lignes[0]?.textContent).not.toContain('Modifier');
  });

  it('dit qu’aucune vente ne porte le code cherché', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    const champ = racine.querySelector<HTMLInputElement>('#vente-code');
    if (champ === null) {
      throw new Error('Le champ de recherche est absent');
    }
    champ.value = 'V-9999';
    champ.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    racine.querySelector('.ventes__recherche')?.dispatchEvent(new Event('submit'));
    await Promise.resolve();
    fixture.detectChanges();

    TestBed.inject(HttpTestingController).expectOne(`${URL}/code/V-9999`).flush(
      { status: 404, message: 'Vente introuvable', path: '/api/v1/ventes/code/V-9999' },
      {
        status: 404,
        statusText: 'Not Found',
      },
    );
    await fixture.whenStable();
    await fixture.whenStable();

    expect(racine.textContent).toContain('Aucune vente ne porte le code');
  });
});
