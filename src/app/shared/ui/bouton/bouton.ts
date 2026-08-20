import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type VarianteBouton = 'primaire' | 'secondaire' | 'fantome' | 'danger';
export type TailleBouton = 'petite' | 'moyenne';

/**
 * Bouton de l'application.
 *
 * Pendant le chargement, le libellé reste en place et devient simplement transparent :
 * la largeur du bouton ne bouge pas, donc la mise en page ne saute pas et le pointeur
 * reste au-dessus de la même cible.
 */
@Component({
  selector: 'app-bouton',
  templateUrl: './bouton.html',
  styleUrl: './bouton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Bouton {
  readonly variante = input<VarianteBouton>('secondaire');
  readonly taille = input<TailleBouton>('moyenne');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly desactive = input(false);
  readonly chargement = input(false);

  /** Libellé lu à la place du contenu, quand le bouton ne porte qu'une icône. */
  readonly libelle = input<string | null>(null);

  /** Occupe toute la largeur disponible. Utile en pied de formulaire sur mobile. */
  readonly pleineLargeur = input(false);

  readonly presse = output<void>();

  readonly inactif = computed(() => this.desactive() || this.chargement());

  protected clic(): void {
    if (!this.inactif()) {
      this.presse.emit();
    }
  }
}
