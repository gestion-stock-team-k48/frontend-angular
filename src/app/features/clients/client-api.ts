import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/app-config';
import { SANS_NOTIFICATION_ERREUR } from '../../core/http/http-contexte';
import type { Client, DemandeClient } from '../../core/api/api-types';

/** Accès à `/clients`. */
@Injectable({ providedIn: 'root' })
export class ApiClients {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  readonly url = `${this.baseUrl}/clients`;

  creer(demande: DemandeClient): Observable<Client> {
    return this.http.post<Client>(this.url, demande, { context: contexteFormulaire() });
  }

  modifier(id: number, demande: DemandeClient): Observable<Client> {
    return this.http.put<Client>(`${this.url}/${id}`, demande, { context: contexteFormulaire() });
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  /**
   * Envoie la photo du client. Le backend conserve le nom de l'objet stocké et n'expose
   * aucun endpoint pour le relire — écart signalé dans `docs/06-API-CONTRAT.md`.
   */
  envoyerPhoto(id: number, fichier: File): Observable<Client> {
    const corps = new FormData();
    corps.append('file', fichier);
    return this.http.post<Client>(`${this.url}/${id}/photo`, corps);
  }
}

function contexteFormulaire(): HttpContext {
  return new HttpContext().set(SANS_NOTIFICATION_ERREUR, true);
}
