import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormField, form, maxLength, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { Bouton } from '../../../shared/ui/bouton/bouton';
import { Champ } from '../../../shared/ui/champ/champ';
import { messageDuChamp, repartirErreur } from '../../../shared/formulaires/erreurs-formulaire';
import { SOURCES_PROPOSEES, estSourceConnue } from '../libelles';
import { ApiMouvementsStock, type OperationStock } from '../mouvement-api';
import type { MouvementStock, SourceMouvementStock } from '../../../core/api/api-types';

/** Longueur reprise de la contrainte portée par `MvtStkCorrectionRequest`. */
const MAX_MOTIF = 255;

interface SaisieMouvement {
  quantite: number;
  /** Tenue en texte : c'est la valeur d'un `select`. Convertie à l'envoi. */
  source: string;
  motif: string;
}

/**
 * Saisie d'un mouvement de stock.
 *
 * Quatre opérations, un seul formulaire : elles ne diffèrent que par le champ qui accompagne
 * la quantité — la source pour une entrée ou une sortie, le motif pour une correction, que
 * le backend impose. Le sens, lui, est porté par l'endpoint appelé.
 */
@Component({
  selector: 'app-formulaire-mouvement',
  templateUrl: './formulaire-mouvement.html',
  styleUrl: './formulaire-mouvement.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, Bouton, Champ],
})
export class FormulaireMouvement {
  private readonly api = inject(ApiMouvementsStock);

  readonly operation = input.required<OperationStock>();
  readonly articleId = input.required<number>();

  readonly enregistre = output<MouvementStock>();
  readonly annule = output<void>();

  protected readonly sources = SOURCES_PROPOSEES;

  /** Une correction demande un motif ; une entrée ou une sortie, une source. */
  protected readonly correction = computed(() => this.operation().startsWith('correction'));

  private readonly saisie = signal<SaisieMouvement>({ quantite: 0, source: '', motif: '' });

  protected readonly formulaire = form(this.saisie, (champ) => {
    validate(champ.quantite, ({ value }) =>
      value() > 0 ? undefined : { kind: 'positif', message: 'La quantité doit être positive' },
    );

    validate(champ.source, ({ value }) =>
      this.correction() || value() !== ''
        ? undefined
        : { kind: 'requis', message: 'La source du mouvement est obligatoire' },
    );

    validate(champ.motif, ({ value }) =>
      !this.correction() || value().trim() !== ''
        ? undefined
        : { kind: 'requis', message: 'Le motif est obligatoire' },
    );

    maxLength(champ.motif, MAX_MOTIF, {
      message: `Le motif ne doit pas dépasser ${MAX_MOTIF} caractères`,
    });
  });

  protected readonly message = signal<string | null>(null);

  protected readonly enCours = computed(() => this.formulaire().submitting());

  protected readonly erreurQuantite = this.erreurDe('quantite');
  protected readonly erreurSource = this.erreurDe('source');
  protected readonly erreurMotif = this.erreurDe('motif');

  protected async enregistrer(): Promise<void> {
    this.message.set(null);

    await submit(this.formulaire, {
      action: async () => {
        try {
          const mouvement = await firstValueFrom(this.appel());
          this.enregistre.emit(mouvement);
          return undefined;
        } catch (erreur) {
          const echec = repartirErreur(erreur, {
            quantite: this.formulaire.quantite,
            motif: this.formulaire.motif,
            sourceMvt: this.formulaire.source,
          });
          this.message.set(echec.message);
          return echec.erreurs;
        }
      },
    });
  }

  private appel() {
    const { quantite, source, motif } = this.saisie();
    const articleId = this.articleId();

    switch (this.operation()) {
      case 'entree':
        return this.api.entree({ articleId, quantite, sourceMvt: sourceValidee(source) });
      case 'sortie':
        return this.api.sortie({ articleId, quantite, sourceMvt: sourceValidee(source) });
      case 'correction-positive':
        return this.api.correctionPositive({ articleId, quantite, motif });
      default:
        return this.api.correctionNegative({ articleId, quantite, motif });
    }
  }

  private erreurDe(nom: keyof SaisieMouvement) {
    return computed(() => {
      const champ = this.formulaire[nom]();
      return champ.touched() ? messageDuChamp(champ.errors()) : null;
    });
  }
}

/**
 * Le formulaire a déjà refusé une source vide ; ce contrôle n'est là que pour passer du
 * texte du `select` au type de la source, sans conversion aveugle.
 */
function sourceValidee(valeur: string): SourceMouvementStock {
  if (!estSourceConnue(valeur)) {
    throw new Error(`Source de mouvement inconnue : ${valeur}`);
  }
  return valeur;
}
