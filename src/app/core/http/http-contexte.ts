import { HttpContextToken } from '@angular/common/http';

/**
 * Marqueurs posés sur une requête pour désactiver un intercepteur au cas par cas.
 * Préférés à un filtrage par URL : explicites à la lecture, et insensibles aux
 * changements de chemin côté backend.
 */

/** N'attache pas le jeton d'accès. Utilisé par les appels d'authentification. */
export const SANS_JETON = new HttpContextToken<boolean>(() => false);

/**
 * Ne tente aucun rafraîchissement si la requête échoue. Indispensable sur l'appel de
 * rafraîchissement lui-même, sous peine de boucle.
 */
export const SANS_RAFRAICHISSEMENT = new HttpContextToken<boolean>(() => false);

/** N'incrémente pas l'indicateur de chargement global. Pour les appels de fond. */
export const SANS_INDICATEUR_CHARGEMENT = new HttpContextToken<boolean>(() => false);

/**
 * N'affiche pas de notification globale si la requête échoue : l'écran qui l'a lancée
 * présente déjà l'erreur sous ses champs ou dans son bandeau. Sans ce marqueur, un même
 * refus s'écrit deux fois — une fois dans le formulaire, une fois en haut de l'écran.
 */
export const SANS_NOTIFICATION_ERREUR = new HttpContextToken<boolean>(() => false);
