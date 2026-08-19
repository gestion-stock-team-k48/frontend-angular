import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/app-config';
import { SANS_NOTIFICATION_ERREUR } from '../../core/http/http-contexte';
import type { Categorie, DemandeCategorie } from '../../core/api/api-types';

/**
 * Accès à `/categories`.
 *
 * La liste n'est pas paginée côté backend : `GET /categories` renvoie un tableau complet.
 * Une entreprise a rarement plus de quelques dizaines de catégories ; le jour où ce ne sera
 * plus vrai, c'est le backend qu'il faudra faire évoluer, pas cet écran.
 */
@Injectable({ providedIn: 'root' })
export class ApiCategories {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  readonly url = `${this.baseUrl}/categories`;

  creer(demande: DemandeCategorie): Observable<Categorie> {
    return this.http.post<Categorie>(this.url, demande, { context: contexteFormulaire() });
  }

  modifier(id: number, demande: DemandeCategorie): Observable<Categorie> {
    return this.http.put<Categorie>(`${this.url}/${id}`, demande, {
      context: contexteFormulaire(),
    });
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}

/**
 * Contexte des envois de formulaire : l'écran affiche le refus sous ses champs, une
 * notification globale ferait doublon.
 */
function contexteFormulaire(): HttpContext {
  return new HttpContext().set(SANS_NOTIFICATION_ERREUR, true);
}
