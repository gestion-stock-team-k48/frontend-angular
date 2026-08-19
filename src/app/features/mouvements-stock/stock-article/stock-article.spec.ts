import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import { StockArticle } from './stock-article';
import { provideAppConfig } from '../../../core/config/app-config';
import type { Article, MouvementStock } from '../../../core/api/api-types';

const ID = 12;
const URL_ARTICLE = `/api/v1/articles/${ID}`;
const URL_STOCK = `/api/v1/mouvements-stock/article/${ID}/stock-reel`;
const URL_HISTORIQUE = `/api/v1/mouvements-stock/article/${ID}`;

const ARTICLE: Article = {
  id: ID,
  code: 'CIM-50',
  designation: 'Ciment 50 kg',
  seuilMinimum: 20,
};

const MOUVEMENTS: MouvementStock[] = [
  {
    id: 1,
    dateMvt: '2026-08-19T09:00:00',
    quantite: 40,
    typeMvt: 'ENTREE',
    sourceMvt: 'STOCK_INITIAL',
  },
  {
    id: 2,
    dateMvt: '2026-08-19T10:00:00',
    quantite: 15,
    typeMvt: 'SORTIE',
    sourceMvt: 'VENTE',
  },
];

function page(mouvements: MouvementStock[]) {
  return {
    content: mouvements,
    pageNumber: 0,
    pageSize: 20,
    totalElements: mouvements.length,
    totalPages: 1,
    isLast: true,
  };
}

async function monter(stock = 25, mouvements = MOUVEMENTS) {
  await TestBed.configureTestingModule({
    imports: [StockArticle],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAppConfig(),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap({ id: String(ID) }) } },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(StockArticle);
  fixture.detectChanges();

  const http = TestBed.inject(HttpTestingController);
  http.expectOne(URL_ARTICLE).flush(ARTICLE);
  http.expectOne(URL_STOCK).flush(stock);
  http.expectOne((requete) => requete.url === URL_HISTORIQUE).flush(page(mouvements));
  await fixture.whenStable();

  return fixture;
}

describe('StockArticle', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('affiche le stock réel du serveur, jamais un calcul maison', async () => {
    const fixture = await monter(25);
    const jauge = (fixture.nativeElement as HTMLElement).querySelector('app-jauge-seuil');

    // 40 entrés puis 15 sortis feraient 25 : c'est le serveur qui le dit, l'écran le relaie.
    expect(jauge?.getAttribute('aria-valuenow')).toBe('25');
    expect(jauge?.getAttribute('data-etat')).toBe('ok');
  });

  it('signale un stock sous le seuil', async () => {
    const fixture = await monter(12);
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('app-jauge-seuil')?.getAttribute('data-etat')).toBe('bas');
    expect(racine.textContent).toContain('Sous le seuil');
  });

  it('donne le sens de chaque ligne d’historique', async () => {
    const fixture = await monter();
    const lignes = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr'),
    ).map((ligne) => ligne.textContent?.replace(/\s+/gu, ' ').trim());

    expect(lignes[0]).toContain('Entrée');
    expect(lignes[0]).toContain('+40');
    expect(lignes[1]).toContain('Sortie');
    expect(lignes[1]).toContain('−15');
    expect(lignes[1]).toContain('Vente');
  });

  it('redemande le stock au serveur après un mouvement', async () => {
    const fixture = await monter(25);
    const racine = fixture.nativeElement as HTMLElement;

    const entree = Array.from(racine.querySelectorAll('button')).find(
      (bouton) => bouton.textContent?.trim() === 'Entrée',
    );
    (entree as HTMLButtonElement).click();
    await fixture.whenStable();

    const quantite = racine.querySelector<HTMLInputElement>('#mouvement-quantite');
    if (quantite === null) {
      throw new Error('Le formulaire ne s’est pas ouvert');
    }
    quantite.value = '10';
    quantite.dispatchEvent(new Event('input'));

    const source = racine.querySelector<HTMLSelectElement>('#mouvement-source');
    if (source === null) {
      throw new Error('La source n’est pas proposée');
    }
    source.value = 'COMMANDE_FOURNISSEUR';
    source.dispatchEvent(new Event('input'));
    source.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    racine.querySelector('form')?.dispatchEvent(new Event('submit'));
    for (let tour = 0; tour < 5; tour += 1) {
      await Promise.resolve();
      fixture.detectChanges();
    }

    const http = TestBed.inject(HttpTestingController);
    const envoi = http.expectOne('/api/v1/mouvements-stock/entree');
    expect(envoi.request.body).toEqual({
      articleId: ID,
      quantite: 10,
      sourceMvt: 'COMMANDE_FOURNISSEUR',
    });

    envoi.flush({ id: 3, quantite: 10, typeMvt: 'ENTREE', sourceMvt: 'COMMANDE_FOURNISSEUR' });
    for (let tour = 0; tour < 5; tour += 1) {
      await Promise.resolve();
      fixture.detectChanges();
    }

    // Le stock réel et l'historique sont relus ; l'article, lui, n'a pas bougé.
    http.expectOne(URL_STOCK).flush(35);
    http.expectOne((requete) => requete.url === URL_HISTORIQUE).flush(page(MOUVEMENTS));
    await fixture.whenStable();

    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('app-jauge-seuil')
        ?.getAttribute('aria-valuenow'),
    ).toBe('35');
  });
});
