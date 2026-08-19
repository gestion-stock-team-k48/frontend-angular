import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import { TableauDeBord } from './tableau-de-bord';
import { provideAppConfig } from '../../../core/config/app-config';
import type { AlerteStock, StatistiquesTableauDeBord } from '../../../core/api/api-types';

const URL_STATS = '/api/v1/dashboard/statistiques';
const URL_ALERTES = '/api/v1/mouvements-stock/alertes-stock';

const STATS: StatistiquesTableauDeBord = {
  chiffreAffairesTotal: 4500000,
  chiffreAffairesMoisCourant: 320000,
  commandesClientEnCours: 3,
  commandesClientLivrees: 41,
  commandesFournisseurEnCours: 1,
  commandesFournisseurLivrees: 12,
  topArticlesVendus: [
    { articleId: 1, designation: 'Ciment 50 kg', quantiteVendue: 120 },
    { articleId: 2, designation: 'Sable', quantiteVendue: 30 },
  ],
};

const ALERTES: AlerteStock[] = [
  { articleId: 1, code: 'CIM', designation: 'Ciment 50 kg', quantiteStock: 4, seuilMinimum: 20 },
];

async function monter(stats: StatistiquesTableauDeBord = STATS, alertes: AlerteStock[] = ALERTES) {
  await TestBed.configureTestingModule({
    imports: [TableauDeBord],
    providers: [
      provideRouter([{ path: '**', children: [] }]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAppConfig(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(TableauDeBord);
  fixture.detectChanges();

  const http = TestBed.inject(HttpTestingController);
  http.expectOne(URL_STATS).flush(stats);
  http.expectOne(URL_ALERTES).flush(alertes);
  await fixture.whenStable();

  return fixture;
}

function texte(fixture: Awaited<ReturnType<typeof monter>>): string {
  return ((fixture.nativeElement as HTMLElement).textContent ?? '').replace(/\s/gu, ' ');
}

/**
 * Les mesures courent vers leur valeur : le test attend la fin du décompte avant de lire
 * l'écran, plutôt que de figer une valeur intermédiaire.
 */
async function attendreLeDecompte(fixture: Awaited<ReturnType<typeof monter>>): Promise<void> {
  await new Promise((suite) => setTimeout(suite, 1100));
  fixture.detectChanges();
}

describe('TableauDeBord', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('affiche les chiffres du serveur dans la devise configurée', async () => {
    const fixture = await monter();
    await attendreLeDecompte(fixture);

    expect(texte(fixture)).toContain('320 000 FCFA');
    expect(texte(fixture)).toContain('4 500 000 FCFA');
    expect(texte(fixture)).toContain('41 livrées');
  });

  it('met les alertes de seuil en face de leur jauge', async () => {
    const fixture = await monter();
    const jauge = (fixture.nativeElement as HTMLElement).querySelector('app-jauge-seuil');

    expect(jauge?.getAttribute('aria-valuenow')).toBe('4');
    expect(jauge?.getAttribute('data-etat')).toBe('bas');
  });

  it('dit qu’il n’y a rien à réapprovisionner plutôt que d’afficher une liste vide', async () => {
    const fixture = await monter(STATS, []);

    expect(texte(fixture)).toContain('Aucun article sous son seuil');
  });

  it('met le classement des ventes à l’échelle du meilleur article', async () => {
    const fixture = await monter();
    const barres = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
      '.bord__barre-part',
    );

    // 120 fait la pleine largeur, 30 en fait le quart.
    expect(barres[0]?.style.inlineSize).toBe('100%');
    expect(barres[1]?.style.inlineSize).toBe('25%');
  });

  it('reste lisible quand rien n’a encore été vendu', async () => {
    const fixture = await monter({ ...STATS, topArticlesVendus: [] });

    expect(texte(fixture)).toContain('Aucune vente enregistrée');
  });
});
