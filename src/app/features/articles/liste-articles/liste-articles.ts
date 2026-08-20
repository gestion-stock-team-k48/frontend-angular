import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ServiceNotifications } from '../../../core/notifications/notifications';
import { Bouton } from '../../../shared/ui/bouton/bouton';
import { EtatVide } from '../../../shared/ui/etat-vide/etat-vide';
import { Modale } from '../../../shared/ui/modale/modale';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { Tableau, type ColonneTableau, type EtatTableau } from '../../../shared/ui/tableau/tableau';
import { MontantPipe } from '../../../shared/pipes/montant';
import {
  TAILLE_PAGE_PAR_DEFAUT,
  contenuDePage,
  etatDePage,
  parametresDePage,
  type ReponsePage,
  type Tri,
} from '../../../core/api/pagination';
import { ApiArticles } from '../article-api';
import type { Article } from '../../../core/api/api-types';

const COLONNES: readonly ColonneTableau[] = [
  { cle: 'code', libelle: 'Code', triable: true },
  { cle: 'designation', libelle: 'Désignation', triable: true },
  { cle: 'categorie', libelle: 'Catégorie' },
  { cle: 'prixUnitaireHt', libelle: 'Prix HT', triable: true, alignement: 'fin' },
  { cle: 'tauxTva', libelle: 'TVA', triable: true, alignement: 'fin' },
  { cle: 'prixUnitaireTtc', libelle: 'Prix TTC', triable: true, alignement: 'fin' },
  { cle: 'seuilMinimum', libelle: 'Seuil', triable: true, alignement: 'fin' },
];

/**
 * Liste des articles, paginée par le serveur.
 *
 * Le backend n'expose ni recherche ni filtre sur cet endpoint : il n'y a donc pas de champ
 * de recherche. En ajouter un qui ne trierait que la page affichée mentirait à l'utilisateur
 * dès la deuxième page. L'écart est signalé dans `docs/06-API-CONTRAT.md`.
 */
@Component({
  selector: 'app-liste-articles',
  templateUrl: './liste-articles.html',
  styleUrl: './liste-articles.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Bouton, EtatVide, Modale, Pagination, Tableau, MontantPipe],
})
export class ListeArticles {
  private readonly api = inject(ApiArticles);
  private readonly notifications = inject(ServiceNotifications);

  protected readonly colonnes = COLONNES;

  protected readonly page = signal(0);
  protected readonly taille = signal(TAILLE_PAGE_PAR_DEFAUT);
  protected readonly tri = signal<Tri>({ champ: 'code', sens: 'asc' });

  private readonly ressource = httpResource<ReponsePage<Article>>(() => ({
    url: this.api.url,
    params: parametresDePage({
      page: this.page(),
      taille: this.taille(),
      tri: this.tri(),
    }),
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

  protected readonly articleASupprimer = signal<Article | null>(null);
  protected readonly suppressionEnCours = signal(false);

  protected changerTri(tri: Tri): void {
    this.tri.set(tri);
    this.page.set(0);
  }

  protected changerTaille(taille: number): void {
    this.taille.set(taille);
    // Repartir de la première page : la ligne consultée à la page 7 de vingt éléments n'a
    // plus rien à voir avec la page 7 de cent.
    this.page.set(0);
  }

  protected async supprimer(): Promise<void> {
    const article = this.articleASupprimer();
    if (article?.id === undefined) {
      return;
    }

    this.suppressionEnCours.set(true);
    try {
      await firstValueFrom(this.api.supprimer(article.id));
      this.notifications.succes('Article supprimé', article.designation);
      this.articleASupprimer.set(null);
      this.rechargerApresSuppression();
    } catch {
      // L'intercepteur d'erreurs a déjà présenté le refus — un article engagé dans une
      // commande, une vente ou un mouvement de stock ne se supprime pas.
    } finally {
      this.suppressionEnCours.set(false);
    }
  }

  protected reessayer(): void {
    this.ressource.reload();
  }

  /** Supprimer le dernier élément d'une page vide cette page : reculer d'un cran. */
  private rechargerApresSuppression(): void {
    const etat = this.etatPage();
    if (etat.nombreElements === 1 && !etat.premiere) {
      this.page.set(etat.numero - 1);
      return;
    }
    this.ressource.reload();
  }
}
