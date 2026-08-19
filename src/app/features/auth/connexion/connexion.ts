import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormField, email, form, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ServiceAuthentification } from '../../../core/auth/auth';
import { Bouton } from '../../../shared/ui/bouton/bouton';
import { Champ } from '../../../shared/ui/champ/champ';
import { messageDuChamp, repartirErreur } from '../erreurs-formulaire';
import { destinationSure } from '../destination';

/**
 * Écran de connexion.
 *
 * C'est la porte d'entrée de l'application : toutes les gardes et l'intercepteur de
 * rafraîchissement y renvoient, en emportant l'écran demandé dans `returnUrl`.
 */
@Component({
  selector: 'app-connexion',
  templateUrl: './connexion.html',
  styleUrl: '../formulaire-auth.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, RouterLink, Bouton, Champ],
})
export class Connexion {
  private readonly auth = inject(ServiceAuthentification);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly identifiants = signal({ email: '', motDePasse: '' });

  protected readonly formulaire = form(this.identifiants, (champ) => {
    required(champ.email, { message: "L'email est obligatoire" });
    email(champ.email, { message: "L'email doit être valide" });
    required(champ.motDePasse, { message: 'Le mot de passe est obligatoire' });
  });

  /** Message d'ensemble : identifiants refusés, serveur injoignable, réponse illisible. */
  protected readonly message = signal<string | null>(null);

  protected readonly erreurEmail = computed(() =>
    this.formulaire.email().touched() ? messageDuChamp(this.formulaire.email().errors()) : null,
  );

  protected readonly erreurMotDePasse = computed(() =>
    this.formulaire.motDePasse().touched()
      ? messageDuChamp(this.formulaire.motDePasse().errors())
      : null,
  );

  protected readonly enCours = computed(() => this.formulaire().submitting());

  protected async connecter(): Promise<void> {
    this.message.set(null);

    await submit(this.formulaire, {
      action: async () => {
        try {
          await firstValueFrom(this.auth.authentifier(this.identifiants()));
          await this.router.navigateByUrl(this.destination());
          return undefined;
        } catch (erreur) {
          const echec = repartirErreur(erreur, {
            email: this.formulaire.email,
            motDePasse: this.formulaire.motDePasse,
          });
          this.message.set(echec.message);
          return echec.erreurs;
        }
      },
    });
  }

  private destination(): string {
    return destinationSure(this.route.snapshot.queryParamMap.get('returnUrl'));
  }
}
