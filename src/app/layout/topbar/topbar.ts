import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { ServiceAuthentification } from '../../core/auth/auth';
import { ServiceChargement } from '../../core/http/loading';
import { ServiceTheme } from '../../core/theme/theme';

/** Bandeau supérieur : entreprise courante, indicateur d'activité, thème, compte. */
@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Topbar {
  protected readonly auth = inject(ServiceAuthentification);
  protected readonly theme = inject(ServiceTheme);
  protected readonly chargement = inject(ServiceChargement);

  readonly sidebarOuverte = input(false);
  readonly bascule = output<void>();

  protected basculerTheme(): void {
    this.theme.definirMode(this.theme.themeApplique() === 'sombre' ? 'clair' : 'sombre');
  }
}
