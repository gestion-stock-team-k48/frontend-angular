import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { GraphiqueTemporel } from './graphique-temporel';
import type { PointSerie } from './serie';

const POINTS: PointSerie[] = [
  { libelle: 'juin', detail: '2026-06', valeur: 12000 },
  { libelle: 'juil', detail: '2026-07', valeur: 48000 },
  { libelle: 'août', detail: '2026-08', valeur: 30000 },
];

@Component({
  imports: [GraphiqueTemporel],
  template: `<app-graphique-temporel
    titre="Chiffre d'affaires par mois"
    [points]="points()"
    [formater]="formater"
  />`,
})
class Hote {
  readonly points = signal<PointSerie[]>(POINTS);
  readonly formater = (valeur: number) => `${valeur} F`;
}

async function monter() {
  await TestBed.configureTestingModule({ imports: [Hote] }).compileComponents();
  const fixture = TestBed.createComponent(Hote);
  await fixture.whenStable();
  return fixture;
}

describe('GraphiqueTemporel', () => {
  it('trace un point par période, avec son abscisse', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelectorAll('.graphique__point')).toHaveLength(3);
    expect(racine.textContent).toContain('juil');
  });

  it('double le dessin d’une table de données', async () => {
    const fixture = await monter();
    const lignes = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.graphique__donnees tbody tr',
    );

    // Le lecteur d'écran, l'impression et qui veut le chiffre exact passent par là.
    expect(lignes).toHaveLength(3);
    expect(lignes[1]?.textContent).toContain('48000 F');
  });

  it('montre la valeur survolée plutôt que d’étiqueter chaque point', async () => {
    const fixture = await monter();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('.graphique__infobulle')).toBeNull();

    racine.querySelectorAll('.graphique__cible')[1]?.dispatchEvent(new Event('mouseenter'));
    await fixture.whenStable();

    const infobulle = racine.querySelector('.graphique__infobulle');
    expect(infobulle?.textContent).toContain('2026-07');
    expect(infobulle?.textContent).toContain('48000 F');
  });

  it('dit qu’il n’y a rien plutôt que de tracer une ligne plate sans mot', async () => {
    const fixture = await monter();
    fixture.componentInstance.points.set([
      { libelle: 'juin', valeur: 0 },
      { libelle: 'juil', valeur: 0 },
    ]);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Aucune donnée');
  });
});
