import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { PointSerie } from './serie';

/**
 * Classement en barres horizontales.
 *
 * Une seule couleur pour toutes les barres : la longueur porte déjà la grandeur, teinter en
 * plus doublerait l'information et brûlerait le seul canal libre.
 */
@Component({
  selector: 'app-graphique-barres',
  templateUrl: './graphique-barres.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphiqueBarres {
  readonly titre = input.required<string>();
  readonly points = input.required<readonly PointSerie[]>();
  readonly formater = input<(valeur: number) => string>((valeur) => String(valeur));

  private readonly maximum = computed(() =>
    Math.max(1, ...this.points().map((point) => point.valeur)),
  );

  protected readonly barres = computed(() =>
    this.points().map((point) => ({
      ...point,
      proportion: Math.round((point.valeur / this.maximum()) * 100),
    })),
  );
}
