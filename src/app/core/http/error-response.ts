import { HttpErrorResponse } from '@angular/common/http';

/**
 * Forme des réponses d'erreur du backend.
 *
 * Écrit à la main, à titre exceptionnel : la spécification OpenAPI ne publie aucun schéma
 * d'erreur — les réponses `4xx` y sont typées avec le schéma de succès de l'opération.
 * La forme ci-dessous a été relevée sur le backend en fonctionnement puis recoupée avec son
 * `GlobalExceptionHandler`. Voir ADR-004 et `docs/06-API-CONTRAT.md`.
 *
 * `scripts/sync-api.sh` signale le jour où un schéma d'erreur apparaît dans la
 * spécification : ce type devra alors céder la place au type généré.
 */
export interface ReponseErreur {
  readonly timestamp: string;
  readonly status: number;
  readonly error: string;
  readonly message: string;
  readonly path: string;
  /** Présent uniquement sur les échecs de validation : nom du champ vers son message. */
  readonly validationErrors?: Readonly<Record<string, string>>;
}

function estObjet(valeur: unknown): valeur is Record<string, unknown> {
  return typeof valeur === 'object' && valeur !== null;
}

/** Vrai si le corps de la réponse suit bien le format d'erreur du backend. */
export function estReponseErreur(corps: unknown): corps is ReponseErreur {
  if (!estObjet(corps)) {
    return false;
  }
  return (
    typeof corps['status'] === 'number' &&
    typeof corps['message'] === 'string' &&
    typeof corps['path'] === 'string'
  );
}

/** Extrait la réponse d'erreur du backend, ou `null` si l'échec est purement réseau. */
export function extraireReponseErreur(erreur: HttpErrorResponse): ReponseErreur | null {
  return estReponseErreur(erreur.error) ? erreur.error : null;
}

/**
 * Erreurs de validation par champ, prêtes à être posées sous les contrôles d'un formulaire.
 * Vide si l'erreur n'est pas un échec de validation.
 */
export function erreursDeValidation(erreur: HttpErrorResponse): Readonly<Record<string, string>> {
  return extraireReponseErreur(erreur)?.validationErrors ?? {};
}
