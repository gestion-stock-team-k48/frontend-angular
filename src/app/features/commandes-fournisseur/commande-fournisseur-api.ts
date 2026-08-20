import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/app-config';
import { SANS_NOTIFICATION_ERREUR } from '../../core/http/http-contexte';
import type {
  CommandeFournisseur,
  DemandeCommandeFournisseur,
  EtatCommande,
} from '../../core/api/api-types';

/** Accès à `/commandes-fournisseur`. */
@Injectable({ providedIn: 'root' })
export class ApiCommandesFournisseur {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  readonly url = `${this.baseUrl}/commandes-fournisseur`;
  readonly urlFournisseurs = `${this.baseUrl}/fournisseurs`;
  readonly urlArticles = `${this.baseUrl}/articles`;

  creer(demande: DemandeCommandeFournisseur): Observable<CommandeFournisseur> {
    return this.http.post<CommandeFournisseur>(this.url, demande, {
      context: contexteFormulaire(),
    });
  }

  modifier(id: number, demande: DemandeCommandeFournisseur): Observable<CommandeFournisseur> {
    return this.http.put<CommandeFournisseur>(`${this.url}/${id}`, demande, {
      context: contexteFormulaire(),
    });
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  /**
   * Change l'état d'une commande. Passer à `LIVREE` déclenche les entrées de stock côté
   * serveur : la marchandise reçue rejoint le stock, article par article.
   */
  changerEtat(id: number, etatCommande: EtatCommande): Observable<CommandeFournisseur> {
    return this.http.patch<CommandeFournisseur>(`${this.url}/${id}/etat`, { etatCommande });
  }
}

function contexteFormulaire(): HttpContext {
  return new HttpContext().set(SANS_NOTIFICATION_ERREUR, true);
}
