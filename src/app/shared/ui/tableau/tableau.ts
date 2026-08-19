import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Squelette } from '../squelette/squelette';
import type { SensTri, Tri } from '../../../core/api/pagination';

export interface ColonneTableau {
  /** Nom du champ côté backend, utilisé tel quel dans le paramètre `sort`. */
  readonly cle: string;
  readonly libelle: string;
  readonly triable?: boolean;
  readonly alignement?: 'debut' | 'fin';
}

export type EtatTableau = 'chargement' | 'pret' | 'vide' | 'erreur';

/**
 * Coquille de tableau : en-têtes, tri, lignes de chargement, place pour un état vide.
 *
 * Les lignes sont projetées par l'écran appelant, qui seul sait ce qu'une ligne contient.
 * Ce composant ne connaît ni les données, ni l'API : il tient la structure et l'accessibilité.
 */
@Component({
  selector: 'app-tableau',
  templateUrl: './tableau.html',
  styleUrl: './tableau.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Squelette],
})
export class Tableau {
  readonly colonnes = input.required<readonly ColonneTableau[]>();
  readonly etat = input<EtatTableau>('pret');
  readonly tri = input<Tri | null>(null);

  /** Libellé de la colonne d'actions. Absent, aucune colonne d'actions n'est rendue. */
  readonly libelleActions = input<string | null>(null);

  /** Hauteur du squelette : autant de lignes que la page en affichera. */
  readonly lignesSquelette = input(5);

  readonly triChange = output<Tri>();

  protected readonly rangs = computed(() =>
    Array.from({ length: this.lignesSquelette() }, (_, index) => index),
  );

  protected readonly afficheLignes = computed(() => this.etat() === 'pret');

  protected readonly afficheEtat = computed(
    () => this.etat() === 'vide' || this.etat() === 'erreur',
  );

  /** Valeur d'`aria-sort` : ce que le lecteur d'écran annonce sur l'en-tête. */
  protected ordre(colonne: ColonneTableau): 'ascending' | 'descending' | 'none' {
    const tri = this.tri();
    if (tri === null || tri.champ !== colonne.cle) {
      return 'none';
    }
    return tri.sens === 'asc' ? 'ascending' : 'descending';
  }

  /** Un clic trie en ordre croissant ; un second clic sur la même colonne inverse. */
  protected basculerTri(colonne: ColonneTableau): void {
    const tri = this.tri();
    const sens: SensTri = tri?.champ === colonne.cle && tri.sens === 'asc' ? 'desc' : 'asc';
    this.triChange.emit({ champ: colonne.cle, sens });
  }
}
