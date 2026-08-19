import { ROLE_ADMIN, type Role } from '../core/api/api-types';

export interface EntreeNavigation {
  readonly libelle: string;
  readonly chemin: string;
  /** Rôle requis. Sans rôle, l'entrée est visible de tous les utilisateurs connectés. */
  readonly role?: Role;
  /**
   * Faux tant que l'écran n'existe pas. L'entrée reste affichée, désactivée : cacher la
   * moitié de la navigation donnerait une fausse idée du périmètre de l'application.
   */
  readonly disponible: boolean;
}

export interface GroupeNavigation {
  readonly titre: string;
  readonly entrees: readonly EntreeNavigation[];
}

/**
 * Structure de la navigation, alignée sur les modules du backend.
 * Les libellés sont ceux du métier, jamais ceux du code.
 */
export const NAVIGATION: readonly GroupeNavigation[] = [
  {
    titre: 'Pilotage',
    entrees: [{ libelle: 'Tableau de bord', chemin: '/tableau-de-bord', disponible: false }],
  },
  {
    titre: 'Catalogue',
    entrees: [
      { libelle: 'Articles', chemin: '/articles', disponible: true },
      { libelle: 'Catégories', chemin: '/categories', disponible: true },
    ],
  },
  {
    titre: 'Stock',
    entrees: [
      { libelle: 'Mouvements de stock', chemin: '/mouvements-stock', disponible: false },
      { libelle: 'Alertes de seuil', chemin: '/mouvements-stock/alertes', disponible: false },
    ],
  },
  {
    titre: 'Tiers',
    entrees: [
      { libelle: 'Clients', chemin: '/clients', disponible: false },
      { libelle: 'Fournisseurs', chemin: '/fournisseurs', disponible: false },
    ],
  },
  {
    titre: 'Commerce',
    entrees: [
      { libelle: 'Commandes client', chemin: '/commandes-client', disponible: false },
      { libelle: 'Commandes fournisseur', chemin: '/commandes-fournisseur', disponible: false },
      { libelle: 'Ventes', chemin: '/ventes', disponible: false },
    ],
  },
  {
    titre: 'Administration',
    entrees: [
      { libelle: 'Entreprise', chemin: '/entreprise', role: ROLE_ADMIN, disponible: false },
      { libelle: 'Utilisateurs', chemin: '/utilisateurs', role: ROLE_ADMIN, disponible: false },
      { libelle: 'Apparence', chemin: '/parametres/apparence', disponible: true },
    ],
  },
];
