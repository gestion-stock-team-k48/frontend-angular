import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { PartRepartition } from './serie';

/**
 * Part-à-tout en une barre empilée.
 *
 * Les couleurs sont celles des états — elles ne sont pas choisies pour distinguer des
 * séries mais pour dire une situation, et chaque part porte son libellé dans la légende :
 * la couleur ne travaille jamais seule.
 */
@Component({
  selector: 'app-repartition',
  templateUrl: './repartition.html',
  styleUrl: './graphique.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Repartition {
  readonly titre = input.required<string>();
  readonly parts = input.required<readonly PartRepartition[]>();

  protected readonly total = computed(() =>
    this.parts().reduce((somme, part) => somme + part.valeur, 0),
  );

  protected readonly presentes = computed(() => this.parts().filter((part) => part.valeur > 0));

  protected pourcentage(valeur: number): number {
    const total = this.total();
    return total === 0 ? 0 : Math.round((valeur / total) * 100);
  }
}
