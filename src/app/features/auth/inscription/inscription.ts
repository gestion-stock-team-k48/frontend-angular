import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormField,
  email,
  form,
  maxLength,
  minLength,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ServiceAuthentification } from '../../../core/auth/auth';
import { ServiceNotifications } from '../../../core/notifications/notifications';
import { Bouton } from '../../../shared/ui/bouton/bouton';
import { Champ } from '../../../shared/ui/champ/champ';
import { LONGUEUR_MINIMALE_MOT_DE_PASSE } from '../regles-mot-de-passe';
import { messageDuChamp, repartirErreur } from '../../../shared/formulaires/erreurs-formulaire';

/** Longueurs maximales, reprises des contraintes portées par `RegisterRequest`. */
const MAX_NOM_ENTREPRISE = 150;
const MAX_CODE_FISCAL = 30;
const MAX_EMAIL = 150;
const MAX_NOM = 100;
const MAX_MOT_DE_PASSE = 100;

interface SaisieInscription {
  nomEntreprise: string;
  codeFiscal: string;
  email: string;
  nomAdmin: string;
  prenomAdmin: string;
  emailAdmin: string;
  motDePasse: string;
  /** Ne part jamais au serveur : elle ne sert qu'à vérifier la frappe du mot de passe. */
  confirmation: string;
}

/**
 * Inscription d'une entreprise et de son premier administrateur.
 *
 * Le formulaire ne demande que ce que le backend exige. Adresse, téléphone, site web et
 * description sont facultatifs côté serveur : ils se renseignent ensuite depuis l'écran
 * Entreprise, plutôt que d'allonger la première page vue par un nouveau client.
 */
@Component({
  selector: 'app-inscription',
  templateUrl: './inscription.html',
  styleUrl: '../formulaire-auth.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'large' },
  imports: [FormField, RouterLink, Bouton, Champ],
})
export class Inscription {
  private readonly auth = inject(ServiceAuthentification);
  private readonly notifications = inject(ServiceNotifications);
  private readonly router = inject(Router);

  private readonly saisie = signal<SaisieInscription>({
    nomEntreprise: '',
    codeFiscal: '',
    email: '',
    nomAdmin: '',
    prenomAdmin: '',
    emailAdmin: '',
    motDePasse: '',
    confirmation: '',
  });

  protected readonly formulaire = form(this.saisie, (champ) => {
    required(champ.nomEntreprise, { message: "Le nom de l'entreprise est obligatoire" });
    maxLength(champ.nomEntreprise, MAX_NOM_ENTREPRISE, {
      message: `Le nom de l'entreprise ne doit pas dépasser ${MAX_NOM_ENTREPRISE} caractères`,
    });

    required(champ.codeFiscal, { message: 'Le code fiscal est obligatoire' });
    maxLength(champ.codeFiscal, MAX_CODE_FISCAL, {
      message: `Le code fiscal ne doit pas dépasser ${MAX_CODE_FISCAL} caractères`,
    });

    required(champ.email, { message: "L'email de l'entreprise est obligatoire" });
    email(champ.email, { message: "L'email de l'entreprise doit être valide" });
    maxLength(champ.email, MAX_EMAIL, {
      message: `L'email ne doit pas dépasser ${MAX_EMAIL} caractères`,
    });

    required(champ.nomAdmin, { message: "Le nom de l'administrateur est obligatoire" });
    maxLength(champ.nomAdmin, MAX_NOM, {
      message: `Le nom ne doit pas dépasser ${MAX_NOM} caractères`,
    });

    required(champ.prenomAdmin, { message: "Le prénom de l'administrateur est obligatoire" });
    maxLength(champ.prenomAdmin, MAX_NOM, {
      message: `Le prénom ne doit pas dépasser ${MAX_NOM} caractères`,
    });

    required(champ.emailAdmin, { message: "L'email de l'administrateur est obligatoire" });
    email(champ.emailAdmin, { message: "L'email de l'administrateur doit être valide" });
    maxLength(champ.emailAdmin, MAX_EMAIL, {
      message: `L'email ne doit pas dépasser ${MAX_EMAIL} caractères`,
    });

    required(champ.motDePasse, { message: 'Le mot de passe est obligatoire' });
    minLength(champ.motDePasse, LONGUEUR_MINIMALE_MOT_DE_PASSE, {
      message: `Le mot de passe doit contenir au moins ${LONGUEUR_MINIMALE_MOT_DE_PASSE} caractères`,
    });
    maxLength(champ.motDePasse, MAX_MOT_DE_PASSE, {
      message: `Le mot de passe ne doit pas dépasser ${MAX_MOT_DE_PASSE} caractères`,
    });

    required(champ.confirmation, { message: 'La confirmation est obligatoire' });
    validate(champ.confirmation, ({ value, valueOf }) =>
      value() === valueOf(champ.motDePasse)
        ? undefined
        : { kind: 'confirmation', message: 'Les deux mots de passe ne sont pas identiques' },
    );
  });

  protected readonly message = signal<string | null>(null);

  protected readonly enCours = computed(() => this.formulaire().submitting());

  protected readonly longueurMinimale = LONGUEUR_MINIMALE_MOT_DE_PASSE;

  protected readonly erreurNomEntreprise = this.erreurDe('nomEntreprise');
  protected readonly erreurCodeFiscal = this.erreurDe('codeFiscal');
  protected readonly erreurEmail = this.erreurDe('email');
  protected readonly erreurNomAdmin = this.erreurDe('nomAdmin');
  protected readonly erreurPrenomAdmin = this.erreurDe('prenomAdmin');
  protected readonly erreurEmailAdmin = this.erreurDe('emailAdmin');
  protected readonly erreurMotDePasse = this.erreurDe('motDePasse');
  protected readonly erreurConfirmation = this.erreurDe('confirmation');

  protected async inscrire(): Promise<void> {
    this.message.set(null);

    await submit(this.formulaire, {
      action: async () => {
        const saisie = this.saisie();
        try {
          await firstValueFrom(
            this.auth.inscrire({
              nomEntreprise: saisie.nomEntreprise,
              codeFiscal: saisie.codeFiscal,
              email: saisie.email,
              nomAdmin: saisie.nomAdmin,
              prenomAdmin: saisie.prenomAdmin,
              emailAdmin: saisie.emailAdmin,
              motDePasse: saisie.motDePasse,
            }),
          );
          this.notifications.succes(
            'Entreprise inscrite',
            'Le compte administrateur est prêt à être utilisé.',
          );
          await this.router.navigate(['/']);
          return undefined;
        } catch (erreur) {
          const echec = repartirErreur(erreur, {
            nomEntreprise: this.formulaire.nomEntreprise,
            codeFiscal: this.formulaire.codeFiscal,
            email: this.formulaire.email,
            nomAdmin: this.formulaire.nomAdmin,
            prenomAdmin: this.formulaire.prenomAdmin,
            emailAdmin: this.formulaire.emailAdmin,
            motDePasse: this.formulaire.motDePasse,
          });
          this.message.set(echec.message);
          return echec.erreurs;
        }
      },
    });
  }

  /**
   * Le message n'apparaît qu'une fois le champ visité, ou après une tentative d'envoi qui
   * marque tout le formulaire comme touché : signaler « obligatoire » sur un champ que
   * l'utilisateur n'a pas encore atteint le mettrait en faute avant qu'il ait commencé.
   */
  private erreurDe(nom: keyof SaisieInscription) {
    return computed(() => {
      const champ = this.formulaire[nom]();
      return champ.touched() ? messageDuChamp(champ.errors()) : null;
    });
  }
}
