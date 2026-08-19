import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ZoneNotifications } from './shared/ui/notifications/zone-notifications';

/**
 * Racine de l'application. Le shell — topbar, sidebar, fil d'Ariane — arrive en phase 4 ;
 * pour l'instant la racine ne porte que la sortie du routeur et la pile de notifications,
 * qui doit rester montée quel que soit l'écran affiché.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ZoneNotifications],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
