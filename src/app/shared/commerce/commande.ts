import type { EtatCommande } from '../../core/api/api-types';
import type { LigneSaisie } from './lignes';

/** Une ligne de commande telle qu'elle se lit, prix compris. */
export interface LigneCommandeVue {
  readonly articleId?: number;
  readonly articleDesignation?: string;
  readonly quantite?: number;
  readonly prixUnitaireHt?: number;
  readonly prixUnitaireTtc?: number;
}

/**
 * Une commande, débarrassée de ce qui distingue un client d'un fournisseur.
 *
 * Les deux DTO du backend ne diffèrent que par le nom de leur tiers — `idClient` d'un côté,
 * `idFournisseur` de l'autre. Les écrans travaillent sur cette forme commune ; chaque module
 * fournit la traduction dans les deux sens.
 */
export interface CommandeVue {
  readonly id?: number;
  readonly code?: string;
  readonly date?: string;
  readonly etat?: EtatCommande;
  readonly tiersId?: number;
  readonly tiersNom: string;
  readonly totalHt?: number;
  readonly totalTva?: number;
  readonly totalTtc?: number;
  readonly lignes: readonly LigneCommandeVue[];
}

/**
 * Ce que l'écran de saisie produit. Le module le traduit ensuite dans son propre DTO.
 *
 * Le code de commande n'y figure pas : c'est le serveur qui l'attribue, et lui seul peut
 * garantir qu'il est unique dans l'entreprise.
 */
export interface SaisieCommande {
  date: string;
  tiersId: string;
  lignes: LigneSaisie[];
}

/** Un tiers tel qu'une liste déroulante l'affiche. */
export interface OptionTiers {
  readonly id?: number;
  readonly nom?: string;
  readonly prenom?: string;
}

export function libelleTiers(tiers: OptionTiers): string {
  return `${tiers.prenom ?? ''} ${tiers.nom ?? ''}`.trim();
}

/** Date du jour au format attendu par le backend (`yyyy-MM-dd`). */
export function aujourdHui(): string {
  return new Date().toISOString().slice(0, 10);
}

export function saisieDepuis(commande: CommandeVue | null): SaisieCommande {
  return {
    date: commande?.date ?? aujourdHui(),
    tiersId: commande?.tiersId === undefined ? '' : String(commande.tiersId),
    lignes: (commande?.lignes ?? []).map((ligne) => ({
      articleId: ligne.articleId === undefined ? '' : String(ligne.articleId),
      quantite: ligne.quantite ?? 1,
    })),
  };
}
