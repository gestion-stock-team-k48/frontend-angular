import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_BASE_URL } from '../../../core/config/app-config';
import { EtatVide } from '../../../shared/ui/etat-vide/etat-vide';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { Tableau, type ColonneTableau, type EtatTableau } from '../../../shared/ui/tableau/tableau';
import { QuantitePipe } from '../../../shared/pipes/quantite';
import {
  TAILLE_PAGE_PAR_DEFAUT,
  contenuDePage,
  etatDePage,
  parametresDePage,
  type ReponsePage,
  type Tri,
} from '../../../core/api/pagination';
import type { Article } from '../../../core/api/api-types';

const COLONNES: readonly ColonneTableau[] = [
  { cle: 'code', libelle: 'Code', triable: true },
  { cle: 'designation', libelle: 'Désignation', triable: true },
  { cle: 'seuilMinimum', libelle: 'Seuil minimal', triable: true, alignement: 'fin' },
];

/**
 * Point d'entrée des mouvements de stock.
 *
 * Le backend ne publie aucune liste globale des mouvements : ils se lisent article par
 * article. L'écran commence donc par le choix de l'article, plutôt que d'appeler le stock
 * réel de chaque ligne du catalogue — ce serait une requête par article, à chaque page.
 */
@Component({
  selector: 'app-choix-article',
  templateUrl: './choix-article.html',
  styleUrl: './choix-article.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EtatVide, Pagination, Tableau, QuantitePipe],
})
export class ChoixArticle {
  private readonly baseUrl = inject(API_BASE_URL);

  protected readonly colonnes = COLONNES;

  protected readonly page = signal(0);
  protected readonly taille = signal(TAILLE_PAGE_PAR_DEFAUT);
  protected readonly tri = signal<Tri>({ champ: 'designation', sens: 'asc' });

  private readonly ressource = httpResource<ReponsePage<Article>>(() => ({
    url: `${this.baseUrl}/articles`,
    params: parametresDePage({ page: this.page(), taille: this.taille(), tri: this.tri() }),
  }));

  protected readonly articles = computed(() => contenuDePage(this.ressource.value()));

  protected readonly etatPage = computed(() => etatDePage(this.ressource.value()));

  protected readonly etat = computed<EtatTableau>(() => {
    if (this.ressource.isLoading()) {
      return 'chargement';
    }
    if (this.ressource.error() !== undefined) {
      return 'erreur';
    }
    return this.articles().length === 0 ? 'vide' : 'pret';
  });

  protected changerTri(tri: Tri): void {
    this.tri.set(tri);
    this.page.set(0);
  }

  protected changerTaille(taille: number): void {
    this.taille.set(taille);
    this.page.set(0);
  }

  protected reessayer(): void {
    this.ressource.reload();
  }
}
