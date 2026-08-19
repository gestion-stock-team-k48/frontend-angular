import { describe, expect, it } from 'vitest';
import { cleMois, douzeDerniersMois, graduations, plafond, serieEntiere } from './serie';

describe('graduations', () => {
  it('choisit un pas lisible plutôt qu’une division exacte', () => {
    expect(graduations(93)).toEqual([0, 25, 50, 75, 100]);
    expect(graduations(4)).toEqual([0, 1, 2, 3, 4]);
  });

  it('reste utilisable sur une série vide', () => {
    expect(graduations(0)).toEqual([0]);
  });

  it('ne répète pas ses repères sur une série de comptages', () => {
    // Sans pas minimal, un maximum de 1 donnerait 0 / 0,25 / 0,5 / 0,75 / 1 — soit
    // « 0 0 1 1 1 » une fois arrondi à l'affichage.
    expect(graduations(1, 4, 1)).toEqual([0, 1]);
    expect(graduations(3, 4, 1)).toEqual([0, 1, 2, 3]);
  });
});

describe('serieEntiere', () => {
  it('reconnaît une série de comptages', () => {
    expect(serieEntiere([0, 3, 12])).toBe(true);
    expect(serieEntiere([0, 3.5])).toBe(false);
  });
});

describe('plafond', () => {
  it('monte jusqu’à la dernière graduation, pour que la barre la plus haute respire', () => {
    expect(plafond([93, 12])).toBe(100);
  });

  it('ne descend jamais à zéro, ce qui rendrait l’échelle indivisible', () => {
    expect(plafond([])).toBe(1);
    expect(plafond([0, 0])).toBe(1);
  });
});

describe('douzeDerniersMois', () => {
  it('finit sur le mois courant et remonte onze mois', () => {
    const mois = douzeDerniersMois(new Date(2026, 7, 20));

    expect(mois).toHaveLength(12);
    expect(mois[11]?.cle).toBe('2026-08');
    expect(mois[0]?.cle).toBe('2025-09');
  });
});

describe('cleMois', () => {
  it('range une date ISO dans son mois', () => {
    expect(cleMois('2026-08-19')).toBe('2026-08');
    expect(cleMois('2026-01-02T10:00:00')).toBe('2026-01');
  });

  it('ignore ce qui n’est pas une date', () => {
    expect(cleMois(undefined)).toBeNull();
    expect(cleMois('bientôt')).toBeNull();
  });
});
