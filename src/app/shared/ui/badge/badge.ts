import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type TonBadge = 'neutre' | 'succes' | 'avertissement' | 'danger' | 'information';

/** Pastille d'état. Ne porte aucune logique métier : le ton lui est donné de l'extérieur. */
@Component({
  selector: 'app-badge',
  template: '<ng-content />',
  styleUrl: './badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-ton]': 'ton()',
  },
})
export class Badge {
  readonly ton = input<TonBadge>('neutre');
}
