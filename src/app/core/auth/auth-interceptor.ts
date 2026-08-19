import { inject } from '@angular/core';
import type { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { ServiceAuthentification } from './auth';
import { SANS_JETON } from '../http/http-contexte';

/** Attache le jeton d'accès, sauf aux requêtes qui s'en excluent explicitement. */
export function intercepteurAuthentification(
  requete: HttpRequest<unknown>,
  suivant: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  if (requete.context.get(SANS_JETON)) {
    return suivant(requete);
  }

  const jeton = inject(ServiceAuthentification).jeton();
  if (jeton === null) {
    return suivant(requete);
  }

  return suivant(requete.clone({ setHeaders: { Authorization: `Bearer ${jeton}` } }));
}
