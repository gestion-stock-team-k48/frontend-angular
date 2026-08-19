import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

let compteurIdentifiants = 0;

/**
 * Enveloppe d'un contrôle de formulaire : libellé, aide, message d'erreur.
 *
 * Le contrôle lui-même est projeté, ce qui laisse le choix de l'élément — `input`,
 * `select`, `textarea` — sans dupliquer ce composant. Les identifiants `for`,
 * `aria-describedby` et `aria-errormessage` sont exposés pour être posés sur le contrôle.
 */
@Component({
  selector: 'app-champ',
  templateUrl: './champ.html',
  styleUrl: './champ.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Champ {
  readonly libelle = input.required<string>();

  /** Texte d'aide affiché sous le contrôle, tant qu'aucune erreur ne le remplace. */
  readonly aide = input<string | null>(null);

  /** Message d'erreur. Sa présence bascule le champ en état invalide. */
  readonly erreur = input<string | null>(null);

  readonly requis = input(false);

  /** Identifiant du contrôle. Généré si l'appelant n'en fournit pas. */
  readonly identifiant = input<string>(`champ-${++compteurIdentifiants}`);

  readonly identifiantAide = computed(() => `${this.identifiant()}-aide`);
  readonly identifiantErreur = computed(() => `${this.identifiant()}-erreur`);

  readonly invalide = computed(() => this.erreur() !== null && this.erreur() !== '');

  /** À poser sur le contrôle projeté, pour que le lecteur d'écran annonce le bon texte. */
  readonly decritPar = computed(() =>
    this.invalide() ? this.identifiantErreur() : this.aide() ? this.identifiantAide() : null,
  );
}
