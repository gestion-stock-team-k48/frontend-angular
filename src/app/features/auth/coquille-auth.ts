import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ServiceTheme } from '../../core/theme/theme';

/**
 * Coquille des écrans d'authentification.
 *
 * Volontairement hors du shell applicatif : ni navigation, ni fil d'Ariane. Montrer un menu
 * à qui n'est pas encore entré donnerait à cliquer sur des écrans inaccessibles.
 *
 * Le bouton de thème est repris ici parce que ces écrans peuvent être les tout premiers
 * affichés, avant même qu'un utilisateur ait accès au bandeau applicatif.
 */
@Component({
  selector: 'app-coquille-auth',
  templateUrl: './coquille-auth.html',
  styleUrl: './coquille-auth.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
})
export class CoquilleAuth {
  protected readonly theme = inject(ServiceTheme);

  protected basculerTheme(): void {
    this.theme.definirMode(this.theme.themeApplique() === 'sombre' ? 'clair' : 'sombre');
  }
}
