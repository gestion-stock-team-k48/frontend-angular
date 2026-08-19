/**
 * Longueur minimale d'un mot de passe, alignée sur la contrainte du backend
 * (`@Size(min = 8)` sur `RegisterRequest`, `ResetPasswordRequest` et `ChangePasswordRequest`).
 *
 * Elle est déclarée une fois pour que les trois formulaires qui la vérifient côté navigateur
 * ne puissent pas dériver du serveur, ni les uns des autres.
 */
export const LONGUEUR_MINIMALE_MOT_DE_PASSE = 8;
