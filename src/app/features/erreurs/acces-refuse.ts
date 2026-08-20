import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-acces-refuse',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="erreur">
      <p class="erreur__code" data-numerique>403</p>
      <h1>Cet écran est réservé</h1>
      <p class="erreur__message">
        Le compte utilisé n'a pas les droits nécessaires. Demander l'accès à un administrateur de
        l'entreprise, ou revenir à un écran autorisé.
      </p>
      <a class="erreur__lien" routerLink="/">Revenir à l'accueil</a>
    </section>
  `,
  styleUrl: './erreur.scss',
})
export class AccesRefuse {}
