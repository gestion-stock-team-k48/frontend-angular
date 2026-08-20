import type { CommandeVue, SaisieCommande } from '../../shared/commerce/commande';
import type { CommandeClient, DemandeCommandeClient } from '../../core/api/api-types';

/**
 * Traduction entre le DTO du module et la forme commune aux deux types de commandes.
 * C'est le seul endroit où `idClient` et `clientNom` apparaissent.
 */
export function versVue(reponse: CommandeClient): CommandeVue {
  return {
    id: reponse.id,
    code: reponse.codeCommande,
    date: reponse.dateCommande,
    etat: reponse.etatCommande,
    tiersId: reponse.idClient,
    tiersNom: `${reponse.clientPrenom ?? ''} ${reponse.clientNom ?? ''}`.trim(),
    totalHt: reponse.totalHt,
    totalTva: reponse.totalTva,
    totalTtc: reponse.totalTtc,
    lignes: reponse.lignes ?? [],
  };
}

export function versDemande(saisie: SaisieCommande): DemandeCommandeClient {
  return {
    // Aucun code : c'est le serveur qui l'attribue, et lui seul sait ce qui est déjà pris.
    dateCommande: saisie.date,
    idClient: Number(saisie.tiersId),
    lignes: saisie.lignes.map((ligne) => ({
      articleId: Number(ligne.articleId),
      quantite: ligne.quantite,
    })),
  };
}
