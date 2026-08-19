import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormField, email, form, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ServiceAuthentification } from '../../../core/auth/auth';
import { Bouton } from '../../../shared/ui/bouton/bouton';
import { Champ } from '../../../shared/ui/champ/champ';
import { messageDuChamp, repartirErreur } from '../erreurs-formulaire';

/**
 * Demande d'un code de réinitialisation.
 *
 * Le backend répond de la même façon que l'email soit connu ou non. L'écran dit donc
 * « si un compte existe » : lui faire dire autre chose transformerait ce formulaire en
 * moyen de vérifier qui possède un compte dans l'application.
 */
@Component({
  selector: 'app-mot-de-passe-oublie',
  templateUrl: './mot-de-passe-oublie.html',
  styleUrl: '../formulaire-auth.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, RouterLink, Bouton, Champ],
})
export class MotDePasseOublie {
  private readonly auth = inject(ServiceAuthentification);

  private readonly demande = signal({ email: '' });

  protected readonly formulaire = form(this.demande, (champ) => {
    required(champ.email, { message: "L'email est obligatoire" });
    email(champ.email, { message: "L'email doit être valide" });
  });

  protected readonly message = signal<string | null>(null);
  protected readonly envoye = signal(false);

  protected readonly erreurEmail = computed(() =>
    this.formulaire.email().touched() ? messageDuChamp(this.formulaire.email().errors()) : null,
  );

  protected readonly enCours = computed(() => this.formulaire().submitting());

  protected async demander(): Promise<void> {
    this.message.set(null);

    await submit(this.formulaire, {
      action: async () => {
        try {
          await firstValueFrom(this.auth.demanderReinitialisation(this.demande()));
          this.envoye.set(true);
          return undefined;
        } catch (erreur) {
          const echec = repartirErreur(erreur, { email: this.formulaire.email });
          this.message.set(echec.message);
          return echec.erreurs;
        }
      },
    });
  }
}
