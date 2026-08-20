import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/app-config';
import { SANS_NOTIFICATION_ERREUR } from '../../core/http/http-contexte';
import type { CommandeClient, DemandeCommandeClient, EtatCommande } from '../../core/api/api-types';

/** Accès à `/commandes-client`. */
@Injectable({ providedIn: 'root' })
export class ApiCommandesClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  readonly url = `${this.baseUrl}/commandes-client`;
  readonly urlClients = `${this.baseUrl}/clients`;
  readonly urlArticles = `${this.baseUrl}/articles`;

  creer(demande: DemandeCommandeClient): Observable<CommandeClient> {
    return this.http.post<CommandeClient>(this.url, demande, { context: contexteFormulaire() });
  }

  modifier(id: number, demande: DemandeCommandeClient): Observable<CommandeClient> {
    return this.http.put<CommandeClient>(`${this.url}/${id}`, demande, {
      context: contexteFormulaire(),
    });
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  /**
   * Change l'état d'une commande. Passer à `LIVREE` déclenche les sorties de stock côté
   * serveur, qui peuvent échouer sur un stock insuffisant : le refus est présenté par
   * l'intercepteur d'erreurs, et l'écran se recharge sur l'état réel.
   */
  changerEtat(id: number, etatCommande: EtatCommande): Observable<CommandeClient> {
    return this.http.patch<CommandeClient>(`${this.url}/${id}/etat`, { etatCommande });
  }
}

function contexteFormulaire(): HttpContext {
  return new HttpContext().set(SANS_NOTIFICATION_ERREUR, true);
}
