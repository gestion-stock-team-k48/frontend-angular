import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ServiceNotifications } from '../../../core/notifications/notifications';

/**
 * Pile de notifications.
 *
 * Exception assumée à la règle « `shared/ui` ne consomme aucun service » : ce composant
 * n'a pas de logique métier, il ne fait qu'afficher une file tenue par `core`. Lui passer
 * la liste en entrée obligerait chaque écran de l'application à la relayer.
 */
@Component({
  selector: 'app-zone-notifications',
  templateUrl: './zone-notifications.html',
  styleUrl: './zone-notifications.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneNotifications {
  protected readonly service = inject(ServiceNotifications);
}
