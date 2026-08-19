import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import { ListeArticles } from './liste-articles';
import { provideAppConfig } from '../../../core/config/app-config';
import type { Article } from '../../../core/api/api-types';
import type { ReponsePage } from '../../../core/api/pagination';

const URL = '/api/v1/articles';

const ARTICLE: Article = {
  id: 12,
  code: 'ART-001',
  designation: 'Ciment 50 kg',
  categoryId: 3,
  categoryDesignation: 'Ciment',
  prixUnitaireHt: 6000,
  tauxTva: 19.25,
  prixUnitaireTtc: 7155,
  seuilMinimum: 20,
};

function page(articles: Article[], numero = 0, derniere = true): ReponsePage<Article> {
  return {
    content: articles,
    pageNumber: numero,
    pageSize: 20,
    totalElements: articles.length,
    totalPages: articles.length === 0 ? 0 : 1,
    isLast: derniere,
  };
}

function requeteListe(): TestRequest {
  return TestBed.inject(HttpTestingController).expectOne((requete) => requete.url === URL);
}

async function monter(contenu: Article[] = [ARTICLE]) {
  await TestBed.configureTestingModule({
    imports: [ListeArticles],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAppConfig(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(ListeArticles);
  fixture.detectChanges();

  const premiere = requeteListe();
  premiere.flush(page(contenu));
  await fixture.whenStable();

  return { fixture, premiere };
}

describe('ListeArticles', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('demande explicitement la page, la taille et le tri', async () => {
    const { premiere } = await monter();

    expect(premiere.request.params.get('page')).toBe('0');
    expect(premiere.request.params.get('size')).toBe('20');
    expect(premiere.request.params.get('sort')).toBe('code,asc');
  });

  it('affiche les montants dans la devise configurée', async () => {
    const { fixture } = await monter();
    const texte = ((fixture.nativeElement as HTMLElement).textContent ?? '').replace(/\s/gu, ' ');

    expect(texte).toContain('6 000 FCFA');
    expect(texte).toContain('7 155 FCFA');
    expect(texte).toContain('Ciment 50 kg');
  });

  it('recharge en repartant de la première page quand le tri change', async () => {
    const { fixture } = await monter();

    (fixture.nativeElement as HTMLElement)
      .querySelectorAll<HTMLButtonElement>('.tableau__tri')[1]
      ?.click();
    fixture.detectChanges();

    const suivante = requeteListe();
    expect(suivante.request.params.get('sort')).toBe('designation,asc');
    expect(suivante.request.params.get('page')).toBe('0');

    suivante.flush(page([ARTICLE]));
    await fixture.whenStable();
  });

  it('propose de créer un article quand le catalogue est vide', async () => {
    const { fixture } = await monter([]);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Aucun article');
  });
});
