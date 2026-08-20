import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormField, form, minLength, required, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ServiceAuthentification } from '../../../core/auth/auth';
import { ServiceNotifications } from '../../../core/notifications/notifications';
import { Bouton } from '../../../shared/ui/bouton/bouton';
import { Champ } from '../../../shared/ui/champ/champ';
import { LONGUEUR_MINIMALE_MOT_DE_PASSE } from '../regles-mot-de-passe';
import { messageDuChamp, repartirErreur } from '../../../shared/formulaires/erreurs-formulaire';

/**
 * Définition d'un nouveau mot de passe à partir du code reçu par email.
 *
 * Le code est un identifiant à recopier, pas un lien : l'email envoyé par le backend
 * l'affiche tel quel, sans URL de retour vers l'application.
 */
@Component({
  selector: 'app-reinitialisation',
  templateUrl: './reinitialisation.html',
  styleUrl: '../formulaire-auth.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, RouterLink, Bouton, Champ],
})
export class Reinitialisation {
  private readonly auth = inject(ServiceAuthentification);
  private readonly notifications = inject(ServiceNotifications);
  private readonly router = inject(Router);

  private readonly saisie = signal({ token: '', newPassword: '', confirmation: '' });

  protected readonly formulaire = form(this.saisie, (champ) => {
    required(champ.token, { message: 'Le code de réinitialisation est obligatoire' });
    required(champ.newPassword, { message: 'Le nouveau mot de passe est obligatoire' });
    minLength(champ.newPassword, LONGUEUR_MINIMALE_MOT_DE_PASSE, {
      message: `Le mot de passe doit contenir au moins ${LONGUEUR_MINIMALE_MOT_DE_PASSE} caractères`,
    });
    required(champ.confirmation, { message: 'La confirmation est obligatoire' });
    validate(champ.confirmation, ({ value, valueOf }) =>
      value() === valueOf(champ.newPassword)
        ? undefined
        : { kind: 'confirmation', message: 'Les deux mots de passe ne sont pas identiques' },
    );
  });

  protected readonly message = signal<string | null>(null);

  protected readonly erreurToken = computed(() =>
    this.formulaire.token().touched() ? messageDuChamp(this.formulaire.token().errors()) : null,
  );

  protected readonly erreurMotDePasse = computed(() =>
    this.formulaire.newPassword().touched()
      ? messageDuChamp(this.formulaire.newPassword().errors())
      : null,
  );

  protected readonly erreurConfirmation = computed(() =>
    this.formulaire.confirmation().touched()
      ? messageDuChamp(this.formulaire.confirmation().errors())
      : null,
  );

  protected readonly enCours = computed(() => this.formulaire().submitting());

  protected readonly longueurMinimale = LONGUEUR_MINIMALE_MOT_DE_PASSE;

  protected async reinitialiser(): Promise<void> {
    this.message.set(null);

    await submit(this.formulaire, {
      action: async () => {
        const { token, newPassword } = this.saisie();
        try {
          await firstValueFrom(this.auth.reinitialiser({ token, newPassword }));
          this.notifications.succes(
            'Mot de passe réinitialisé',
            'Se connecter avec le nouveau mot de passe.',
          );
          await this.router.navigate(['/connexion']);
          return undefined;
        } catch (erreur) {
          const echec = repartirErreur(erreur, {
            token: this.formulaire.token,
            newPassword: this.formulaire.newPassword,
          });
          this.message.set(echec.message);
          return echec.erreurs;
        }
      },
    });
  }
}
