import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { API_BASE_URL } from '../../../core/config/app-config';
import { ServiceNotifications } from '../../../core/notifications/notifications';
import { Badge } from '../../../shared/ui/badge/badge';
import { Bouton } from '../../../shared/ui/bouton/bouton';
import { EtatVide } from '../../../shared/ui/etat-vide/etat-vide';
import { JaugeSeuil } from '../../../shared/ui/jauge-seuil/jauge-seuil';
import { Modale } from '../../../shared/ui/modale/modale';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { Tableau, type ColonneTableau, type EtatTableau } from '../../../shared/ui/tableau/tableau';
import { QuantitePipe } from '../../../shared/pipes/quantite';
import {
  TAILLE_PAGE_PAR_DEFAUT,
  contenuDePage,
  etatDePage,
  parametresDePage,
  type ReponsePage,
} from '../../../core/api/pagination';
import { FormulaireMouvement } from '../formulaire-mouvement/formulaire-mouvement';
import { ApiMouvementsStock, type OperationStock } from '../mouvement-api';
import { ajouteAuStock, libelleSource, libelleType } from '../libelles';
import type { Article, MouvementStock } from '../../../core/api/api-types';

const COLONNES: readonly ColonneTableau[] = [
  { cle: 'dateMvt', libelle: 'Date' },
  { cle: 'typeMvt', libelle: 'Mouvement' },
  { cle: 'quantite', libelle: 'Quantité', alignement: 'fin' },
  { cle: 'sourceMvt', libelle: 'Source' },
  { cle: 'motif', libelle: 'Motif' },
];

const TITRES: Readonly<Record<OperationStock, string>> = {
  entree: 'Enregistrer une entrée',
  sortie: 'Enregistrer une sortie',
  'correction-positive': 'Correction positive',
  'correction-negative': 'Correction négative',
};

/**
 * Stock d'un article : sa mesure, son historique, et les quatre opérations qui le font
 * bouger.
 *
 * Le stock réel vient du backend, qui le dérive des mouvements. L'interface ne le recalcule
 * jamais — elle le redemande après chaque écriture.
 *
 * L'historique n'est pas triable : le backend le renvoie dans l'ordre des dates, et le
 * paramètre `sort` n'y change rien. Proposer des en-têtes cliquables sans effet mentirait.
 */
@Component({
  selector: 'app-stock-article',
  templateUrl: './stock-article.html',
  styleUrl: './stock-article.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RouterLink,
    Badge,
    Bouton,
    EtatVide,
    JaugeSeuil,
    Modale,
    Pagination,
    Tableau,
    QuantitePipe,
    FormulaireMouvement,
  ],
})
export class StockArticle {
  private readonly api = inject(ApiMouvementsStock);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly notifications = inject(ServiceNotifications);
  private readonly route = inject(ActivatedRoute);

  protected readonly colonnes = COLONNES;
  protected readonly libelleType = libelleType;
  protected readonly libelleSource = libelleSource;
  protected readonly ajouteAuStock = ajouteAuStock;

  protected readonly identifiant = signal<number>(
    Number.parseInt(this.route.snapshot.paramMap.get('id') ?? '', 10) || 0,
  );

  private readonly ressourceArticle = httpResource<Article>(
    () => `${this.baseUrl}/articles/${this.identifiant()}`,
  );

  private readonly ressourceStock = httpResource<number>(() =>
    this.api.urlStockReel(this.identifiant()),
  );

  protected readonly page = signal(0);
  protected readonly taille = signal(TAILLE_PAGE_PAR_DEFAUT);

  private readonly ressourceHistorique = httpResource<ReponsePage<MouvementStock>>(() => ({
    url: this.api.urlHistorique(this.identifiant()),
    params: parametresDePage({ page: this.page(), taille: this.taille() }),
  }));

  protected readonly article = this.ressourceArticle.value;

  protected readonly stockReel = computed(() => this.ressourceStock.value() ?? 0);

  protected readonly seuil = computed(() => this.article()?.seuilMinimum ?? 0);

  protected readonly sousLeSeuil = computed(() => this.stockReel() <= this.seuil());

  protected readonly mouvements = computed(() => contenuDePage(this.ressourceHistorique.value()));

  protected readonly etatPage = computed(() => etatDePage(this.ressourceHistorique.value()));

  protected readonly mesureConnue = computed(
    () => !this.ressourceArticle.isLoading() && !this.ressourceStock.isLoading(),
  );

  protected readonly introuvable = computed(() => this.ressourceArticle.error() !== undefined);

  protected readonly etat = computed<EtatTableau>(() => {
    if (this.ressourceHistorique.isLoading()) {
      return 'chargement';
    }
    if (this.ressourceHistorique.error() !== undefined) {
      return 'erreur';
    }
    return this.mouvements().length === 0 ? 'vide' : 'pret';
  });

  protected readonly operation = signal<OperationStock | null>(null);

  protected readonly titreOperation = computed(() => {
    const operation = this.operation();
    return operation === null ? '' : TITRES[operation];
  });

  protected ouvrir(operation: OperationStock): void {
    this.operation.set(operation);
  }

  protected fermer(): void {
    this.operation.set(null);
  }

  protected apresMouvement(mouvement: MouvementStock): void {
    this.notifications.succes(
      'Mouvement enregistré',
      `${libelleType(mouvement.typeMvt)} de ${mouvement.quantite ?? 0}`,
    );
    this.operation.set(null);
    // Le stock réel est dérivé des mouvements côté serveur : il se redemande, il ne se
    // recalcule pas ici.
    this.ressourceStock.reload();
    this.ressourceHistorique.reload();
  }

  protected changerTaille(taille: number): void {
    this.taille.set(taille);
    this.page.set(0);
  }

  protected reessayer(): void {
    this.ressourceHistorique.reload();
  }
}
