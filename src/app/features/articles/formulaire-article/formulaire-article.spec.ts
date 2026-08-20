import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import { FormulaireArticle } from './formulaire-article';
import { provideAppConfig } from '../../../core/config/app-config';
import type { Categorie } from '../../../core/api/api-types';

const URL_ARTICLES = '/api/v1/articles';
const URL_CATEGORIES = '/api/v1/categories';

const CATEGORIES: Categorie[] = [{ id: 3, code: 'CIM', designation: 'Ciment' }];

async function monter() {
  await TestBed.configureTestingModule({
    imports: [FormulaireArticle],
    providers: [
      // Une route attrape-tout : ces écrans naviguent après l'enregistrement.
      provideRouter([{ path: '**', children: [] }]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAppConfig(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(FormulaireArticle);
  fixture.detectChanges();

  TestBed.inject(HttpTestingController).expectOne(URL_CATEGORIES).flush(CATEGORIES);
  await fixture.whenStable();

  return fixture;
}

function saisir(racine: HTMLElement, selecteur: string, valeur: string): void {
  const controle = racine.querySelector<HTMLInputElement | HTMLSelectElement>(selecteur);
  if (controle === null) {
    throw new Error(`Contrôle introuvable : ${selecteur}`);
  }
  controle.value = valeur;
  // Un navigateur émet les deux sur un `select` ; jsdom n'en émet aucun tout seul.
  controle.dispatchEvent(new Event('input'));
  controle.dispatchEvent(new Event('change'));
}

describe('FormulaireArticle', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('n’appelle pas l’article en création : il n’y en a pas encore', async () => {
    const fixture = await monter();

    TestBed.inject(HttpTestingController).expectNone((requete) =>
      requete.url.startsWith(`${URL_ARTICLES}/`),
    );
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Nouvel article');
  });

  it('calcule le prix TTC à partir du HT et du taux', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    saisir(racine, '#article-prix-ht', '6000');
    saisir(racine, '#article-tva', '19.25');
    await fixture.whenStable();

    const texte = (racine.querySelector('.formulaire-article__calcul')?.textContent ?? '').replace(
      /\s/gu,
      ' ',
    );
    // 6 000 × 1,1925 = 7 155 : arrondi à l'unité, le franc CFA n'ayant pas de décimale.
    expect(texte).toContain('7 155 FCFA');
  });

  it('envoie le TTC calculé et la catégorie en nombre', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    saisir(racine, '#article-code', 'ART-001');
    saisir(racine, '#article-designation', 'Ciment 50 kg');
    saisir(racine, '#article-categorie', '3');
    saisir(racine, '#article-seuil', '20');
    saisir(racine, '#article-prix-ht', '6000');
    saisir(racine, '#article-tva', '19.25');
    await fixture.whenStable();

    racine.querySelector('form')?.dispatchEvent(new Event('submit'));
    // `submit()` enchaîne plusieurs microtâches avant d'atteindre l'appel réseau.
    for (let tour = 0; tour < 5; tour += 1) {
      await Promise.resolve();
      fixture.detectChanges();
    }

    const requete = TestBed.inject(HttpTestingController).expectOne({
      url: URL_ARTICLES,
      method: 'POST',
    });
    expect(requete.request.body).toEqual({
      code: 'ART-001',
      designation: 'Ciment 50 kg',
      categoryId: 3,
      seuilMinimum: 20,
      prixUnitaireHt: 6000,
      tauxTva: 19.25,
      prixUnitaireTtc: 7155,
    });

    requete.flush({ id: 1, code: 'ART-001', designation: 'Ciment 50 kg' });
    await fixture.whenStable();
  });

  it('refuse d’envoyer un formulaire sans catégorie', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    saisir(racine, '#article-code', 'ART-002');
    saisir(racine, '#article-designation', 'Sable');
    saisir(racine, '#article-prix-ht', '1000');
    await fixture.whenStable();

    racine.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    TestBed.inject(HttpTestingController).expectNone({ url: URL_ARTICLES, method: 'POST' });
    expect(racine.textContent).toContain('La catégorie est obligatoire');
  });
});
