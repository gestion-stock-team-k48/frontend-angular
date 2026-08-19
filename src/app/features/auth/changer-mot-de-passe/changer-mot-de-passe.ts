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
 * Changement de mot de passe par l'utilisateur connecté.
 *
 * Deux usages pour un seul écran : le changement volontaire, depuis le bandeau, et le
 * changement imposé au premier accès, quand l'administrateur a créé le compte avec un mot
 * de passe temporaire. Dans ce second cas, il n'y a pas de sortie : la garde ramène ici
 * tant que le mot de passe n'a pas été remplacé.
 */
@Component({
  selector: 'app-changer-mot-de-passe',
  templateUrl: './changer-mot-de-passe.html',
  styleUrl: '../formulaire-auth.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, RouterLink, Bouton, Champ],
})
export class ChangerMotDePasse {
  private readonly auth = inject(ServiceAuthentification);
  private readonly notifications = inject(ServiceNotifications);
  private readonly router = inject(Router);

  private readonly saisie = signal({ oldPassword: '', newPassword: '', confirmation: '' });

  protected readonly formulaire = form(this.saisie, (champ) => {
    required(champ.oldPassword, { message: "L'ancien mot de passe est obligatoire" });
    required(champ.newPassword, { message: 'Le nouveau mot de passe est obligatoire' });
    minLength(champ.newPassword, LONGUEUR_MINIMALE_MOT_DE_PASSE, {
      message: `Le mot de passe doit contenir au moins ${LONGUEUR_MINIMALE_MOT_DE_PASSE} caractères`,
    });
    validate(champ.newPassword, ({ value, valueOf }) =>
      value().length > 0 && value() === valueOf(champ.oldPassword)
        ? { kind: 'inchange', message: "Le nouveau mot de passe doit différer de l'ancien" }
        : undefined,
    );
    required(champ.confirmation, { message: 'La confirmation est obligatoire' });
    validate(champ.confirmation, ({ value, valueOf }) =>
      value() === valueOf(champ.newPassword)
        ? undefined
        : { kind: 'confirmation', message: 'Les deux mots de passe ne sont pas identiques' },
    );
  });

  protected readonly message = signal<string | null>(null);

  /** Vrai quand l'écran est imposé plutôt que choisi : ni titre, ni issue de secours. */
  protected readonly impose = this.auth.doitChangerMotDePasse;

  protected readonly erreurAncien = computed(() =>
    this.formulaire.oldPassword().touched()
      ? messageDuChamp(this.formulaire.oldPassword().errors())
      : null,
  );

  protected readonly erreurNouveau = computed(() =>
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

  protected async changer(): Promise<void> {
    this.message.set(null);

    await submit(this.formulaire, {
      action: async () => {
        const { oldPassword, newPassword } = this.saisie();
        try {
          await firstValueFrom(this.auth.changerMotDePasse({ oldPassword, newPassword }));
          this.notifications.succes('Mot de passe modifié');
          await this.router.navigate(['/']);
          return undefined;
        } catch (erreur) {
          const echec = repartirErreur(erreur, {
            oldPassword: this.formulaire.oldPassword,
            newPassword: this.formulaire.newPassword,
          });
          this.message.set(echec.message);
          return echec.erreurs;
        }
      },
    });
  }
}
