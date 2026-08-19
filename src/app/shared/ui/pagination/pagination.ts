import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TAILLES_PAGE, type EtatPage } from '../../../core/api/pagination';

/**
 * Barre de pagination d'une liste.
 *
 * Elle affiche des numéros de page à partir de 1, alors que le backend compte à partir de 0 :
 * la conversion est faite ici, une fois, plutôt que dans chaque écran.
 */
@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Pagination {
  readonly etat = input.required<EtatPage>();
  readonly tailles = input<readonly number[]>(TAILLES_PAGE);

  readonly pageChange = output<number>();
  readonly tailleChange = output<number>();

  protected readonly premierElement = computed(() =>
    this.etat().total === 0 ? 0 : this.etat().numero * this.etat().taille + 1,
  );

  protected readonly dernierElement = computed(
    () => this.etat().numero * this.etat().taille + this.etat().nombreElements,
  );

  protected readonly pageAffichee = computed(() => this.etat().numero + 1);

  protected readonly nombrePages = computed(() => Math.max(this.etat().pages, 1));

  protected precedente(): void {
    if (!this.etat().premiere) {
      this.pageChange.emit(this.etat().numero - 1);
    }
  }

  protected suivante(): void {
    if (!this.etat().derniere) {
      this.pageChange.emit(this.etat().numero + 1);
    }
  }

  protected changerTaille(evenement: Event): void {
    const cible = evenement.target;
    if (cible instanceof HTMLSelectElement) {
      this.tailleChange.emit(Number(cible.value));
    }
  }
}
