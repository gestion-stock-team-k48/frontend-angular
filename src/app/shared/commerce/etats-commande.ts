import type { TonBadge } from '../ui/badge/badge';
import type { EtatCommande } from '../../core/api/api-types';

/**
 * États d'une commande et transitions légales, relevés dans les deux services du backend.
 * Le serveur refuse toute autre transition ; l'interface ne propose que celles-ci.
 */
const TRANSITIONS: Readonly<Record<EtatCommande, readonly EtatCommande[]>> = {
  EN_PREPARATION: ['VALIDEE', 'ANNULEE'],
  VALIDEE: ['LIVREE', 'ANNULEE'],
  LIVREE: [],
  ANNULEE: [],
};

const LIBELLES: Readonly<Record<EtatCommande, string>> = {
  EN_PREPARATION: 'En préparation',
  VALIDEE: 'Validée',
  LIVREE: 'Livrée',
  ANNULEE: 'Annulée',
};

const TONS: Readonly<Record<EtatCommande, TonBadge>> = {
  EN_PREPARATION: 'neutre',
  VALIDEE: 'information',
  LIVREE: 'succes',
  ANNULEE: 'danger',
};

export interface ActionEtat {
  readonly bouton: string;
  readonly succes: string;
}

/**
 * Le bouton et le message qui suit emploient le même verbe : « Valider la commande » produit
 * « Commande validée ». C'est la règle d'écriture du projet.
 */
const ACTIONS: Readonly<Record<EtatCommande, ActionEtat>> = {
  EN_PREPARATION: { bouton: 'Remettre en préparation', succes: 'Commande remise en préparation' },
  VALIDEE: { bouton: 'Valider la commande', succes: 'Commande validée' },
  LIVREE: { bouton: 'Marquer livrée', succes: 'Commande livrée' },
  ANNULEE: { bouton: 'Annuler la commande', succes: 'Commande annulée' },
};

export function libelleEtat(etat: EtatCommande | undefined): string {
  return etat === undefined ? '—' : LIBELLES[etat];
}

export function tonEtat(etat: EtatCommande | undefined): TonBadge {
  return etat === undefined ? 'neutre' : TONS[etat];
}

export function transitionsLegales(etat: EtatCommande | undefined): readonly EtatCommande[] {
  return etat === undefined ? [] : TRANSITIONS[etat];
}

export function actionVers(etat: EtatCommande): ActionEtat {
  return ACTIONS[etat];
}

/**
 * Une commande ne se modifie que tant qu'elle est en préparation.
 *
 * Le backend, lui, accepte la modification à n'importe quel état : réécrire les lignes d'une
 * commande livrée laisserait derrière elle des mouvements de stock sans rapport. L'interface
 * s'interdit ce qu'elle ne saurait pas rattraper — l'écart est signalé dans le contrat d'API.
 */
export function modifiable(etat: EtatCommande | undefined): boolean {
  return etat === 'EN_PREPARATION';
}

/** Le backend refuse la suppression d'une commande livrée, pour la même raison. */
export function supprimable(etat: EtatCommande | undefined): boolean {
  return etat !== 'LIVREE';
}
