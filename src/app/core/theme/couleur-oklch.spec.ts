import { describe, expect, it } from 'vitest';
import {
  BLANC,
  NIVEAUX_RAMPE,
  NOIR_DOUX,
  contraste,
  contrasteSurMarque,
  genererRampe,
  luminanceRelative,
  niveauMarqueLisible,
  oklchVersRvb,
  versCssOklch,
  type CouleurOklch,
} from './couleur-oklch';

const AMORCE_PAR_DEFAUT: CouleurOklch = { l: 0.55, c: 0.13, h: 250 };

describe('conversion OKLCH vers sRGB', () => {
  it('rend le blanc et le noir', () => {
    const blanc = oklchVersRvb({ l: 1, c: 0, h: 0 });
    expect(blanc.r).toBeCloseTo(1, 2);
    expect(blanc.g).toBeCloseTo(1, 2);
    expect(blanc.b).toBeCloseTo(1, 2);

    const noir = oklchVersRvb({ l: 0, c: 0, h: 0 });
    expect(noir.r).toBeCloseTo(0, 2);
  });

  it('borne les couleurs hors gamut au lieu de produire des valeurs aberrantes', () => {
    const horsGamut = oklchVersRvb({ l: 0.5, c: 0.9, h: 150 });

    for (const canal of [horsGamut.r, horsGamut.g, horsGamut.b]) {
      expect(canal).toBeGreaterThanOrEqual(0);
      expect(canal).toBeLessThanOrEqual(1);
    }
  });

  it('donne au blanc une luminance de 1 et au noir de 0', () => {
    expect(luminanceRelative({ r: 1, g: 1, b: 1 })).toBeCloseTo(1, 3);
    expect(luminanceRelative({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 3);
  });

  it('mesure le contraste maximal entre noir et blanc', () => {
    expect(contraste({ l: 1, c: 0, h: 0 }, { l: 0, c: 0, h: 0 })).toBeCloseTo(21, 0);
  });
});

describe('génération de rampe', () => {
  it('produit un niveau par échelon, dans l’ordre du plus clair au plus sombre', () => {
    const rampe = genererRampe(AMORCE_PAR_DEFAUT);

    expect(Object.keys(rampe)).toHaveLength(NIVEAUX_RAMPE.length);

    const clartes = NIVEAUX_RAMPE.map((niveau) => rampe[niveau].l);
    // Strictement décroissante : déjà triée du plus clair au plus sombre, sans doublon.
    expect([...clartes].sort((a, b) => b - a)).toEqual(clartes);
    expect(new Set(clartes).size).toBe(clartes.length);
  });

  it('conserve la teinte de l’amorce sur toute la rampe', () => {
    const rampe = genererRampe({ l: 0.62, c: 0.19, h: 27 });

    for (const niveau of NIVEAUX_RAMPE) {
      expect(rampe[niveau].h).toBe(27);
    }
  });

  it('n’excède jamais le chroma affichable', () => {
    const rampe = genererRampe({ l: 0.55, c: 0.9, h: 320 });

    for (const niveau of NIVEAUX_RAMPE) {
      expect(rampe[niveau].c).toBeLessThanOrEqual(0.37);
    }
  });

  it('écrit une couleur CSS lisible', () => {
    expect(versCssOklch({ l: 0.55, c: 0.13, h: 250 })).toBe('oklch(0.550 0.130 250.0)');
  });
});

describe('contraste garanti sur la couleur de marque', () => {
  it('pose du texte sombre sur une marque claire, du texte clair sur une marque sombre', () => {
    expect(contrasteSurMarque({ l: 0.92, c: 0.12, h: 95 })).toEqual(NOIR_DOUX);
    expect(contrasteSurMarque({ l: 0.32, c: 0.12, h: 250 })).toEqual(BLANC);
  });

  it('trouve un niveau de marque lisible pour toutes les teintes du cercle', () => {
    for (let teinte = 0; teinte < 360; teinte += 15) {
      const rampe = genererRampe({ l: 0.55, c: 0.13, h: teinte });
      const niveau = niveauMarqueLisible(rampe);

      if (niveau === null) {
        throw new Error(`aucun niveau de marque lisible pour la teinte ${teinte}`);
      }

      const fond = rampe[niveau];
      expect(contraste(fond, contrasteSurMarque(fond)), `teinte ${teinte}`).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });

  it('reste lisible même avec une amorce très claire ou très saturée', () => {
    for (const amorce of [
      { l: 0.95, c: 0.05, h: 90 },
      { l: 0.2, c: 0.02, h: 210 },
      { l: 0.7, c: 0.32, h: 340 },
    ] satisfies CouleurOklch[]) {
      const rampe = genererRampe(amorce);
      const niveau = niveauMarqueLisible(rampe);

      if (niveau === null) {
        throw new Error(`aucun niveau de marque lisible pour l'amorce ${JSON.stringify(amorce)}`);
      }

      const fond = rampe[niveau];

      expect(contraste(fond, contrasteSurMarque(fond))).toBeGreaterThanOrEqual(4.5);
    }
  });
});
