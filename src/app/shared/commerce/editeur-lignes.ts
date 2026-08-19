import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { MontantPipe } from '../pipes/montant';
import {
  ligneVide,
  lignesValides,
  totalEstime,
  type ArticleTarife,
  type LigneSaisie,
} from './lignes';

/**
 * Saisie des lignes d'une commande ou d'une vente.
 *
 * Le total affiché est indicatif : le serveur recalcule les totaux à partir des prix qu'il a
 * en base. L'afficher quand même évite de saisir dix lignes à l'aveugle, mais il est annoncé
 * comme estimé plutôt que présenté comme le montant final.
 */
@Component({
  selector: 'app-editeur-lignes',
  templateUrl: './editeur-lignes.html',
  styleUrl: './editeur-lignes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MontantPipe],
})
export class EditeurLignes {
  readonly articles = input.required<readonly ArticleTarife[]>();

  /** Vrai quand le catalogue proposé est tronqué : le `select` ne montre pas tout. */
  readonly catalogueTronque = input(false);

  readonly lignes = model.required<LigneSaisie[]>();

  readonly desactive = input(false);

  protected readonly valides = computed(() => lignesValides(this.lignes()));

  protected readonly total = computed(() => totalEstime(this.lignes(), this.articles()));

  protected ajouter(): void {
    this.lignes.update((lignes) => [...lignes, ligneVide()]);
  }

  protected retirer(index: number): void {
    this.lignes.update((lignes) => lignes.filter((_, rang) => rang !== index));
  }

  protected changerArticle(index: number, evenement: Event): void {
    const cible = evenement.target;
    if (!(cible instanceof HTMLSelectElement)) {
      return;
    }
    this.majLigne(index, { articleId: cible.value });
  }

  protected changerQuantite(index: number, evenement: Event): void {
    const cible = evenement.target;
    if (!(cible instanceof HTMLInputElement)) {
      return;
    }
    this.majLigne(index, { quantite: Number(cible.value) });
  }

  /** Prix unitaire de l'article choisi, pour que la ligne se relise sans deviner. */
  protected prixDe(ligne: LigneSaisie): number | null {
    const article = this.articles().find((candidat) => String(candidat.id) === ligne.articleId);
    return article?.prixUnitaireTtc ?? null;
  }

  private majLigne(index: number, modification: Partial<LigneSaisie>): void {
    this.lignes.update((lignes) =>
      lignes.map((ligne, rang) => (rang === index ? { ...ligne, ...modification } : ligne)),
    );
  }
}
