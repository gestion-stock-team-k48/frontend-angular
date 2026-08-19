import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import type { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import type { Observable } from 'rxjs';
import { SANS_INDICATEUR_CHARGEMENT } from './http-contexte';

/**
 * Compte les requêtes en vol. Un compteur plutôt qu'un booléen : deux requêtes
 * simultanées ne doivent pas éteindre l'indicateur dès que la première se termine.
 */
@Injectable({ providedIn: 'root' })
export class ServiceChargement {
  private readonly enVol = signal(0);

  /** Vrai tant qu'au moins une requête est en cours. */
  readonly enCours = computed(() => this.enVol() > 0);

  /** Nombre de requêtes en cours, utile pour le débogage. */
  readonly nombreEnCours = this.enVol.asReadonly();

  demarrer(): void {
    this.enVol.update((n) => n + 1);
  }

  terminer(): void {
    this.enVol.update((n) => Math.max(0, n - 1));
  }
}

/** Alimente `ServiceChargement` pour toute requête qui ne s'en exclut pas explicitement. */
export function intercepteurChargement(
  requete: HttpRequest<unknown>,
  suivant: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  if (requete.context.get(SANS_INDICATEUR_CHARGEMENT)) {
    return suivant(requete);
  }

  const chargement = inject(ServiceChargement);
  chargement.demarrer();

  return suivant(requete).pipe(finalize(() => chargement.terminer()));
}
