import { ROLE_ADMIN, type Role } from '../core/api/api-types';
import type { NomIcone } from '../shared/ui/icone/icone';

export interface EntreeNavigation {
  readonly libelle: string;
  readonly chemin: string;
  /** Icône de l'entrée. Elle seule reste visible quand la navigation est repliée en rail. */
  readonly icone: NomIcone;
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
    entrees: [
      {
        libelle: 'Tableau de bord',
        chemin: '/tableau-de-bord',
        icone: 'tableau-de-bord',
        disponible: true,
      },
    ],
  },
  {
    titre: 'Catalogue',
    entrees: [
      { libelle: 'Articles', chemin: '/articles', icone: 'articles', disponible: true },
      { libelle: 'Catégories', chemin: '/categories', icone: 'categories', disponible: true },
    ],
  },
  {
    titre: 'Stock',
    entrees: [
      {
        libelle: 'Mouvements de stock',
        chemin: '/mouvements-stock',
        icone: 'mouvements',
        disponible: true,
      },
      {
        libelle: 'Alertes de seuil',
        chemin: '/mouvements-stock/alertes',
        icone: 'alertes',
        disponible: true,
      },
    ],
  },
  {
    titre: 'Tiers',
    entrees: [
      { libelle: 'Clients', chemin: '/clients', icone: 'clients', disponible: true },
      { libelle: 'Fournisseurs', chemin: '/fournisseurs', icone: 'fournisseurs', disponible: true },
    ],
  },
  {
    titre: 'Commerce',
    entrees: [
      {
        libelle: 'Commandes client',
        chemin: '/commandes-client',
        icone: 'commande-client',
        disponible: true,
      },
      {
        libelle: 'Commandes fournisseur',
        chemin: '/commandes-fournisseur',
        icone: 'commande-fournisseur',
        disponible: true,
      },
      { libelle: 'Ventes', chemin: '/ventes', icone: 'ventes', disponible: true },
    ],
  },
  {
    titre: 'Administration',
    entrees: [
      {
        libelle: 'Entreprise',
        chemin: '/entreprise',
        icone: 'entreprise',
        role: ROLE_ADMIN,
        disponible: true,
      },
      {
        libelle: 'Utilisateurs',
        chemin: '/utilisateurs',
        icone: 'utilisateurs',
        role: ROLE_ADMIN,
        disponible: true,
      },
      { libelle: 'Mon profil', chemin: '/profil', icone: 'profil', disponible: true },
      {
        libelle: 'Apparence',
        chemin: '/parametres/apparence',
        icone: 'apparence',
        disponible: true,
      },
    ],
  },
];
