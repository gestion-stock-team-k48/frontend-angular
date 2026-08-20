import type { SourceMouvementStock, TypeMouvementStock } from '../../core/api/api-types';

/**
 * Vocabulaire de l'utilisateur, jamais celui du code : l'écran affiche « Correction
 * positive », pas `CORRECTION_POS`.
 */
const TYPES: Readonly<Record<TypeMouvementStock, string>> = {
  ENTREE: 'Entrée',
  SORTIE: 'Sortie',
  CORRECTION_POS: 'Correction positive',
  CORRECTION_NEG: 'Correction négative',
};

const SOURCES: Readonly<Record<SourceMouvementStock, string>> = {
  COMMANDE_CLIENT: 'Commande client',
  COMMANDE_FOURNISSEUR: 'Commande fournisseur',
  VENTE: 'Vente',
  STOCK_INITIAL: 'Stock initial',
  CORRECTION_MANUELLE: 'Correction manuelle',
};

/** Sources proposées à la saisie, dans l'ordre où elles se rencontrent. */
export const SOURCES_PROPOSEES: readonly { valeur: SourceMouvementStock; libelle: string }[] = (
  Object.keys(SOURCES) as SourceMouvementStock[]
).map((valeur) => ({ valeur, libelle: SOURCES[valeur] }));

export function libelleType(type: TypeMouvementStock | undefined): string {
  return type === undefined ? '—' : TYPES[type];
}

export function libelleSource(source: SourceMouvementStock | undefined): string {
  return source === undefined ? '—' : SOURCES[source];
}

/** Un mouvement ajoute ou retire : c'est ce que le signe dit à la lecture d'une ligne. */
export function ajouteAuStock(type: TypeMouvementStock | undefined): boolean {
  return type === 'ENTREE' || type === 'CORRECTION_POS';
}

/** Le `select` ne rend que du texte : ce garde-fou le ramène dans le type de la source. */
export function estSourceConnue(valeur: string): valeur is SourceMouvementStock {
  return Object.hasOwn(SOURCES, valeur);
}
