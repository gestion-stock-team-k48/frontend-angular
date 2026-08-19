import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import { NouvelleVente } from './nouvelle-vente';
import { provideAppConfig } from '../../../core/config/app-config';

const URL_VENTES = '/api/v1/ventes';
const URL_ARTICLES = '/api/v1/articles';

const ARTICLES = {
  content: [{ id: 4, designation: 'Ciment', prixUnitaireHt: 6000, prixUnitaireTtc: 7155 }],
  pageNumber: 0,
  pageSize: 200,
  totalElements: 1,
  totalPages: 1,
  isLast: true,
};

async function monter() {
  await TestBed.configureTestingModule({
    imports: [NouvelleVente],
    providers: [
      provideRouter([{ path: '**', children: [] }]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAppConfig(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(NouvelleVente);
  fixture.detectChanges();

  TestBed.inject(HttpTestingController)
    .expectOne((requete) => requete.url === URL_ARTICLES)
    .flush(ARTICLES);
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

describe('NouvelleVente', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('prévient que l’écriture est définitive avant de la demander', async () => {
    const fixture = await monter();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'sort aussitôt les articles du stock',
    );
  });

  it('refuse une vente dont la ligne est incomplète', async () => {
    const fixture = await monter();

    await envoyer(fixture);

    TestBed.inject(HttpTestingController).expectNone({ url: URL_VENTES, method: 'POST' });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'au moins une ligne complète',
    );
  });

  it('envoie les lignes et omet le code laissé vide', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    saisir(racine, '.lignes__ligne select', '4');
    saisir(racine, '.lignes__ligne input[type="number"]', '2');
    saisir(racine, '#vente-commentaire', 'Vente comptoir');
    await fixture.whenStable();

    await envoyer(fixture);

    const requete = TestBed.inject(HttpTestingController).expectOne({
      url: URL_VENTES,
      method: 'POST',
    });
    expect(requete.request.body).toEqual({
      commentaire: 'Vente comptoir',
      lignes: [{ articleId: 4, quantite: 2 }],
    });

    requete.flush({ id: 9, code: 'V-0009' });
    await fixture.whenStable();
  });
});
