import { HttpErrorResponse } from '@angular/common/http';
import type { ReadonlyFieldTree, ValidationError } from '@angular/forms/signals';
import { erreursDeValidation } from '../../core/http/error-response';
import { messageErreurUtilisateur } from '../../core/http/messages-erreur';

/** Ce qu'un échec de soumission donne à afficher : un bandeau, des erreurs de champ, ou les deux. */
export interface EchecSoumission {
  /** Message d'ensemble, ou `null` quand chaque erreur a trouvé son champ. */
  readonly message: string | null;
  /** Erreurs à rattacher aux champs du formulaire, au retour de `submit()`. */
  readonly erreurs: ValidationError.WithOptionalFieldTree[];
}

/**
 * Répartit un échec HTTP entre les champs du formulaire et le bandeau d'ensemble.
 *
 * Le backend renvoie ses erreurs de validation dans `validationErrors`, indexées par le nom
 * du champ de son DTO. La table `champs` fait le lien avec les champs du formulaire : ce qui
 * y trouve sa place se pose sous le contrôle concerné, le reste remonte dans le bandeau.
 *
 * Quand tout a trouvé sa place, il n'y a pas de bandeau : répéter en haut d'écran ce qui est
 * déjà écrit sous chaque champ ne fait que doubler le bruit.
 */
export function repartirErreur(
  erreur: unknown,
  champs: Readonly<Record<string, ReadonlyFieldTree<unknown>>>,
): EchecSoumission {
  if (!(erreur instanceof HttpErrorResponse)) {
    return { message: "La demande n'a pas pu être traitée. Réessayer.", erreurs: [] };
  }

  const erreursDeChamp: ValidationError.WithOptionalFieldTree[] = [];
  const sansChamp: string[] = [];

  for (const [nom, texte] of Object.entries(erreursDeValidation(erreur))) {
    const champ = champs[nom];
    if (champ === undefined) {
      sansChamp.push(texte);
      continue;
    }
    erreursDeChamp.push({ kind: 'serveur', message: texte, fieldTree: champ });
  }

  if (sansChamp.length > 0) {
    return { message: sansChamp.join(' '), erreurs: erreursDeChamp };
  }

  return {
    message: erreursDeChamp.length > 0 ? null : messageErreurUtilisateur(erreur),
    erreurs: erreursDeChamp,
  };
}

/** Premier message d'erreur porté par un champ, prêt pour l'entrée `erreur` de `app-champ`. */
export function messageDuChamp(erreurs: readonly ValidationError[]): string | null {
  return erreurs[0]?.message ?? null;
}
