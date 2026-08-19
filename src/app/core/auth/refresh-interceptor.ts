import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import type { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import type { Observable } from 'rxjs';
import { ServiceAuthentification } from './auth';
import { SANS_RAFRAICHISSEMENT } from '../http/http-contexte';

/**
 * Statuts déclenchant une tentative de rafraîchissement.
 *
 * `403` figure ici volontairement : une requête sans jeton valide se voit répondre `403`
 * par ce backend, pas `401`. Un vrai refus de droits paiera donc un aller-retour inutile
 * avant d'être présenté à l'utilisateur — coût assumé, voir ADR-005.
 */
const STATUTS_A_RAFRAICHIR: readonly number[] = [401, 403];

/**
 * Rejoue une requête refusée après un rafraîchissement du jeton.
 *
 * Le rafraîchissement lui-même est mutualisé par `ServiceAuthentification` : plusieurs
 * requêtes refusées en même temps déclenchent un seul appel réseau, puis sont toutes
 * rejouées avec le nouveau jeton.
 */
export function intercepteurRafraichissement(
  requete: HttpRequest<unknown>,
  suivant: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  if (requete.context.get(SANS_RAFRAICHISSEMENT)) {
    return suivant(requete);
  }

  const auth = inject(ServiceAuthentification);
  const router = inject(Router);

  return suivant(requete).pipe(
    catchError((erreur: unknown) => {
      if (!(erreur instanceof HttpErrorResponse) || !STATUTS_A_RAFRAICHIR.includes(erreur.status)) {
        return throwError(() => erreur);
      }

      if (auth.jetonRafraichissement() === null) {
        return throwError(() => erreur);
      }

      return auth.rafraichir().pipe(
        switchMap((jeton) =>
          suivant(requete.clone({ setHeaders: { Authorization: `Bearer ${jeton}` } })),
        ),
        catchError((echecRafraichissement: unknown) => {
          // Le rafraîchissement a échoué : la session est perdue, on renvoie l'utilisateur
          // vers la connexion en mémorisant l'écran qu'il tentait d'atteindre.
          auth.deconnecter();
          void router.navigate(['/connexion'], {
            queryParams: { returnUrl: router.url },
          });
          return throwError(() => echecRafraichissement);
        }),
      );
    }),
  );
}
