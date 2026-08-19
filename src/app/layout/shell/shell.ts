import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FilAriane } from '../fil-ariane/fil-ariane';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';

/**
 * Coquille de l'application : bandeau, navigation, fil d'Ariane, zone de contenu.
 *
 * La navigation est ouverte par défaut sur grand écran et repliée sur mobile. Le choix est
 * gardé en mémoire pour la session seulement : sur un poste d'entrepôt partagé, une
 * préférence de navigation persistée surprendrait plus qu'elle n'aiderait.
 */
@Component({
  selector: 'app-shell',
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Topbar, Sidebar, FilAriane],
})
export class Shell {
  protected readonly navigationOuverte = signal(true);

  protected basculerNavigation(): void {
    this.navigationOuverte.update((ouverte) => !ouverte);
  }

  protected fermerSurMobile(): void {
    if (window.matchMedia('(width <= 48rem)').matches) {
      this.navigationOuverte.set(false);
    }
  }
}
