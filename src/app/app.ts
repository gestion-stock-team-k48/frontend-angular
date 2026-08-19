import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PRESETS_AMORCE, ServiceTheme } from './core/theme/theme';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly theme = inject(ServiceTheme);
  protected readonly presets = PRESETS_AMORCE;
  protected readonly surfaces = [0, 1, 2, 3] as const;

  protected basculerDensite(): void {
    this.theme.definirDensite(this.theme.densite() === 'compact' ? 'confortable' : 'compact');
  }
}
