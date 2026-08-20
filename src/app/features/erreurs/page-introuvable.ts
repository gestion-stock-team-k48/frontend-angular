import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-introuvable',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="erreur">
      <p class="erreur__code" data-numerique>404</p>
      <h1>Cette page n'existe pas</h1>
      <p class="erreur__message">
        L'adresse demandée ne correspond à aucun écran. Elle a peut-être changé, ou l'écran n'est
        pas encore développé.
      </p>
      <a class="erreur__lien" routerLink="/">Revenir à l'accueil</a>
    </section>
  `,
  styleUrl: './erreur.scss',
})
export class PageIntrouvable {}
