import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * État vide ou état d'erreur d'une liste.
 *
 * Le message dit ce qui s'est passé, et l'action dit quoi faire ensuite. Un écran vide
 * sans issue est une impasse : il y a toujours une action, même quand c'est « Réessayer ».
 */
@Component({
  selector: 'app-etat-vide',
  templateUrl: './etat-vide.html',
  styleUrl: './etat-vide.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-ton]': 'ton()',
  },
})
export class EtatVide {
  readonly titre = input.required<string>();
  readonly message = input<string | null>(null);
  readonly ton = input<'neutre' | 'erreur'>('neutre');
}
