import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/app-config';
import { SANS_NOTIFICATION_ERREUR } from '../../core/http/http-contexte';
import type { DemandeVente, Vente } from '../../core/api/api-types';

/**
 * Accès à `/ventes`.
 *
 * Une vente ne se modifie pas et ne se supprime pas : le backend n'expose aucun endpoint de
 * modification, et sa suppression est refusée dans tous les cas pour préserver l'intégrité
 * des mouvements de stock. L'écran n'offre donc ni l'une ni l'autre.
 */
@Injectable({ providedIn: 'root' })
export class ApiVentes {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  readonly url = `${this.baseUrl}/ventes`;
  readonly urlArticles = `${this.baseUrl}/articles`;

  /** Enregistrer une vente sort immédiatement les articles du stock, côté serveur. */
  creer(demande: DemandeVente): Observable<Vente> {
    return this.http.post<Vente>(this.url, demande, { context: contexteFormulaire() });
  }

  chercherParCode(code: string): Observable<Vente> {
    return this.http.get<Vente>(`${this.url}/code/${encodeURIComponent(code)}`, {
      context: contexteFormulaire(),
    });
  }
}

function contexteFormulaire(): HttpContext {
  return new HttpContext().set(SANS_NOTIFICATION_ERREUR, true);
}
