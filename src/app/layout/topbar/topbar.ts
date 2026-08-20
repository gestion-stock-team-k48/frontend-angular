import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ServiceAuthentification } from '../../core/auth/auth';
import { Icone } from '../../shared/ui/icone/icone';
import { ServiceChargement } from '../../core/http/loading';
import { ServiceTheme } from '../../core/theme/theme';

/** Bandeau supérieur : entreprise courante, indicateur d'activité, thème, compte. */
@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icone],
})
export class Topbar {
  protected readonly auth = inject(ServiceAuthentification);
  protected readonly theme = inject(ServiceTheme);
  protected readonly chargement = inject(ServiceChargement);
  private readonly router = inject(Router);

  readonly sidebarOuverte = input(false);
  readonly bascule = output<void>();

  /**
   * Ferme la session et ramène à la connexion.
   *
   * L'effacement précède la navigation : la garde de la route de connexion refuse une
   * session ouverte, et renverrait dans l'application l'utilisateur qui vient d'en sortir.
   */
  protected async deconnecter(): Promise<void> {
    this.auth.deconnecter();
    await this.router.navigate(['/connexion']);
  }

  /** Initiales du compte, pour la pastille du bandeau quand la place manque. */
  protected readonly initiales = computed(() => {
    const utilisateur = this.auth.utilisateur();
    const prenom = utilisateur?.prenom ?? '';
    const nom = utilisateur?.nom ?? '';
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase() || '?';
  });

  protected basculerTheme(): void {
    this.theme.definirMode(this.theme.themeApplique() === 'sombre' ? 'clair' : 'sombre');
  }
}
