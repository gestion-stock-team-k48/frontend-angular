import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';

/**
 * Boîte de dialogue bâtie sur l'élément natif `<dialog>`.
 *
 * Le navigateur fournit déjà le piège de focus, la fermeture par Échap, le voile et
 * l'inertie du reste de la page. Reconstruire tout cela en JavaScript coûterait des
 * défauts d'accessibilité pour aucun gain.
 */
@Component({
  selector: 'app-modale',
  templateUrl: './modale.html',
  styleUrl: './modale.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Modale {
  readonly ouverte = input.required<boolean>();
  readonly titre = input.required<string>();

  /** Empêche la fermeture par Échap ou par clic sur le voile. Réservé aux opérations en cours. */
  readonly bloquante = input(false);

  readonly fermeture = output<void>();

  private readonly dialogue = viewChild.required<ElementRef<HTMLDialogElement>>('dialogue');

  private ecouteurPose = false;

  constructor() {
    effect(() => {
      const element = this.dialogue().nativeElement;

      // Posé en code plutôt que dans le gabarit : il ne s'agit pas d'un élément
      // interactif à rendre focusable, mais du voile du dialogue. Le clavier ferme la
      // modale par Échap, que l'événement `cancel` prend en charge.
      if (!this.ecouteurPose) {
        element.addEventListener('click', (evenement) => this.clicSurVoile(evenement));
        this.ecouteurPose = true;
      }

      if (this.ouverte()) {
        if (!element.open) {
          element.showModal();
        }
      } else if (element.open) {
        element.close();
      }
    });
  }

  protected demanderFermeture(evenement: Event): void {
    // `cancel` est émis par Échap. On le laisse passer seulement si la modale l'autorise.
    evenement.preventDefault();

    if (!this.bloquante()) {
      this.fermeture.emit();
    }
  }

  private clicSurVoile(evenement: MouseEvent): void {
    if (this.bloquante()) {
      return;
    }

    // Le clic n'atteint le `<dialog>` lui-même que s'il a eu lieu sur le voile :
    // le contenu est dans un enfant, qui aurait intercepté l'événement.
    if (evenement.target === this.dialogue().nativeElement) {
      this.fermeture.emit();
    }
  }
}
