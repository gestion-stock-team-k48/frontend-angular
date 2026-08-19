import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type TailleJauge = 'inline' | 'moyenne' | 'grande';
export type EtatStock = 'ok' | 'bas' | 'rupture';

/**
 * Jauge de seuil — élément signature de l'application.
 *
 * Elle représente le rapport entre le stock réel et le seuil minimum d'un article.
 * L'échelle est plafonnée à deux fois le seuil, ce qui place le repère de seuil toujours
 * au même endroit : d'une ligne de tableau à l'autre, les jauges se comparent d'un coup
 * d'œil, sans lire les chiffres. C'est tout l'intérêt d'un motif répété.
 *
 * Trois tailles, même grammaire visuelle : `inline` dans un tableau, `moyenne` sur une
 * fiche article, `grande` sur le tableau de bord.
 */
@Component({
  selector: 'app-jauge-seuil',
  templateUrl: './jauge-seuil.html',
  styleUrl: './jauge-seuil.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'meter',
    '[attr.aria-valuenow]': 'stock()',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': 'plafond()',
    '[attr.aria-label]': 'description()',
    '[attr.data-taille]': 'taille()',
    '[attr.data-etat]': 'etat()',
  },
})
export class JaugeSeuil {
  /** Stock réel calculé par le backend. Jamais recalculé côté interface. */
  readonly stock = input.required<number>();

  /** Seuil minimum de l'article, en dessous duquel une alerte est levée. */
  readonly seuil = input.required<number>();

  readonly taille = input<TailleJauge>('inline');

  /** Désignation de l'article, reprise dans le libellé accessible. */
  readonly article = input<string | null>(null);

  /** Deux fois le seuil : au-delà, la barre est pleine et le chiffre prend le relais. */
  readonly plafond = computed(() => Math.max(this.seuil() * 2, 1));

  readonly etat = computed<EtatStock>(() => {
    const stock = this.stock();
    if (stock <= 0) {
      return 'rupture';
    }
    return stock < this.seuil() ? 'bas' : 'ok';
  });

  /** Remplissage en pourcentage, borné pour qu'un stock énorme ne déborde pas. */
  readonly remplissage = computed(() => {
    const proportion = this.stock() / this.plafond();
    return Math.min(100, Math.max(0, proportion * 100));
  });

  /** Position du repère de seuil. Constante par construction, sauf seuil nul. */
  readonly positionSeuil = computed(() => {
    if (this.seuil() <= 0) {
      return 0;
    }
    return Math.min(100, (this.seuil() / this.plafond()) * 100);
  });

  readonly libelleEtat = computed(() => {
    switch (this.etat()) {
      case 'rupture':
        return 'Rupture';
      case 'bas':
        return 'Sous le seuil';
      default:
        return 'Stock correct';
    }
  });

  /** Libellé lu par les technologies d'assistance : un chiffre seul ne dit rien. */
  readonly description = computed(() => {
    const article = this.article();
    const debut = article === null ? '' : `${article} : `;
    return `${debut}${this.libelleEtat()}, ${this.stock()} en stock pour un seuil de ${this.seuil()}`;
  });
}
