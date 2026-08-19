/** Un point d'une série : une abscisse nommée, une valeur. */
export interface PointSerie {
  readonly libelle: string;
  readonly valeur: number;
  /** Libellé long, pour l'infobulle et la table de données. */
  readonly detail?: string;
}

/** Une part d'une répartition : un état, une quantité, un ton. */
export interface PartRepartition {
  readonly libelle: string;
  readonly valeur: number;
  readonly ton: 'neutre' | 'information' | 'succes' | 'avertissement' | 'danger';
}

/**
 * Graduations d'un axe de valeurs : quatre repères, arrondis à une décade lisible.
 *
 * `pasMinimal` évite les graduations qui se répètent une fois arrondies à l'affichage : sur
 * une série de comptages qui plafonne à 1, un pas de 0,25 donnerait « 0 0 1 1 1 ».
 */
export function graduations(maximum: number, nombre = 4, pasMinimal = 0): readonly number[] {
  if (maximum <= 0) {
    return [0];
  }

  const brut = maximum / nombre;
  const decade = 10 ** Math.floor(Math.log10(brut));
  const pas = [1, 2, 2.5, 5, 10]
    .map((facteur) => facteur * decade)
    .find((candidat) => candidat >= brut);
  const choisi = Math.max(pas ?? decade * 10, pasMinimal);

  const reperes: number[] = [];
  for (let valeur = 0; valeur <= maximum + choisi / 2; valeur += choisi) {
    reperes.push(valeur);
  }
  return reperes;
}

/** Échelle d'un axe de valeurs : le maximum affiché, arrondi sur la dernière graduation. */
export function plafond(valeurs: readonly number[], pasMinimal = 0): number {
  const maximum = Math.max(0, ...valeurs);
  const reperes = graduations(maximum, 4, pasMinimal);
  return Math.max(reperes[reperes.length - 1] ?? 1, 1);
}

/** Vrai si la série ne contient que des comptages : son axe se gradue alors en entiers. */
export function serieEntiere(valeurs: readonly number[]): boolean {
  return valeurs.every((valeur) => Number.isInteger(valeur));
}

/** Douze derniers mois, du plus ancien au plus récent, prêts à recevoir des valeurs. */
export function douzeDerniersMois(
  reference = new Date(),
): readonly { cle: string; libelle: string }[] {
  const mois = [];
  const format = new Intl.DateTimeFormat('fr', { month: 'short' });

  for (let recul = 11; recul >= 0; recul -= 1) {
    const date = new Date(reference.getFullYear(), reference.getMonth() - recul, 1);
    mois.push({
      cle: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      libelle: format.format(date).replace('.', ''),
    });
  }

  return mois;
}

/** Clé mensuelle d'une date ISO, ou `null` si la date est absente ou illisible. */
export function cleMois(date: string | undefined): string | null {
  if (date === undefined || date === '') {
    return null;
  }
  const instant = new Date(date);
  if (Number.isNaN(instant.getTime())) {
    return null;
  }
  return `${instant.getFullYear()}-${String(instant.getMonth() + 1).padStart(2, '0')}`;
}
