import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Bloc de chargement. Il occupe la place du contenu attendu, de sorte que rien ne saute
 * quand les données arrivent. Jamais de spinner plein écran après le premier rendu.
 */
@Component({
  selector: 'app-squelette',
  template: '',
  styleUrl: './squelette.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[style.inline-size]': 'largeur()',
    '[style.block-size]': 'hauteur()',
    '[attr.data-forme]': 'forme()',
  },
})
export class Squelette {
  readonly largeur = input('100%');
  readonly hauteur = input('1rem');
  readonly forme = input<'ligne' | 'bloc' | 'cercle'>('ligne');
}
