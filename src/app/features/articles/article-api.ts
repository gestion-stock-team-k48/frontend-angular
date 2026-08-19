import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/app-config';
import { SANS_NOTIFICATION_ERREUR } from '../../core/http/http-contexte';
import type { Article, DemandeArticle } from '../../core/api/api-types';

/**
 * Accès à `/articles`.
 *
 * La liste est paginée côté serveur ; elle n'accepte aucun filtre ni recherche — voir
 * l'écart signalé dans `docs/06-API-CONTRAT.md`. La lecture passe par `httpResource` dans
 * les écrans ; ce service porte les mutations, qui ont un début et une fin.
 */
@Injectable({ providedIn: 'root' })
export class ApiArticles {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  readonly url = `${this.baseUrl}/articles`;

  creer(demande: DemandeArticle): Observable<Article> {
    return this.http.post<Article>(this.url, demande, { context: contexteFormulaire() });
  }

  modifier(id: number, demande: DemandeArticle): Observable<Article> {
    return this.http.put<Article>(`${this.url}/${id}`, demande, { context: contexteFormulaire() });
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  /**
   * Envoie la photo de l'article.
   *
   * Le backend range le fichier dans son stockage objet et conserve le nom de l'objet.
   * Il n'expose aucun endpoint pour le relire : l'interface confirme l'envoi, elle ne peut
   * pas afficher l'image. Écart signalé dans `docs/06-API-CONTRAT.md`.
   */
  envoyerPhoto(id: number, fichier: File): Observable<Article> {
    const corps = new FormData();
    corps.append('file', fichier);
    return this.http.post<Article>(`${this.url}/${id}/photo`, corps);
  }
}

/**
 * Contexte des envois de formulaire : l'écran affiche le refus sous ses champs, une
 * notification globale ferait doublon.
 */
function contexteFormulaire(): HttpContext {
  return new HttpContext().set(SANS_NOTIFICATION_ERREUR, true);
}
