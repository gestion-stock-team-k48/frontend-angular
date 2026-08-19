import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/app-config';
import { SANS_NOTIFICATION_ERREUR } from '../../core/http/http-contexte';
import type {
  DemandeCorrectionStock,
  DemandeMouvementStock,
  MouvementStock,
} from '../../core/api/api-types';

/** Nature de l'opération demandée. Chaque valeur correspond à un endpoint distinct. */
export type OperationStock = 'entree' | 'sortie' | 'correction-positive' | 'correction-negative';

/**
 * Accès à `/mouvements-stock`.
 *
 * Le backend n'expose aucune liste globale des mouvements : ils se lisent article par
 * article. Le stock réel n'est jamais recalculé ici — c'est lui qui fait foi, et il est
 * dérivé des mouvements côté serveur.
 */
@Injectable({ providedIn: 'root' })
export class ApiMouvementsStock {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  readonly url = `${this.baseUrl}/mouvements-stock`;

  urlHistorique(idArticle: number): string {
    return `${this.url}/article/${idArticle}`;
  }

  urlStockReel(idArticle: number): string {
    return `${this.url}/article/${idArticle}/stock-reel`;
  }

  readonly urlAlertes = `${this.url}/alertes-stock`;

  entree(demande: DemandeMouvementStock): Observable<MouvementStock> {
    return this.http.post<MouvementStock>(`${this.url}/entree`, demande, {
      context: contexteFormulaire(),
    });
  }

  sortie(demande: DemandeMouvementStock): Observable<MouvementStock> {
    return this.http.post<MouvementStock>(`${this.url}/sortie`, demande, {
      context: contexteFormulaire(),
    });
  }

  correctionPositive(demande: DemandeCorrectionStock): Observable<MouvementStock> {
    return this.http.post<MouvementStock>(`${this.url}/correction-positive`, demande, {
      context: contexteFormulaire(),
    });
  }

  correctionNegative(demande: DemandeCorrectionStock): Observable<MouvementStock> {
    return this.http.post<MouvementStock>(`${this.url}/correction-negative`, demande, {
      context: contexteFormulaire(),
    });
  }
}

/**
 * Contexte des envois de formulaire : l'écran affiche le refus — un stock insuffisant, par
 * exemple — dans son bandeau. Une notification globale ferait doublon.
 */
function contexteFormulaire(): HttpContext {
  return new HttpContext().set(SANS_NOTIFICATION_ERREUR, true);
}
