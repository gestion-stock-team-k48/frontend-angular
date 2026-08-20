import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/app-config';
import { SANS_NOTIFICATION_ERREUR } from '../../core/http/http-contexte';
import type { DemandeProfil, DemandeUtilisateur, Utilisateur } from '../../core/api/api-types';

/**
 * Accès à `/utilisateurs`.
 *
 * Créer un utilisateur ne demande pas de mot de passe : le serveur en génère un temporaire,
 * l'envoie par email et exige son remplacement à la première connexion.
 *
 * L'envoi de photo est réservé à son propre compte — le backend refuse la photo d'autrui —,
 * il n'est donc proposé que depuis « Mon profil ».
 */
@Injectable({ providedIn: 'root' })
export class ApiUtilisateurs {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  readonly url = `${this.baseUrl}/utilisateurs`;
  readonly urlMoi = `${this.baseUrl}/utilisateurs/me`;

  creer(demande: DemandeUtilisateur): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(this.url, demande, { context: contexteFormulaire() });
  }

  modifier(id: number, demande: DemandeUtilisateur): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(`${this.url}/${id}`, demande, {
      context: contexteFormulaire(),
    });
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  modifierMonProfil(demande: DemandeProfil): Observable<Utilisateur> {
    return this.http.put<Utilisateur>(this.urlMoi, demande, { context: contexteFormulaire() });
  }

  envoyerMaPhoto(id: number, fichier: File): Observable<Utilisateur> {
    const corps = new FormData();
    corps.append('file', fichier);
    return this.http.post<Utilisateur>(`${this.url}/${id}/photo`, corps);
  }
}

function contexteFormulaire(): HttpContext {
  return new HttpContext().set(SANS_NOTIFICATION_ERREUR, true);
}
