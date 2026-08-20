import { HttpErrorResponse } from '@angular/common/http';
import { extraireReponseErreur } from './error-response';

/**
 * Traduit un échec HTTP en message affichable.
 *
 * Le backend rédige déjà ses messages métier en français : ils sont repris tels quels
 * plutôt que réécrits. Les messages de repli ne sont utilisés que pour les cas où le
 * backend n'a rien d'intelligible à dire — panne réseau, `5xx`, corps illisible.
 *
 * Correspondance complète dans `docs/06-API-CONTRAT.md`.
 */
export function messageErreurUtilisateur(erreur: HttpErrorResponse): string {
  if (erreur.status === 0) {
    return "Le serveur n'a pas répondu. Vérifier la connexion, puis réessayer.";
  }

  const reponse = extraireReponseErreur(erreur);

  if (reponse?.validationErrors) {
    return 'Un ou plusieurs champs sont invalides. Corriger les champs signalés ci-dessous.';
  }

  if (reponse && estMessageExploitable(reponse.message)) {
    return reponse.message;
  }

  return messageDeRepli(erreur.status);
}

/**
 * Un message est exploitable s'il est destiné à l'utilisateur. Les messages techniques
 * — trace, exception nue, corps tronqué — sont écartés au profit d'un repli lisible.
 */
function estMessageExploitable(message: string): boolean {
  const nettoye = message.trim();
  if (nettoye.length === 0 || nettoye.length > 300) {
    return false;
  }
  // Les deux alternatives sont groupées explicitement : `|` a la plus faible précédence, si
  // bien qu'un lecteur pressé croit l'ancre `^` valable pour les deux. Elle ne porte que sur
  // la première — un nom de classe en tête de message —, la seconde cherchant une ligne de
  // pile n'importe où. Le comportement est inchangé, seule l'intention devient lisible.
  return !/(?:^[a-z.]*Exception\b)|(?:\bat [a-z]+\.[a-z]+\.)/i.test(nettoye);
}

function messageDeRepli(statut: number): string {
  switch (statut) {
    case 400:
      return "La demande n'a pas pu être traitée. Vérifier les informations saisies.";
    case 401:
      return 'La session a expiré. Se reconnecter pour continuer.';
    case 403:
      return "Cette action n'est pas autorisée avec le rôle courant.";
    case 404:
      return "Cet élément n'existe plus, ou n'est pas accessible.";
    case 409:
      return "L'opération entre en conflit avec l'état actuel des données. Recharger la page, puis réessayer.";
    case 413:
      return 'Le fichier dépasse la taille maximale acceptée, qui est de 10 Mo.';
    case 503:
      return 'Le service est momentanément indisponible. Réessayer dans quelques instants.';
    default:
      return statut >= 500
        ? "Le serveur a rencontré une erreur. Réessayer dans un instant ; si le problème persiste, prévenir l'administrateur."
        : "La demande n'a pas pu être traitée. Réessayer.";
  }
}
