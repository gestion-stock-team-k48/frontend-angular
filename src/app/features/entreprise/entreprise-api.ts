import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/app-config';
import { SANS_NOTIFICATION_ERREUR } from '../../core/http/http-contexte';
import type { DemandeEntreprise, Entreprise } from '../../core/api/api-types';

/**
 * Accès à `/entreprises/me`.
 *
 * Le backend n'expose que l'entreprise courante : pas de liste, pas de création depuis
 * l'application — une entreprise naît de l'inscription, et une seule est visible par
 * session, celle de l'utilisateur connecté.
 */
@Injectable({ providedIn: 'root' })
export class ApiEntreprise {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  readonly url = `${this.baseUrl}/entreprises/me`;

  modifier(demande: DemandeEntreprise): Observable<Entreprise> {
    return this.http.put<Entreprise>(this.url, demande, {
      context: new HttpContext().set(SANS_NOTIFICATION_ERREUR, true),
    });
  }
}
