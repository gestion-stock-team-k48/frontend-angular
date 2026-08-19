import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormField, email, form, maxLength, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ServiceNotifications } from '../../../core/notifications/notifications';
import { Bouton } from '../../../shared/ui/bouton/bouton';
import { Champ } from '../../../shared/ui/champ/champ';
import { EtatVide } from '../../../shared/ui/etat-vide/etat-vide';
import { messageDuChamp, repartirErreur } from '../../../shared/formulaires/erreurs-formulaire';
import { ApiUtilisateurs } from '../utilisateur-api';
import { ROLES_PROPOSES } from '../roles';
import type { Role, Utilisateur } from '../../../core/api/api-types';

/** Longueurs reprises des contraintes portées par `UtilisateurRequest`. */
const MAX_NOM = 100;
const MAX_EMAIL = 150;
const MAX_RUE = 150;
const MAX_VILLE = 100;
const MAX_CODE_POSTAL = 20;
const MAX_PAYS = 100;

interface SaisieUtilisateur {
  nom: string;
  prenom: string;
  email: string;
  dateDeNaissance: string;
  rue: string;
  ville: string;
  codePostal: string;
  pays: string;
}

/**
 * Création et modification d'un compte.
 *
 * Aucun mot de passe n'est saisi : le serveur en génère un temporaire à la création, l'envoie
 * par email, et impose son remplacement à la première connexion. L'écran le dit plutôt que de
 * laisser l'administrateur chercher où saisir un mot de passe.
 */
@Component({
  selector: 'app-formulaire-utilisateur',
  templateUrl: './formulaire-utilisateur.html',
  styleUrl: './formulaire-utilisateur.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, RouterLink, Bouton, Champ, EtatVide],
})
export class FormulaireUtilisateur {
  private readonly api = inject(ApiUtilisateurs);
  private readonly notifications = inject(ServiceNotifications);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly rolesProposes = ROLES_PROPOSES;

  private readonly identifiant = signal<number | null>(
    Number.parseInt(this.route.snapshot.paramMap.get('id') ?? '', 10) || null,
  );

  private readonly ressource = httpResource<Utilisateur>(() => {
    const id = this.identifiant();
    return id === null ? undefined : `${this.api.url}/${id}`;
  });

  protected readonly modification = computed(() => this.identifiant() !== null);

  protected readonly introuvable = computed(() => this.ressource.error() !== undefined);

  private readonly saisie = linkedSignal<SaisieUtilisateur>(() => {
    const utilisateur = this.ressource.value();
    return {
      nom: utilisateur?.nom ?? '',
      prenom: utilisateur?.prenom ?? '',
      email: utilisateur?.email ?? '',
      dateDeNaissance: utilisateur?.dateDeNaissance ?? '',
      rue: utilisateur?.rue ?? '',
      ville: utilisateur?.ville ?? '',
      codePostal: utilisateur?.codePostal ?? '',
      pays: utilisateur?.pays ?? '',
    };
  });

  protected readonly roles = linkedSignal<readonly Role[]>(
    () => this.ressource.value()?.roles ?? ['ROLE_USER'],
  );

  protected readonly formulaire = form(this.saisie, (champ) => {
    required(champ.nom, { message: 'Le nom est obligatoire' });
    maxLength(champ.nom, MAX_NOM, { message: `Le nom ne doit pas dépasser ${MAX_NOM} caractères` });

    required(champ.prenom, { message: 'Le prénom est obligatoire' });
    maxLength(champ.prenom, MAX_NOM, {
      message: `Le prénom ne doit pas dépasser ${MAX_NOM} caractères`,
    });

    required(champ.email, { message: "L'email est obligatoire" });
    email(champ.email, { message: "L'email doit être valide" });
    maxLength(champ.email, MAX_EMAIL, {
      message: `L'email ne doit pas dépasser ${MAX_EMAIL} caractères`,
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
  protected readonly erreurPrenom = this.erreurDe('prenom');
  protected readonly erreurEmail = this.erreurDe('email');
  protected readonly erreurDate = this.erreurDe('dateDeNaissance');
  protected readonly erreurRue = this.erreurDe('rue');
  protected readonly erreurVille = this.erreurDe('ville');
  protected readonly erreurCodePostal = this.erreurDe('codePostal');
  protected readonly erreurPays = this.erreurDe('pays');

  protected aLeRole(role: Role): boolean {
    return this.roles().includes(role);
  }

  protected basculerRole(role: Role, evenement: Event): void {
    const cible = evenement.target;
    if (!(cible instanceof HTMLInputElement)) {
      return;
    }
    this.roles.update((roles) =>
      cible.checked ? [...roles, role] : roles.filter((candidat) => candidat !== role),
    );
  }

  protected async enregistrer(): Promise<void> {
    this.message.set(null);

    if (this.roles().length === 0) {
      this.message.set('Au moins un rôle est obligatoire.');
      return;
    }

    await submit(this.formulaire, {
      action: async () => {
        const saisie = this.saisie();
        const id = this.identifiant();
        const demande = {
          nom: saisie.nom.trim(),
          prenom: saisie.prenom.trim(),
          email: saisie.email.trim(),
          roles: [...this.roles()],
          ...facultatif('dateDeNaissance', saisie.dateDeNaissance),
          ...facultatif('rue', saisie.rue),
          ...facultatif('ville', saisie.ville),
          ...facultatif('codePostal', saisie.codePostal),
          ...facultatif('pays', saisie.pays),
        };

        try {
          await firstValueFrom(
            id === null ? this.api.creer(demande) : this.api.modifier(id, demande),
          );
          this.notifications.succes(
            id === null ? 'Utilisateur créé' : 'Utilisateur modifié',
            id === null ? 'Son mot de passe temporaire vient de lui être envoyé.' : undefined,
          );
          await this.router.navigate(['/utilisateurs']);
          return undefined;
        } catch (erreur) {
          const echec = repartirErreur(erreur, {
            nom: this.formulaire.nom,
            prenom: this.formulaire.prenom,
            email: this.formulaire.email,
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

  private erreurDe(nom: keyof SaisieUtilisateur) {
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
