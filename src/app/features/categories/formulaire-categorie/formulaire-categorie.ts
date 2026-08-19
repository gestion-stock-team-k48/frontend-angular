import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { Bouton } from '../../../shared/ui/bouton/bouton';
import { Champ } from '../../../shared/ui/champ/champ';
import { messageDuChamp, repartirErreur } from '../../../shared/formulaires/erreurs-formulaire';
import { ApiCategories } from '../categorie-api';
import type { Categorie } from '../../../core/api/api-types';

/** Longueurs reprises des contraintes de `CategoryRequest`. */
const MAX_CODE = 20;
const MAX_DESIGNATION = 255;

interface SaisieCategorie {
  code: string;
  designation: string;
}

/**
 * Formulaire d'une catégorie, en création comme en modification.
 *
 * Un seul formulaire pour les deux : les champs sont identiques, et deux composants
 * dériveraient l'un de l'autre à la première retouche.
 */
@Component({
  selector: 'app-formulaire-categorie',
  templateUrl: './formulaire-categorie.html',
  styleUrl: './formulaire-categorie.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, Bouton, Champ],
})
export class FormulaireCategorie {
  private readonly api = inject(ApiCategories);

  /** Catégorie à modifier, ou `null` pour une création. */
  readonly categorie = input<Categorie | null>(null);

  readonly enregistree = output<Categorie>();
  readonly annulee = output<void>();

  /**
   * La saisie suit la catégorie reçue : ouvrir le formulaire sur une autre ligne repart de
   * ses valeurs, sans traîner celles de la précédente.
   */
  private readonly saisie = linkedSignal<SaisieCategorie>(() => ({
    code: this.categorie()?.code ?? '',
    designation: this.categorie()?.designation ?? '',
  }));

  protected readonly formulaire = form(this.saisie, (champ) => {
    required(champ.code, { message: 'Le code est obligatoire' });
    maxLength(champ.code, MAX_CODE, {
      message: `Le code ne doit pas dépasser ${MAX_CODE} caractères`,
    });
    required(champ.designation, { message: 'La désignation est obligatoire' });
    maxLength(champ.designation, MAX_DESIGNATION, {
      message: `La désignation ne doit pas dépasser ${MAX_DESIGNATION} caractères`,
    });
  });

  protected readonly message = signal<string | null>(null);

  protected readonly enCours = computed(() => this.formulaire().submitting());

  protected readonly erreurCode = computed(() =>
    this.formulaire.code().touched() ? messageDuChamp(this.formulaire.code().errors()) : null,
  );

  protected readonly erreurDesignation = computed(() =>
    this.formulaire.designation().touched()
      ? messageDuChamp(this.formulaire.designation().errors())
      : null,
  );

  protected async enregistrer(): Promise<void> {
    this.message.set(null);

    await submit(this.formulaire, {
      action: async () => {
        const saisie = this.saisie();
        const existante = this.categorie();

        try {
          const enregistree = await firstValueFrom(
            existante?.id === undefined
              ? this.api.creer(saisie)
              : this.api.modifier(existante.id, saisie),
          );
          this.enregistree.emit(enregistree);
          return undefined;
        } catch (erreur) {
          const echec = repartirErreur(erreur, {
            code: this.formulaire.code,
            designation: this.formulaire.designation,
          });
          this.message.set(echec.message);
          return echec.erreurs;
        }
      },
    });
  }
}
