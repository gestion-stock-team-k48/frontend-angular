import { ROLE_ADMIN, ROLE_USER, type Role } from '../../core/api/api-types';

const LIBELLES: Readonly<Record<Role, string>> = {
  ROLE_ADMIN: 'Administrateur',
  ROLE_USER: 'Utilisateur',
};

/** Rôles proposés à la saisie, du plus courant au plus large. */
export const ROLES_PROPOSES: readonly { valeur: Role; libelle: string; aide: string }[] = [
  {
    valeur: ROLE_USER,
    libelle: LIBELLES[ROLE_USER],
    aide: 'Accès au catalogue, au stock, aux tiers et au commerce.',
  },
  {
    valeur: ROLE_ADMIN,
    libelle: LIBELLES[ROLE_ADMIN],
    aide: "Ajoute la gestion de l'entreprise et des comptes.",
  },
];

export function libelleRole(role: Role): string {
  return LIBELLES[role];
}

export function libelleRoles(roles: readonly Role[] | undefined): string {
  return (roles ?? []).map(libelleRole).join(', ') || '—';
}
