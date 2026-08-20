import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import { AlertesStock } from './alertes-stock';
import { provideAppConfig } from '../../../core/config/app-config';
import type { AlerteStock } from '../../../core/api/api-types';

const URL = '/api/v1/mouvements-stock/alertes-stock';

const ALERTES: AlerteStock[] = [
  { articleId: 1, code: 'CIM', designation: 'Ciment', quantiteStock: 18, seuilMinimum: 20 },
  { articleId: 2, code: 'SAB', designation: 'Sable', quantiteStock: 0, seuilMinimum: 10 },
  { articleId: 3, code: 'FER', designation: 'Fer à béton', quantiteStock: 5, seuilMinimum: 20 },
];

async function monter(alertes: AlerteStock[] = ALERTES) {
  await TestBed.configureTestingModule({
    imports: [AlertesStock],
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideAppConfig(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AlertesStock);
  fixture.detectChanges();

  TestBed.inject(HttpTestingController).expectOne(URL).flush(alertes);
  await fixture.whenStable();

  return fixture;
}

describe('AlertesStock', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  it('place le plus critique en tête', async () => {
    const fixture = await monter();

    const designations = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('tbody td:nth-child(2)'),
    ).map((cellule) => cellule.textContent?.trim());

    // Rupture d'abord, puis l'écart au seuil le plus grand : 0/10, 5/20, 18/20.
    expect(designations).toEqual(['Sable', 'Fer à béton', 'Ciment']);
  });

  it('mesure chaque ligne par rapport à son propre seuil', async () => {
    const fixture = await monter();
    const jauges = (fixture.nativeElement as HTMLElement).querySelectorAll('app-jauge-seuil');

    expect(jauges).toHaveLength(3);
    expect(jauges[0]?.getAttribute('data-etat')).toBe('rupture');
    expect(jauges[2]?.getAttribute('aria-valuenow')).toBe('18');
  });

  it('dit que tout va bien plutôt que d’afficher un tableau vide', async () => {
    const fixture = await monter([]);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Aucune alerte');
  });
});
