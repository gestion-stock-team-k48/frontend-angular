import type { components } from './generated/api';

/**
 * Alias de lecture sur les schémas générés depuis `openapi.json`.
 * Les types eux-mêmes ne sont jamais écrits à la main : `./generated/api.ts` est régénéré
 * par `./scripts/sync-api.sh`. Ce fichier ne fait que leur donner un nom court.
 */
type Schemas = components['schemas'];

export type DemandeAuthentification = Schemas['AuthenticationRequest'];
export type ReponseAuthentification = Schemas['AuthenticationResponse'];
export type DemandeInscription = Schemas['RegisterRequest'];
export type DemandeMotDePasseOublie = Schemas['ForgotPasswordRequest'];
export type DemandeReinitialisationMotDePasse = Schemas['ResetPasswordRequest'];
export type DemandeChangementMotDePasse = Schemas['ChangePasswordRequest'];
export type Utilisateur = Schemas['UtilisateurResponse'];

export type Categorie = Schemas['CategoryResponse'];
export type DemandeCategorie = Schemas['CategoryRequest'];
export type Article = Schemas['ArticleResponse'];
export type DemandeArticle = Schemas['ArticleRequest'];

export type MouvementStock = Schemas['MvtStkResponse'];
export type DemandeMouvementStock = Schemas['MvtStkRequest'];
export type DemandeCorrectionStock = Schemas['MvtStkCorrectionRequest'];
export type AlerteStock = Schemas['AlerteStockResponse'];

/** Sens d'un mouvement, tel que le backend le qualifie lui-même. */
export type TypeMouvementStock = NonNullable<MouvementStock['typeMvt']>;

/** Origine d'un mouvement : ce qui l'a provoqué. */
export type SourceMouvementStock = Schemas['MvtStkRequest']['sourceMvt'];

/** Rôles applicatifs, tels que déclarés par la spécification. */
export type Role = NonNullable<Utilisateur['roles']>[number];

export const ROLE_ADMIN: Role = 'ROLE_ADMIN';
export const ROLE_USER: Role = 'ROLE_USER';
