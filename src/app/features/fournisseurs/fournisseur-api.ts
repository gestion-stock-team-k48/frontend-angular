import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/app-config';
import { SANS_NOTIFICATION_ERREUR } from '../../core/http/http-contexte';
import type { Fournisseur, DemandeFournisseur } from '../../core/api/api-types';

/** Accès à `/fournisseurs`. */
@Injectable({ providedIn: 'root' })
export class ApiFournisseurs {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  readonly url = `${this.baseUrl}/fournisseurs`;

  creer(demande: DemandeFournisseur): Observable<Fournisseur> {
    return this.http.post<Fournisseur>(this.url, demande, { context: contexteFormulaire() });
  }

  modifier(id: number, demande: DemandeFournisseur): Observable<Fournisseur> {
    return this.http.put<Fournisseur>(`${this.url}/${id}`, demande, {
      context: contexteFormulaire(),
    });
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  /**
   * Envoie la photo du fournisseur. Le backend conserve le nom de l'objet stocké et n'expose
   * aucun endpoint pour le relire — écart signalé dans `docs/06-API-CONTRAT.md`.
   */
  envoyerPhoto(id: number, fichier: File): Observable<Fournisseur> {
    const corps = new FormData();
    corps.append('file', fichier);
    return this.http.post<Fournisseur>(`${this.url}/${id}/photo`, corps);
  }
}

function contexteFormulaire(): HttpContext {
  return new HttpContext().set(SANS_NOTIFICATION_ERREUR, true);
}
