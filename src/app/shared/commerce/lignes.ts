/** Une ligne en cours de saisie. L'article est tenu en texte : c'est la valeur d'un `select`. */
export interface LigneSaisie {
  articleId: string;
  quantite: number;
}

export interface ArticleTarife {
  readonly id?: number;
  readonly designation?: string;
  readonly prixUnitaireHt?: number;
  readonly prixUnitaireTtc?: number;
}

export function ligneVide(): LigneSaisie {
  return { articleId: '', quantite: 1 };
}

export function ligneComplete(ligne: LigneSaisie): boolean {
  return ligne.articleId !== '' && ligne.quantite > 0;
}

/** Une commande ou une vente a besoin d'au moins une ligne complète pour partir. */
export function lignesValides(lignes: readonly LigneSaisie[]): boolean {
  return lignes.length > 0 && lignes.every(ligneComplete);
}

/**
 * Total indicatif, calculé pour la seule saisie : le backend recalcule les totaux à partir
 * des prix qu'il a en base, et c'est le sien qui fait foi une fois la commande enregistrée.
 */
export function totalEstime(
  lignes: readonly LigneSaisie[],
  articles: readonly ArticleTarife[],
): number {
  return lignes.reduce((total, ligne) => {
    const article = articles.find((candidat) => String(candidat.id) === ligne.articleId);
    return total + (article?.prixUnitaireTtc ?? 0) * ligne.quantite;
  }, 0);
}
