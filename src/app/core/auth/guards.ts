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

/** Interdit les écrans de connexion à une session déjà ouverte. */
export const gardeInvite: CanActivateFn = () => {
  const auth = inject(ServiceAuthentification);
  const router = inject(Router);

  return auth.estAuthentifie() ? router.createUrlTree(['/']) : true;
};
