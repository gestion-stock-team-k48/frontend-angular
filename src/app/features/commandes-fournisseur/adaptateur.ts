import type { CommandeVue, SaisieCommande } from '../../shared/commerce/commande';
import type { CommandeFournisseur, DemandeCommandeFournisseur } from '../../core/api/api-types';

/**
 * Traduction entre le DTO du module et la forme commune aux deux types de commandes.
 * C'est le seul endroit où `idFournisseur` et `fournisseurNom` apparaissent.
 */
export function versVue(reponse: CommandeFournisseur): CommandeVue {
  return {
    id: reponse.id,
    code: reponse.codeCommande,
    date: reponse.dateCommande,
    etat: reponse.etatCommande,
    tiersId: reponse.idFournisseur,
    tiersNom: `${reponse.fournisseurPrenom ?? ''} ${reponse.fournisseurNom ?? ''}`.trim(),
    totalHt: reponse.totalHt,
    totalTva: reponse.totalTva,
    totalTtc: reponse.totalTtc,
    lignes: reponse.lignes ?? [],
  };
}

export function versDemande(saisie: SaisieCommande): DemandeCommandeFournisseur {
  const code = saisie.code.trim();

  return {
    // Code laissé vide : le serveur en attribue un lui-même.
    ...(code === '' ? {} : { codeCommande: code }),
    dateCommande: saisie.date,
    idFournisseur: Number(saisie.tiersId),
    lignes: saisie.lignes.map((ligne) => ({
      articleId: Number(ligne.articleId),
      quantite: ligne.quantite,
    })),
  };
}
