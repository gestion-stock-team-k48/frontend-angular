import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { FormField, email, form, maxLength, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ServiceNotifications } from '../../../core/notifications/notifications';
import { Bouton } from '../../../shared/ui/bouton/bouton';
import { Champ } from '../../../shared/ui/champ/champ';
import { EtatVide } from '../../../shared/ui/etat-vide/etat-vide';
import { messageDuChamp, repartirErreur } from '../../../shared/formulaires/erreurs-formulaire';
import { ApiEntreprise } from '../entreprise-api';
import type { Entreprise } from '../../../core/api/api-types';

/** Longueurs reprises des contraintes portées par `EntrepriseRequest`. */
const MAX_NOM = 150;
const MAX_DESCRIPTION = 1000;
const MAX_CODE_FISCAL = 30;
const MAX_EMAIL = 150;
const MAX_TELEPHONE = 20;
const MAX_SITE = 150;
const MAX_RUE = 150;
const MAX_VILLE = 100;
const MAX_CODE_POSTAL = 20;
const MAX_PAYS = 100;

interface SaisieEntreprise {
  nom: string;
  codeFiscal: string;
  email: string;
  description: string;
  numTel: string;
  siteWeb: string;
  rue: string;
  ville: string;
  codePostal: string;
  pays: string;
}

/**
 * Fiche de l'entreprise courante.
 *
 * Le champ `photo` du DTO n'est pas proposé : aucun endpoint n'envoie de logo d'entreprise,
 * et saisir un nom d'objet à la main n'aurait aucun sens.
 */
@Component({
  selector: 'app-ecran-entreprise',
  templateUrl: './ecran-entreprise.html',
  styleUrl: './ecran-entreprise.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, Bouton, Champ, EtatVide],
})
export class EcranEntreprise {
  private readonly api = inject(ApiEntreprise);
  private readonly notifications = inject(ServiceNotifications);

  private readonly ressource = httpResource<Entreprise>(() => this.api.url);

  protected readonly chargement = computed(() => this.ressource.isLoading());

  protected readonly indisponible = computed(() => this.ressource.error() !== undefined);

  private readonly saisie = linkedSignal<SaisieEntreprise>(() => {
    const entreprise = this.ressource.value();
    return {
      nom: entreprise?.nom ?? '',
      codeFiscal: entreprise?.codeFiscal ?? '',
      email: entreprise?.email ?? '',
      description: entreprise?.description ?? '',
      numTel: entreprise?.numTel ?? '',
      siteWeb: entreprise?.siteWeb ?? '',
      rue: entreprise?.rue ?? '',
      ville: entreprise?.ville ?? '',
      codePostal: entreprise?.codePostal ?? '',
      pays: entreprise?.pays ?? '',
    };
  });

  protected readonly formulaire = form(this.saisie, (champ) => {
    required(champ.nom, { message: "Le nom de l'entreprise est obligatoire" });
    maxLength(champ.nom, MAX_NOM, {
      message: `Le nom ne doit pas dépasser ${MAX_NOM} caractères`,
    });

    required(champ.codeFiscal, { message: 'Le code fiscal est obligatoire' });
    maxLength(champ.codeFiscal, MAX_CODE_FISCAL, {
      message: `Le code fiscal ne doit pas dépasser ${MAX_CODE_FISCAL} caractères`,
    });

    required(champ.email, { message: "L'email est obligatoire" });
    email(champ.email, { message: "L'email doit être valide" });
    maxLength(champ.email, MAX_EMAIL, {
      message: `L'email ne doit pas dépasser ${MAX_EMAIL} caractères`,
    });

    maxLength(champ.description, MAX_DESCRIPTION, {
      message: `La description ne doit pas dépasser ${MAX_DESCRIPTION} caractères`,
    });
    maxLength(champ.numTel, MAX_TELEPHONE, {
      message: `Le téléphone ne doit pas dépasser ${MAX_TELEPHONE} caractères`,
    });
    maxLength(champ.siteWeb, MAX_SITE, {
      message: `Le site web ne doit pas dépasser ${MAX_SITE} caractères`,
    });
    maxLength(champ.rue, MAX_RUE, { message: `La rue ne doit pas dépasser ${MAX_RUE} caractères` });
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

  protected readonly message = signal<string | null>(null);

  protected readonly enCours = computed(() => this.formulaire().submitting());

  protected readonly erreurNom = this.erreurDe('nom');
  protected readonly erreurCodeFiscal = this.erreurDe('codeFiscal');
  protected readonly erreurEmail = this.erreurDe('email');
  protected readonly erreurDescription = this.erreurDe('description');
  protected readonly erreurTelephone = this.erreurDe('numTel');
  protected readonly erreurSite = this.erreurDe('siteWeb');
  protected readonly erreurRue = this.erreurDe('rue');
  protected readonly erreurVille = this.erreurDe('ville');
  protected readonly erreurCodePostal = this.erreurDe('codePostal');
  protected readonly erreurPays = this.erreurDe('pays');

  protected async enregistrer(): Promise<void> {
    this.message.set(null);

    await submit(this.formulaire, {
      action: async () => {
        const saisie = this.saisie();
        const demande = {
          nom: saisie.nom.trim(),
          codeFiscal: saisie.codeFiscal.trim(),
          email: saisie.email.trim(),
          ...facultatif('description', saisie.description),
          ...facultatif('numTel', saisie.numTel),
          ...facultatif('siteWeb', saisie.siteWeb),
          ...facultatif('rue', saisie.rue),
          ...facultatif('ville', saisie.ville),
          ...facultatif('codePostal', saisie.codePostal),
          ...facultatif('pays', saisie.pays),
        };

        try {
          await firstValueFrom(this.api.modifier(demande));
          this.notifications.succes('Entreprise modifiée');
          this.ressource.reload();
          return undefined;
        } catch (erreur) {
          const echec = repartirErreur(erreur, {
            nom: this.formulaire.nom,
            codeFiscal: this.formulaire.codeFiscal,
            email: this.formulaire.email,
            description: this.formulaire.description,
            numTel: this.formulaire.numTel,
            siteWeb: this.formulaire.siteWeb,
            rue: this.formulaire.rue,
            ville: this.formulaire.ville,
            codePostal: this.formulaire.codePostal,
            pays: this.formulaire.pays,
          });
          this.message.set(echec.message);
          return echec.erreurs;
        }
      },
    });
  }

  private erreurDe(nom: keyof SaisieEntreprise) {
    return computed(() => {
      const champ = this.formulaire[nom]();
      return champ.touched() ? messageDuChamp(champ.errors()) : null;
    });
  }
}

/** Un champ facultatif vide n'est pas envoyé : il n'y a rien à enregistrer. */
function facultatif(nom: string, valeur: string): Record<string, string> {
  const nettoye = valeur.trim();
  return nettoye === '' ? {} : { [nom]: nettoye };
}
