import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Maquette de l'application, dessinée avec les tokens du projet.
 *
 * Ni capture d'écran ni image : un dessin qui se recolore avec le thème et avec la couleur
 * d'amorce, comme l'écran réel. Ce qu'on montre sur la vitrine est donc toujours ce qu'on
 * obtient, sans qu'une capture ait à être refaite à chaque retouche.
 */
@Component({
  selector: 'app-apercu-application',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <div class="apercu">
      <div class="apercu__bandeau">
        <span class="apercu__pastille"></span>
        <span class="apercu__barre"></span>
      </div>

      <div class="apercu__corps">
        <div class="apercu__rail">
          @for (rang of rangs; track rang) {
            <span class="apercu__puce"></span>
          }
        </div>

        <div class="apercu__ecran">
          <div class="apercu__tuiles">
            <span class="apercu__tuile apercu__tuile--forte"></span>
            <span class="apercu__tuile"></span>
            <span class="apercu__tuile"></span>
          </div>

          <svg class="apercu__graphique" viewBox="0 0 240 80" preserveAspectRatio="none">
            <path
              class="apercu__aire"
              d="M0 62 L40 54 L80 58 L120 34 L160 40 L200 18 L240 26 L240 80 L0 80 Z"
            />
            <path class="apercu__courbe" d="M0 62 L40 54 L80 58 L120 34 L160 40 L200 18 L240 26" />
          </svg>

          <div class="apercu__lignes">
            @for (rang of [1, 2, 3]; track rang) {
              <span class="apercu__ligne"></span>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './apercu.scss',
})
export class ApercuApplication {
  protected readonly rangs = [1, 2, 3, 4, 5];
}
