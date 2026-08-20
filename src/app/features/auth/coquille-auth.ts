import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ServiceTheme } from '../../core/theme/theme';
import { Icone } from '../../shared/ui/icone/icone';

/** Ce que l'application tient, rappelé pendant la saisie. Trois points, pas une brochure. */
const POINTS: readonly string[] = [
  'Le stock réel, déduit de ses mouvements',
  "L'alerte avant la rupture, article par article",
  'Commandes, ventes et tableau de bord au même endroit',
];

/**
 * Coquille des écrans d'authentification.
 *
 * Volontairement hors du shell applicatif : ni navigation, ni fil d'Ariane. Montrer un menu
 * à qui n'est pas encore entré donnerait à cliquer sur des écrans inaccessibles.
 *
 * Deux colonnes sur grand écran — la marque à gauche, la saisie à droite —, une seule dès
 * que la largeur manque : le panneau de marque cède la place, la saisie reste.
 */
@Component({
  selector: 'app-coquille-auth',
  templateUrl: './coquille-auth.html',
  styleUrl: './coquille-auth.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterOutlet, Icone],
})
export class CoquilleAuth {
  protected readonly theme = inject(ServiceTheme);

  protected readonly points = POINTS;

  protected basculerTheme(): void {
    this.theme.definirMode(this.theme.themeApplique() === 'sombre' ? 'clair' : 'sombre');
  }
}
