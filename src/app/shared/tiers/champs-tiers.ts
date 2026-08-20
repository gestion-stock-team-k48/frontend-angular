import { email, maxLength, required, schema } from '@angular/forms/signals';
import type { DemandeClient, DemandeFournisseur } from '../../core/api/api-types';

/**
 * Un client et un fournisseur se décrivent exactement de la même façon côté backend :
 * `ClientRequest` et `FournisseurRequest` déclarent les mêmes champs, avec les mêmes
 * contraintes. Le type ci-dessous le constate — si l'un des deux DTO change, la
 * compilation le signale ici plutôt qu'à l'exécution.
 */
export type DemandeTiers = DemandeClient & DemandeFournisseur;

export interface SaisieTiers {
  nom: string;
  prenom: string;
  email: string;
  numTel: string;
  rue: string;
  ville: string;
  codePostal: string;
  pays: string;
}

/** Longueurs reprises des contraintes portées par les deux DTO. */
export const MAX_NOM = 100;
export const MAX_EMAIL = 150;
export const MAX_TELEPHONE = 20;
export const MAX_RUE = 150;
export const MAX_VILLE = 100;
export const MAX_CODE_POSTAL = 20;
export const MAX_PAYS = 100;

/** Règles de saisie d'un tiers, déclarées une fois pour les deux écrans. */
export const schemaTiers = schema<SaisieTiers>((champ) => {
  required(champ.nom, { message: 'Le nom est obligatoire' });
  maxLength(champ.nom, MAX_NOM, {
    message: `Le nom ne doit pas dépasser ${MAX_NOM} caractères`,
  });

  required(champ.prenom, { message: 'Le prénom est obligatoire' });
  maxLength(champ.prenom, MAX_NOM, {
    message: `Le prénom ne doit pas dépasser ${MAX_NOM} caractères`,
  });

  required(champ.email, { message: "L'email est obligatoire" });
  email(champ.email, { message: "L'email doit être valide" });
  maxLength(champ.email, MAX_EMAIL, {
    message: `L'email ne doit pas dépasser ${MAX_EMAIL} caractères`,
  });

  maxLength(champ.numTel, MAX_TELEPHONE, {
    message: `Le numéro de téléphone ne doit pas dépasser ${MAX_TELEPHONE} caractères`,
  });
  maxLength(champ.rue, MAX_RUE, {
    message: `La rue ne doit pas dépasser ${MAX_RUE} caractères`,
  });
  maxLength(champ.ville, MAX_VILLE, {
    message: `La ville ne doit pas dépasser ${MAX_VILLE} caractères`,
  });
  maxLength(champ.codePostal, MAX_CODE_POSTAL, {
    message: `Le code postal ne doit pas dépasser ${MAX_CODE_POSTAL} caractères`,
  });
  maxLength(champ.pays, MAX_PAYS, {
    message: `Le pays ne doit pas dépasser ${MAX_PAYS} caractères`,
  });
});

/** Valeurs de départ du formulaire : celles du tiers modifié, ou des champs vides. */
export function saisieDepuis(tiers: Partial<DemandeTiers> | undefined): SaisieTiers {
  return {
    nom: tiers?.nom ?? '',
    prenom: tiers?.prenom ?? '',
    email: tiers?.email ?? '',
    numTel: tiers?.numTel ?? '',
    rue: tiers?.rue ?? '',
    ville: tiers?.ville ?? '',
    codePostal: tiers?.codePostal ?? '',
    pays: tiers?.pays ?? '',
  };
}

/**
 * Ce qui part au serveur. Les champs facultatifs laissés vides sont omis plutôt qu'envoyés
 * en chaîne vide : une adresse absente n'est pas une adresse vide.
 */
export function demandeDepuis(saisie: SaisieTiers): DemandeTiers {
  const demande: DemandeTiers = {
    nom: saisie.nom.trim(),
    prenom: saisie.prenom.trim(),
    email: saisie.email.trim(),
  };

  const facultatifs = ['numTel', 'rue', 'ville', 'codePostal', 'pays'] as const;
  for (const champ of facultatifs) {
    const valeur = saisie[champ].trim();
    if (valeur !== '') {
      demande[champ] = valeur;
    }
  }

  return demande;
}
