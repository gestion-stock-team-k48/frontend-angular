import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { NIVEAUX_RAMPE, genererRampe } from './couleur-oklch';
import { AMORCE_PAR_DEFAUT } from './theme';

/**
 * Les valeurs de `--brand-*` figurent en dur dans la feuille de tokens pour que le premier
 * rendu soit correct avant que le script ne prenne la main. Elles doivent rester identiques
 * à ce que produit le générateur pour l'amorce par défaut : ce test verrouille l'accord
 * entre les deux, qui sinon divergerait silencieusement.
 *
 * La comparaison porte sur les nombres, pas sur le texte : le formateur normalise l'écriture
 * — il retire notamment les zéros terminaux — sans changer la couleur.
 */
describe('tokens statiques de la rampe de marque', () => {
  const feuille = readFileSync('src/styles/tokens/_primitifs.scss', 'utf-8');
  const rampe = genererRampe(AMORCE_PAR_DEFAUT);

  function lireTokenOklch(nom: string): { l: number; c: number; h: number } | null {
    const declaration = new RegExp(`${nom}:\\s*oklch\\(([^)]+)\\)`).exec(feuille);
    if (declaration === null) {
      return null;
    }

    const composantes = (declaration[1] ?? '').trim().split(/\s+/).map(Number);
    const [l, c, h] = composantes;

    if (l === undefined || c === undefined || h === undefined || composantes.some(Number.isNaN)) {
      return null;
    }

    return { l, c, h };
  }

  it.each(NIVEAUX_RAMPE)('--brand-%i correspond au générateur', (niveau) => {
    const declare = lireTokenOklch(`--brand-${niveau}`);
    const attendu = rampe[niveau];

    expect(declare, `--brand-${niveau} absent ou illisible dans _primitifs.scss`).not.toBeNull();
    expect(declare?.l).toBeCloseTo(attendu.l, 3);
    expect(declare?.c).toBeCloseTo(attendu.c, 3);
    expect(declare?.h).toBeCloseTo(attendu.h, 1);
  });
});
