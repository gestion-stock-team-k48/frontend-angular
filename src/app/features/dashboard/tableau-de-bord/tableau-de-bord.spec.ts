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
const URL_VENTES = '/api/v1/ventes';
const URL_COMMANDES = '/api/v1/commandes-client';

/** Mois courant, au format des clés de série. */
const MOIS = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

function page(contenu: unknown[]) {
  return {
    content: contenu,
    pageNumber: 0,
    pageSize: 200,
    totalElements: contenu.length,
    totalPages: 1,
    isLast: true,
  };
}

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

async function monter(
  stats: StatistiquesTableauDeBord = STATS,
  alertes: AlerteStock[] = ALERTES,
  ventes: unknown[] = [
    {
      id: 1,
      dateVente: `${MOIS}-05T10:00:00`,
      lignes: [{ id: 1, quantite: 2, prixUnitaire: 7155 }],
    },
  ],
  commandes: unknown[] = [
    { id: 1, dateCommande: `${MOIS}-04`, etatCommande: 'LIVREE' },
    { id: 2, dateCommande: `${MOIS}-06`, etatCommande: 'VALIDEE' },
    { id: 3, dateCommande: `${MOIS}-07`, etatCommande: 'ANNULEE' },
  ],
) {
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
  http.expectOne((requete) => requete.url === URL_VENTES).flush(page(ventes));
  http.expectOne((requete) => requete.url === URL_COMMANDES).flush(page(commandes));
  await fixture.whenStable();

  return fixture;
}

function texte(fixture: Awaited<ReturnType<typeof monter>>): string {
  return ((fixture.nativeElement as HTMLElement).textContent ?? '').replace(/\s/gu, ' ');
}

describe('TableauDeBord', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('affiche les chiffres du serveur dans la devise configurée', async () => {
    // `test-setup.ts` déclare `prefers-reduced-motion` : les mesures sont posées d'un coup,
    // sans attente d'horloge. Il reste à laisser passer le cycle où l'effet les applique.
    const fixture = await monter();
    await fixture.whenStable();

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
      '.graphique__barre-part',
    );

    // 120 fait la pleine largeur, 30 en fait le quart.
    expect(barres[0]?.style.inlineSize).toBe('100%');
    expect(barres[1]?.style.inlineSize).toBe('25%');
  });

  it('agrège le chiffre d’affaires du mois à partir des ventes lues', async () => {
    const fixture = await monter();

    // 2 × 7 155 : le graphique reprend la définition du serveur, les ventes.
    const donnees = (fixture.nativeElement as HTMLElement).querySelector(
      '.graphique__donnees tbody',
    );
    expect(donnees?.textContent?.replace(/\s/gu, ' ')).toContain('14 310');
  });

  it('répartit les commandes par état, chacune nommée', async () => {
    const fixture = await monter();
    const legende = (fixture.nativeElement as HTMLElement).querySelector('.graphique__legende');

    expect(legende?.textContent).toContain('Livrées');
    expect(legende?.textContent).toContain('Annulées');
    // La couleur ne travaille jamais seule : chaque part porte son libellé et sa part.
    expect(legende?.textContent).toContain('33 %');
  });

  it('reste lisible quand rien n’a encore été vendu', async () => {
    const fixture = await monter({ ...STATS, topArticlesVendus: [] });

    expect(texte(fixture)).toContain("Aucune donnée pour l'instant");
  });
});
