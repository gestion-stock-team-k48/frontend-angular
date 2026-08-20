/**
 * Génération de palette en OKLCH.
 *
 * OKLCH est choisi parce que sa clarté est perceptuellement uniforme : deux teintes
 * différentes prises à la même clarté paraissent également sombres. Une rampe construite
 * ainsi garde des écarts réguliers quelle que soit la couleur d'amorce choisie par
 * l'entreprise, ce qu'une rampe en HSL ne garantit pas.
 */

export interface CouleurOklch {
  /** Clarté perceptuelle, de 0 (noir) à 1 (blanc). */
  readonly l: number;
  /** Chroma, à partir de 0. Au-delà d'environ 0,37 la couleur sort de l'écran. */
  readonly c: number;
  /** Teinte, en degrés. */
  readonly h: number;
}

export interface CouleurRvb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/** Niveaux de la rampe, du plus clair au plus sombre. */
export const NIVEAUX_RAMPE = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

export type NiveauRampe = (typeof NIVEAUX_RAMPE)[number];

export type Rampe = Readonly<Record<NiveauRampe, CouleurOklch>>;

/**
 * Clartés visées par niveau. Resserrées vers les extrémités : c'est là que l'œil
 * distingue le moins, et qu'une progression linéaire paraîtrait irrégulière.
 */
const CLARTES: readonly number[] = [
  0.971, 0.936, 0.885, 0.828, 0.746, 0.653, 0.563, 0.478, 0.398, 0.322, 0.251,
];

/**
 * Chroma relatif au chroma de l'amorce. La courbe culmine au milieu de la rampe : un ton
 * très clair ou très sombre fortement saturé paraît sale, et supporte mal le texte.
 */
const FACTEURS_CHROMA: readonly number[] = [
  0.22, 0.36, 0.58, 0.78, 0.93, 1.0, 1.0, 0.94, 0.83, 0.69, 0.55,
];

function borner(valeur: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, valeur));
}

/** Construit la rampe complète à partir d'une seule couleur d'amorce. */
export function genererRampe(amorce: CouleurOklch): Rampe {
  const rampe: Partial<Record<NiveauRampe, CouleurOklch>> = {};

  NIVEAUX_RAMPE.forEach((niveau, index) => {
    const clarte = CLARTES[index] ?? amorce.l;
    const facteur = FACTEURS_CHROMA[index] ?? 1;
    rampe[niveau] = {
      l: clarte,
      c: borner(amorce.c * facteur, 0, 0.37),
      h: amorce.h,
    };
  });

  return rampe as Rampe;
}

/** Écrit une couleur au format CSS `oklch()`, arrondie pour rester lisible. */
export function versCssOklch(couleur: CouleurOklch): string {
  return `oklch(${couleur.l.toFixed(3)} ${couleur.c.toFixed(3)} ${couleur.h.toFixed(1)})`;
}

/**
 * Convertit OKLCH en sRGB. Enchaînement : OKLCH → OKLab → LMS → sRGB linéaire → sRGB.
 * Les composantes sont bornées à [0, 1] : une couleur hors gamut est ramenée au bord.
 */
export function oklchVersRvb(couleur: CouleurOklch): CouleurRvb {
  const radians = (couleur.h * Math.PI) / 180;
  const a = couleur.c * Math.cos(radians);
  const b = couleur.c * Math.sin(radians);

  const lCube = couleur.l + 0.3963377774 * a + 0.2158037573 * b;
  const mCube = couleur.l - 0.1055613458 * a - 0.0638541728 * b;
  const sCube = couleur.l - 0.0894841775 * a - 1.291485548 * b;

  const lLineaire = lCube ** 3;
  const mLineaire = mCube ** 3;
  const sLineaire = sCube ** 3;

  return {
    r: versSrgb(4.0767416621 * lLineaire - 3.3077115913 * mLineaire + 0.2309699292 * sLineaire),
    g: versSrgb(-1.2684380046 * lLineaire + 2.6097574011 * mLineaire - 0.3413193965 * sLineaire),
    b: versSrgb(-0.0041960863 * lLineaire - 0.7034186147 * mLineaire + 1.707614701 * sLineaire),
  };
}

/** Applique la correction gamma sRGB et borne le résultat. */
function versSrgb(canalLineaire: number): number {
  const borne = borner(canalLineaire, 0, 1);
  const corrige = borne <= 0.0031308 ? borne * 12.92 : 1.055 * borne ** (1 / 2.4) - 0.055;
  return borner(corrige, 0, 1);
}

/** Luminance relative au sens de WCAG 2. */
export function luminanceRelative(couleur: CouleurRvb): number {
  const canal = (valeur: number): number =>
    valeur <= 0.04045 ? valeur / 12.92 : ((valeur + 0.055) / 1.055) ** 2.4;

  return 0.2126 * canal(couleur.r) + 0.7152 * canal(couleur.g) + 0.0722 * canal(couleur.b);
}

/** Rapport de contraste WCAG entre deux couleurs, de 1 à 21. */
export function contraste(premiere: CouleurOklch, seconde: CouleurOklch): number {
  const a = luminanceRelative(oklchVersRvb(premiere));
  const b = luminanceRelative(oklchVersRvb(seconde));
  const claire = Math.max(a, b);
  const sombre = Math.min(a, b);
  return (claire + 0.05) / (sombre + 0.05);
}

/** Blanc et quasi-noir utilisés comme texte sur un fond de marque. */
export const BLANC: CouleurOklch = { l: 1, c: 0, h: 0 };
export const NOIR_DOUX: CouleurOklch = { l: 0.18, c: 0.01, h: 260 };

/**
 * Choisit la couleur de texte à poser sur un fond de marque, en retenant celle qui
 * contraste le plus. Une amorce claire ne doit jamais produire un bouton illisible.
 */
export function contrasteSurMarque(fond: CouleurOklch): CouleurOklch {
  return contraste(fond, BLANC) >= contraste(fond, NOIR_DOUX) ? BLANC : NOIR_DOUX;
}

/**
 * Retient, dans la rampe, le niveau utilisable comme fond de marque : le plus proche de
 * l'amorce qui atteigne le seuil WCAG AA de 4,5:1 avec sa propre couleur de texte.
 * Renvoie `null` si aucun niveau n'y parvient, ce qui ne devrait pas arriver.
 */
export function niveauMarqueLisible(rampe: Rampe, seuil = 4.5): NiveauRampe | null {
  const ordreDePreference: readonly NiveauRampe[] = [500, 600, 700, 400, 800, 300, 900];

  for (const niveau of ordreDePreference) {
    const fond = rampe[niveau];
    if (contraste(fond, contrasteSurMarque(fond)) >= seuil) {
      return niveau;
    }
  }

  return null;
}
