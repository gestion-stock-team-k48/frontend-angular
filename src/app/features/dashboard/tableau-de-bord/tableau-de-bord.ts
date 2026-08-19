import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_BASE_URL } from '../../../core/config/app-config';
import { Bouton } from '../../../shared/ui/bouton/bouton';
import { EtatVide } from '../../../shared/ui/etat-vide/etat-vide';
import { JaugeSeuil } from '../../../shared/ui/jauge-seuil/jauge-seuil';
import { Squelette } from '../../../shared/ui/squelette/squelette';
import { MontantPipe } from '../../../shared/pipes/montant';
import { nombreAnime } from '../../../shared/animations/nombre-anime';
import { QuantitePipe } from '../../../shared/pipes/quantite';
import type { AlerteStock, StatistiquesTableauDeBord } from '../../../core/api/api-types';

/** Nombre d'alertes détaillées sur le tableau de bord ; le reste se lit sur son écran. */
const ALERTES_EN_APERCU = 5;

/**
 * Tableau de bord.
 *
 * Il rassemble ce que le backend calcule lui-même — `GET /dashboard/statistiques` — et les
 * alertes de seuil, qui sont la seule information à laquelle il faut réagir le jour même.
 * Rien n'y est recalculé côté navigateur : les chiffres sont ceux du serveur.
 */
@Component({
  selector: 'app-tableau-de-bord',
  templateUrl: './tableau-de-bord.html',
  styleUrl: './tableau-de-bord.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Bouton, EtatVide, JaugeSeuil, Squelette, MontantPipe, QuantitePipe],
})
export class TableauDeBord {
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly ressourceStats = httpResource<StatistiquesTableauDeBord>(
    () => `${this.baseUrl}/dashboard/statistiques`,
    { defaultValue: {} },
  );

  private readonly ressourceAlertes = httpResource<AlerteStock[]>(
    () => `${this.baseUrl}/mouvements-stock/alertes-stock`,
    { defaultValue: [] },
  );

  protected readonly stats = this.ressourceStats.value;

  protected readonly chargement = computed(() => this.ressourceStats.isLoading());

  protected readonly indisponible = computed(() => this.ressourceStats.error() !== undefined);

  protected readonly alertes = computed(() => this.ressourceAlertes.value());

  protected readonly alertesEnApercu = computed(() => this.alertes().slice(0, ALERTES_EN_APERCU));

  protected readonly alertesRestantes = computed(() =>
    Math.max(0, this.alertes().length - ALERTES_EN_APERCU),
  );

  protected readonly alertesChargent = computed(() => this.ressourceAlertes.isLoading());

  // Les quatre mesures courent vers leur valeur : c'est le seul endroit de l'application où
  // un chiffre s'anime, et c'est celui qu'on vient regarder en ouvrant le matin.
  protected readonly caMois = nombreAnime(() => this.stats().chiffreAffairesMoisCourant ?? 0);
  protected readonly caTotal = nombreAnime(() => this.stats().chiffreAffairesTotal ?? 0);
  protected readonly clientEnCours = nombreAnime(() => this.stats().commandesClientEnCours ?? 0);
  protected readonly fournisseurEnCours = nombreAnime(
    () => this.stats().commandesFournisseurEnCours ?? 0,
  );

  protected readonly topArticles = computed(() => this.stats().topArticlesVendus ?? []);

  /** Quantité du meilleur article : elle donne l'échelle des barres du classement. */
  private readonly meilleureQuantite = computed(() =>
    this.topArticles().reduce(
      (maximum, article) => Math.max(maximum, article.quantiteVendue ?? 0),
      0,
    ),
  );

  protected proportion(quantite: number | undefined): number {
    const maximum = this.meilleureQuantite();
    if (maximum <= 0) {
      return 0;
    }
    return Math.round(((quantite ?? 0) / maximum) * 100);
  }

  protected reessayer(): void {
    this.ressourceStats.reload();
    this.ressourceAlertes.reload();
  }
}
