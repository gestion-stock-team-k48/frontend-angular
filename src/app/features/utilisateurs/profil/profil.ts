import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ServiceAuthentification } from '../../../core/auth/auth';
import { ServiceNotifications } from '../../../core/notifications/notifications';
import { Badge } from '../../../shared/ui/badge/badge';
import { Bouton } from '../../../shared/ui/bouton/bouton';
import { Champ } from '../../../shared/ui/champ/champ';
import { messageDuChamp, repartirErreur } from '../../../shared/formulaires/erreurs-formulaire';
import { ApiUtilisateurs } from '../utilisateur-api';
import { libelleRole } from '../roles';

const MAX_NOM = 100;
const MAX_RUE = 150;
const MAX_VILLE = 100;
const MAX_CODE_POSTAL = 20;
const MAX_PAYS = 100;

interface SaisieProfil {
  nom: string;
  prenom: string;
  dateDeNaissance: string;
  rue: string;
  ville: string;
  codePostal: string;
  pays: string;
}

/**
 * Mon profil.
 *
 * L'email et les rôles n'y figurent pas : `PUT /utilisateurs/me` ne les accepte pas, et un
 * utilisateur ne s'attribue pas ses propres droits. Ils restent affichés, en lecture.
 *
 * La photo ne s'envoie que pour son propre compte — le backend refuse celle d'autrui —, d'où
 * sa présence ici et son absence de l'écran d'administration.
 */
@Component({
  selector: 'app-profil',
  templateUrl: './profil.html',
  styleUrl: './profil.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, RouterLink, Badge, Bouton, Champ],
})
export class Profil {
  private readonly api = inject(ApiUtilisateurs);
  private readonly auth = inject(ServiceAuthentification);
  private readonly notifications = inject(ServiceNotifications);

  protected readonly utilisateur = this.auth.utilisateur;
  protected readonly libelleRole = libelleRole;

  private readonly saisie = linkedSignal<SaisieProfil>(() => {
    const utilisateur = this.utilisateur();
    return {
      nom: utilisateur?.nom ?? '',
      prenom: utilisateur?.prenom ?? '',
      dateDeNaissance: utilisateur?.dateDeNaissance ?? '',
      rue: utilisateur?.rue ?? '',
      ville: utilisateur?.ville ?? '',
      codePostal: utilisateur?.codePostal ?? '',
      pays: utilisateur?.pays ?? '',
    };
  });

  protected readonly formulaire = form(this.saisie, (champ) => {
    required(champ.nom, { message: 'Le nom est obligatoire' });
    maxLength(champ.nom, MAX_NOM, { message: `Le nom ne doit pas dépasser ${MAX_NOM} caractères` });
    required(champ.prenom, { message: 'Le prénom est obligatoire' });
    maxLength(champ.prenom, MAX_NOM, {
      message: `Le prénom ne doit pas dépasser ${MAX_NOM} caractères`,
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

  protected readonly photoEnvoi = signal(false);

  protected readonly erreurNom = this.erreurDe('nom');
  protected readonly erreurPrenom = this.erreurDe('prenom');
  protected readonly erreurDate = this.erreurDe('dateDeNaissance');
  protected readonly erreurRue = this.erreurDe('rue');
  protected readonly erreurVille = this.erreurDe('ville');
  protected readonly erreurCodePostal = this.erreurDe('codePostal');
  protected readonly erreurPays = this.erreurDe('pays');

  protected async enregistrer(): Promise<void> {
    this.message.set(null);

    await submit(this.formulaire, {
      action: async () => {
        const saisie = this.saisie();

        try {
          await firstValueFrom(
            this.api.modifierMonProfil({
              nom: saisie.nom.trim(),
              prenom: saisie.prenom.trim(),
              ...facultatif('dateDeNaissance', saisie.dateDeNaissance),
              ...facultatif('rue', saisie.rue),
              ...facultatif('ville', saisie.ville),
              ...facultatif('codePostal', saisie.codePostal),
              ...facultatif('pays', saisie.pays),
            }),
          );
          // Le bandeau applicatif affiche ce profil : il est rechargé pour rester juste.
          await firstValueFrom(this.auth.chargerUtilisateur());
          this.notifications.succes('Profil modifié');
          return undefined;
        } catch (erreur) {
          const echec = repartirErreur(erreur, {
            nom: this.formulaire.nom,
            prenom: this.formulaire.prenom,
            dateDeNaissance: this.formulaire.dateDeNaissance,
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

  protected async envoyerPhoto(evenement: Event): Promise<void> {
    const cible = evenement.target;
    const fichier = cible instanceof HTMLInputElement ? cible.files?.[0] : undefined;
    const id = this.utilisateur()?.id;

    if (fichier === undefined || id === undefined) {
      return;
    }

    this.photoEnvoi.set(true);
    try {
      await firstValueFrom(this.api.envoyerMaPhoto(id, fichier));
      await firstValueFrom(this.auth.chargerUtilisateur());
      this.notifications.succes('Photo enregistrée', fichier.name);
    } catch {
      // L'intercepteur d'erreurs a déjà présenté l'échec de l'envoi.
    } finally {
      this.photoEnvoi.set(false);
      if (cible instanceof HTMLInputElement) {
        cible.value = '';
      }
    }
  }

  private erreurDe(nom: keyof SaisieProfil) {
    return computed(() => {
      const champ = this.formulaire[nom]();
      return champ.touched() ? messageDuChamp(champ.errors()) : null;
    });
  }
}

function facultatif(nom: string, valeur: string): Record<string, string> {
  const nettoye = valeur.trim();
  return nettoye === '' ? {} : { [nom]: nettoye };
}
