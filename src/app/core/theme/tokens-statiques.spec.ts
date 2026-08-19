import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { NIVEAUX_RAMPE, genererRampe, versCssOklch } from './couleur-oklch';
import { AMORCE_PAR_DEFAUT } from './theme';

/**
 * Les valeurs de `--brand-*` figurent en dur dans la feuille de tokens pour que le premier
 * rendu soit correct avant que le script ne prenne la main. Elles doivent donc rester
 * identiques à ce que produit le générateur pour l'amorce par défaut : ce test verrouille
 * l'accord entre les deux, qui sinon divergerait silencieusement.
 */
describe('tokens statiques de la rampe de marque', () => {
  // Lu en texte brut plutôt que compilé : c'est le contenu écrit qui est vérifié.
  const feuille = readFileSync('src/styles/tokens/_primitifs.scss', 'utf-8');
  const rampe = genererRampe(AMORCE_PAR_DEFAUT);

  it.each(NIVEAUX_RAMPE)('--brand-%i correspond au générateur', (niveau) => {
    const attendu = versCssOklch(rampe[niveau]);
    const trouve = new RegExp(`--brand-${niveau}:\\s*([^;]+);`).exec(feuille);

    expect(trouve, `--brand-${niveau} absent de _primitifs.scss`).not.toBeNull();
    expect(trouve?.[1]?.trim()).toBe(attendu);
  });
});
