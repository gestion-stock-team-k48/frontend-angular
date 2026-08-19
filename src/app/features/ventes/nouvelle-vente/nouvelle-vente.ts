import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormField, form, maxLength, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ServiceNotifications } from '../../../core/notifications/notifications';
import { Bouton } from '../../../shared/ui/bouton/bouton';
import { Champ } from '../../../shared/ui/champ/champ';
import { EditeurLignes } from '../../../shared/commerce/editeur-lignes';
import { lignesValides, type LigneSaisie } from '../../../shared/commerce/lignes';
import { messageDuChamp, repartirErreur } from '../../../shared/formulaires/erreurs-formulaire';
import {
  TAILLE_LISTE_DEROULANTE,
  parametresDePage,
  type ReponsePage,
} from '../../../core/api/pagination';
import { ApiVentes } from '../vente-api';
import type { Article } from '../../../core/api/api-types';

/** Longueur reprise des contraintes portées par `VenteRequest`. */
const MAX_COMMENTAIRE = 500;

/** Le code de la vente n'est pas saisi : le serveur l'attribue et garantit son unicité. */
interface SaisieVente {
  commentaire: string;
}

/**
 * Enregistrement d'une vente.
 *
 * L'écriture est définitive : le serveur sort aussitôt les articles du stock, et refuse
 * ensuite toute modification comme toute suppression. L'écran le dit avant l'envoi, pas
 * après.
 */
@Component({
  selector: 'app-nouvelle-vente',
  templateUrl: './nouvelle-vente.html',
  styleUrl: './nouvelle-vente.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, RouterLink, Bouton, Champ, EditeurLignes],
})
export class NouvelleVente {
  private readonly api = inject(ApiVentes);
  private readonly notifications = inject(ServiceNotifications);
  private readonly router = inject(Router);

  private readonly ressourceArticles = httpResource<ReponsePage<Article>>(() => ({
    url: this.api.urlArticles,
    params: parametresDePage({ page: 0, taille: TAILLE_LISTE_DEROULANTE }),
  }));

  protected readonly articles = computed(() => this.ressourceArticles.value()?.content ?? []);

  protected readonly catalogueTronque = computed(
    () => (this.ressourceArticles.value()?.totalElements ?? 0) > TAILLE_LISTE_DEROULANTE,
  );

  protected readonly lignes = signal<LigneSaisie[]>([{ articleId: '', quantite: 1 }]);

  private readonly saisie = signal<SaisieVente>({ commentaire: '' });

  protected readonly formulaire = form(this.saisie, (champ) => {
    maxLength(champ.commentaire, MAX_COMMENTAIRE, {
      message: `Le commentaire ne doit pas dépasser ${MAX_COMMENTAIRE} caractères`,
    });
  });

  protected readonly message = signal<string | null>(null);

  protected readonly enCours = computed(() => this.formulaire().submitting());

  protected readonly erreurCommentaire = computed(() =>
    this.formulaire.commentaire().touched()
      ? messageDuChamp(this.formulaire.commentaire().errors())
      : null,
  );

  protected async enregistrer(): Promise<void> {
    this.message.set(null);

    if (!lignesValides(this.lignes())) {
      this.message.set('La vente doit contenir au moins une ligne complète.');
      return;
    }

    await submit(this.formulaire, {
      action: async () => {
        const { commentaire } = this.saisie();

        try {
          const vente = await firstValueFrom(
            this.api.creer({
              ...(commentaire.trim() === '' ? {} : { commentaire: commentaire.trim() }),
              lignes: this.lignes().map((ligne) => ({
                articleId: Number(ligne.articleId),
                quantite: ligne.quantite,
              })),
            }),
          );
          this.notifications.succes('Vente enregistrée', vente.code ?? '');
          await this.router.navigate(['/ventes', vente.id]);
          return undefined;
        } catch (erreur) {
          const echec = repartirErreur(erreur, {
            commentaire: this.formulaire.commentaire,
          });
          this.message.set(echec.message);
          return echec.erreurs;
        }
      },
    });
  }
}
