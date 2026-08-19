import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import type { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import type { Observable } from 'rxjs';
import { messageErreurUtilisateur } from './messages-erreur';
import { erreursDeValidation } from './error-response';
import { SANS_NOTIFICATION_ERREUR } from './http-contexte';
import { ServiceNotifications } from '../notifications/notifications';

/**
 * Statuts qu'un écran traite lui-même, et qu'il ne faut donc pas doubler d'une
 * notification globale :
 *  - `400` avec des erreurs de champ : le formulaire les affiche sous ses contrôles ;
 *  - `401` et `403` : l'intercepteur de rafraîchissement s'en occupe déjà ;
 *  - `404` : l'écran concerné décide s'il redirige ou affiche un état vide.
 *
 * Un écran peut aussi le demander explicitement, par le marqueur `SANS_NOTIFICATION_ERREUR`,
 * quand il affiche déjà l'erreur lui-même.
 */
const STATUTS_TRAITES_PAR_L_ECRAN: readonly number[] = [401, 403, 404];

/**
 * Transforme un échec HTTP en message lisible et le pousse dans la file de notifications.
 * L'erreur d'origine est toujours propagée : l'appelant garde la main.
 */
export function intercepteurErreurs(
  requete: HttpRequest<unknown>,
  suivant: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const notifications = inject(ServiceNotifications);

  return suivant(requete).pipe(
    catchError((erreur: unknown) => {
      if (!(erreur instanceof HttpErrorResponse)) {
        return throwError(() => erreur);
      }

      const aDesErreursDeChamp = Object.keys(erreursDeValidation(erreur)).length > 0;
      const ecranSeDebrouille =
        requete.context.get(SANS_NOTIFICATION_ERREUR) ||
        STATUTS_TRAITES_PAR_L_ECRAN.includes(erreur.status) ||
        aDesErreursDeChamp;

      if (!ecranSeDebrouille) {
        notifications.erreur(messageErreurUtilisateur(erreur));
      }

      return throwError(() => erreur);
    }),
  );
}
