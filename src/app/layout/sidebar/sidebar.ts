import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NAVIGATION, type GroupeNavigation } from '../navigation';
import { ServiceAuthentification } from '../../core/auth/auth';

/**
 * Navigation principale.
 *
 * Les entrées dont l'écran n'existe pas encore restent visibles mais inertes : masquer la
 * moitié de la navigation donnerait une fausse idée du périmètre de l'application.
 */
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
})
export class Sidebar {
  private readonly auth = inject(ServiceAuthentification);

  readonly repliee = input(false);
  readonly fermeture = output<void>();

  /** Les entrées réservées à un rôle disparaissent pour qui ne l'a pas. */
  readonly groupes = computed<readonly GroupeNavigation[]>(() =>
    NAVIGATION.map((groupe) => ({
      titre: groupe.titre,
      entrees: groupe.entrees.filter((entree) => !entree.role || this.auth.aRole(entree.role)),
    })).filter((groupe) => groupe.entrees.length > 0),
  );
}
