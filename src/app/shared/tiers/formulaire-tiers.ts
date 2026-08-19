import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { FormField, form, submit } from '@angular/forms/signals';
import { firstValueFrom, type Observable } from 'rxjs';
import { Bouton } from '../ui/bouton/bouton';
import { Champ } from '../ui/champ/champ';
import { messageDuChamp, repartirErreur } from '../formulaires/erreurs-formulaire';
import {
  demandeDepuis,
  saisieDepuis,
  schemaTiers,
  type DemandeTiers,
  type SaisieTiers,
} from './champs-tiers';

/**
 * Formulaire d'un tiers — client ou fournisseur.
 *
 * Les deux se décrivent avec les mêmes champs et les mêmes contraintes : un seul formulaire
 * les sert. Ce composant ne connaît aucune URL — l'écran qui l'accueille lui passe ce qu'il
 * faut appeler, et reste seul responsable de son API.
 */
@Component({
  selector: 'app-formulaire-tiers',
  templateUrl: './formulaire-tiers.html',
  styleUrl: './formulaire-tiers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, Bouton, Champ],
})
export class FormulaireTiers {
  /** Valeurs à modifier, ou `null` pour une création. */
  readonly tiers = input<Partial<DemandeTiers> | null>(null);

  /** Ce qu'il faut appeler pour enregistrer. Fourni par l'écran, jamais construit ici. */
  readonly action = input.required<(demande: DemandeTiers) => Observable<unknown>>();

  readonly libelleEnregistrer = input('Enregistrer');

  /**
   * Envoi de la photo, disponible seulement en modification — un tiers doit exister avant
   * qu'on puisse lui attacher un fichier. `null` masque la section.
   */
  readonly envoyerPhoto = input<((fichier: File) => Observable<unknown>) | null>(null);

  /** Nom de l'objet stocké côté serveur, quand il y en a un. */
  readonly photoEnregistree = input<string | null>(null);

  readonly enregistre = output<void>();
  readonly photoEnvoyee = output<void>();
  readonly annule = output<void>();

  private readonly saisie = linkedSignal<SaisieTiers>(() =>
    saisieDepuis(this.tiers() ?? undefined),
  );

  protected readonly formulaire = form(this.saisie, schemaTiers);

  protected readonly message = signal<string | null>(null);

  protected readonly enCours = computed(() => this.formulaire().submitting());

  protected readonly erreurNom = this.erreurDe('nom');
  protected readonly erreurPrenom = this.erreurDe('prenom');
  protected readonly erreurEmail = this.erreurDe('email');
  protected readonly erreurTelephone = this.erreurDe('numTel');
  protected readonly erreurRue = this.erreurDe('rue');
  protected readonly erreurVille = this.erreurDe('ville');
  protected readonly erreurCodePostal = this.erreurDe('codePostal');
  protected readonly erreurPays = this.erreurDe('pays');

  protected readonly photoEnvoi = signal(false);

  protected async enregistrer(): Promise<void> {
    this.message.set(null);

    await submit(this.formulaire, {
      action: async () => {
        try {
          await firstValueFrom(this.action()(demandeDepuis(this.saisie())));
          this.enregistre.emit();
          return undefined;
        } catch (erreur) {
          const echec = repartirErreur(erreur, {
            nom: this.formulaire.nom,
            prenom: this.formulaire.prenom,
            email: this.formulaire.email,
            numTel: this.formulaire.numTel,
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

  protected async choisirPhoto(evenement: Event): Promise<void> {
    const cible = evenement.target;
    const fichier = cible instanceof HTMLInputElement ? cible.files?.[0] : undefined;
    const envoi = this.envoyerPhoto();

    if (fichier === undefined || envoi === null) {
      return;
    }

    this.photoEnvoi.set(true);
    try {
      await firstValueFrom(envoi(fichier));
      this.photoEnvoyee.emit();
    } catch {
      // L'intercepteur d'erreurs a déjà présenté l'échec de l'envoi.
    } finally {
      this.photoEnvoi.set(false);
      if (cible instanceof HTMLInputElement) {
        cible.value = '';
      }
    }
  }

  private erreurDe(nom: keyof SaisieTiers) {
    return computed(() => {
      const champ = this.formulaire[nom]();
      return champ.touched() ? messageDuChamp(champ.errors()) : null;
    });
  }
}
