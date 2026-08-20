import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { ServiceAuthentification } from './auth';
import type { Role } from '../api/api-types';

/**
 * Ces gardes conditionnent la navigation, pas les droits.
 * La sécurité réelle est celle du serveur : masquer un écran n'a jamais protégé une donnée.
 */

/** Réserve une route aux sessions ouvertes. */
export const gardeAuthentification: CanActivateFn = (_route, etat) => {
  const auth = inject(ServiceAuthentification);
  const router = inject(Router);

  if (auth.estAuthentifie()) {
    return true;
  }

  return router.createUrlTree(['/connexion'], { queryParams: { returnUrl: etat.url } });
};

/** Réserve une route aux rôles indiqués. Renvoie vers la page d'accès refusé. */
export function gardeRole(...roles: readonly Role[]): CanActivateFn {
  return (_route, etat) => {
    const auth = inject(ServiceAuthentification);
    const router = inject(Router);

    if (!auth.estAuthentifie()) {
      return router.createUrlTree(['/connexion'], { queryParams: { returnUrl: etat.url } });
    }

    return auth.aRole(...roles) ? true : router.createUrlTree(['/acces-refuse']);
  };
}

/** Écran ouvert par défaut à une session établie. */
export const ECRAN_PAR_DEFAUT = '/tableau-de-bord';

/** Interdit les écrans de connexion à une session déjà ouverte. */
export const gardeInvite: CanActivateFn = () => {
  const auth = inject(ServiceAuthentification);
  const router = inject(Router);

  return auth.estAuthentifie() ? router.createUrlTree([ECRAN_PAR_DEFAUT]) : true;
};

/**
 * Page d'accueil : la vitrine pour qui arrive, le tableau de bord pour qui est déjà entré.
 *
 * C'est le système qui oriente, pas l'utilisateur : personne n'a à retenir une adresse pour
 * retrouver son travail. Rien n'empêche de saisir l'URL de la vitrine à la main — elle reste
 * accessible —, mais l'ouverture de l'application n'y laisse pas une session en cours.
 */
export const gardeAccueil: CanActivateFn = () => {
  const auth = inject(ServiceAuthentification);
  const router = inject(Router);

  return auth.estAuthentifie() ? router.createUrlTree([ECRAN_PAR_DEFAUT]) : true;
};

/**
 * Bloque l'application tant qu'un mot de passe temporaire n'a pas été remplacé.
 *
 * L'administrateur qui crée un compte y met un mot de passe généré, transmis par email.
 * Laisser cet utilisateur circuler avec ce mot de passe reviendrait à laisser un secret
 * connu de deux personnes ouvrir la porte indéfiniment.
 */
export const gardeMotDePasse: CanActivateFn = () => {
  const auth = inject(ServiceAuthentification);
  const router = inject(Router);

  return auth.doitChangerMotDePasse() ? router.createUrlTree(['/changer-mot-de-passe']) : true;
};
