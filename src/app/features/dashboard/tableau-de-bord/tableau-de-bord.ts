import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_BASE_URL, DEVISE } from '../../../core/config/app-config';
import { Badge } from '../../../shared/ui/badge/badge';
import { Bouton } from '../../../shared/ui/bouton/bouton';
import { EtatVide } from '../../../shared/ui/etat-vide/etat-vide';
import { JaugeSeuil } from '../../../shared/ui/jauge-seuil/jauge-seuil';
import { Squelette } from '../../../shared/ui/squelette/squelette';
import { MontantPipe } from '../../../shared/pipes/montant';
import { QuantitePipe } from '../../../shared/pipes/quantite';
import { GraphiqueBarres } from '../../../shared/dataviz/graphique-barres';
import { GraphiqueTemporel } from '../../../shared/dataviz/graphique-temporel';
import { Repartition } from '../../../shared/dataviz/repartition';
import {
  cleMois,
  douzeDerniersMois,
  type PartRepartition,
  type PointSerie,
} from '../../../shared/dataviz/serie';
import { nombreAnime } from '../../../shared/animations/nombre-anime';
import { parametresDePage, type ReponsePage } from '../../../core/api/pagination';
import type {
  AlerteStock,
  CommandeClient,
  StatistiquesTableauDeBord,
  Vente,
} from '../../../core/api/api-types';

/** Nombre d'alertes détaillées ; au-delà, un compte renvoie à l'écran des alertes. */
const ALERTES_EN_APERCU = 6;

/**
 * Profondeur d'historique lue pour les courbes.
 *
 * Le backend ne publie aucune série temporelle : les tendances sont agrégées ici, à partir
 * des dernières ventes et des dernières commandes. La page lue est large mais bornée — c'est
 * le compromis honnête tant qu'aucun endpoint ne rend un chiffre d'affaires par mois.
 */
const PROFONDEUR = 200;

const ETATS: readonly { etat: string; libelle: string; ton: PartRepartition['ton'] }[] = [
  { etat: 'EN_PREPARATION', libelle: 'En préparation', ton: 'neutre' },
  { etat: 'VALIDEE', libelle: 'Validées', ton: 'information' },
  { etat: 'LIVREE', libelle: 'Livrées', ton: 'succes' },
  { etat: 'ANNULEE', libelle: 'Annulées', ton: 'danger' },
];

/**
 * Tableau de bord.
 *
 * Il répond dans l'ordre aux trois questions du matin : combien j'ai encaissé, où en sont
 * mes commandes, et qu'est-ce qui manque en rayon. Les chiffres viennent du serveur ; les
 * tendances sont agrégées ici faute d'endpoint qui les rende, et l'écran le dit.
 */
@Component({
  selector: 'app-tableau-de-bord',
  templateUrl: './tableau-de-bord.html',
  styleUrl: './tableau-de-bord.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Badge,
    Bouton,
    EtatVide,
    JaugeSeuil,
    Squelette,
    MontantPipe,
    QuantitePipe,
    GraphiqueBarres,
    GraphiqueTemporel,
    Repartition,
  ],
})
export class TableauDeBord {
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly devise = inject(DEVISE);

  private readonly ressourceStats = httpResource<StatistiquesTableauDeBord>(
    () => `${this.baseUrl}/dashboard/statistiques`,
    { defaultValue: {} },
  );

  private readonly ressourceAlertes = httpResource<AlerteStock[]>(
    () => `${this.baseUrl}/mouvements-stock/alertes-stock`,
    { defaultValue: [] },
  );

  private readonly ressourceVentes = httpResource<ReponsePage<Vente>>(() => ({
    url: `${this.baseUrl}/ventes`,
    params: parametresDePage({
      page: 0,
      taille: PROFONDEUR,
      tri: { champ: 'dateVente', sens: 'desc' },
    }),
  }));

  private readonly ressourceCommandes = httpResource<ReponsePage<CommandeClient>>(() => ({
    url: `${this.baseUrl}/commandes-client`,
    params: parametresDePage({
      page: 0,
      taille: PROFONDEUR,
      tri: { champ: 'dateCommande', sens: 'desc' },
    }),
  }));

  protected readonly stats = this.ressourceStats.value;

  protected readonly chargement = computed(() => this.ressourceStats.isLoading());

  protected readonly indisponible = computed(() => this.ressourceStats.error() !== undefined);

  protected readonly alertes = computed(() => this.ressourceAlertes.value());

  protected readonly alertesEnApercu = computed(() => this.alertes().slice(0, ALERTES_EN_APERCU));

  protected readonly alertesRestantes = computed(() =>
    Math.max(0, this.alertes().length - ALERTES_EN_APERCU),
  );

  protected readonly alertesChargent = computed(() => this.ressourceAlertes.isLoading());

  protected readonly ruptures = computed(
    () => this.alertes().filter((alerte) => (alerte.quantiteStock ?? 0) <= 0).length,
  );

  // Les mesures courent vers leur valeur : c'est le seul endroit de l'application où un
  // chiffre s'anime, et c'est celui qu'on vient regarder en ouvrant le matin.
  protected readonly caMois = nombreAnime(() => this.stats().chiffreAffairesMoisCourant ?? 0);
  protected readonly caTotal = nombreAnime(() => this.stats().chiffreAffairesTotal ?? 0);
  protected readonly clientEnCours = nombreAnime(() => this.stats().commandesClientEnCours ?? 0);
  protected readonly fournisseurEnCours = nombreAnime(
    () => this.stats().commandesFournisseurEnCours ?? 0,
  );
  protected readonly sousSeuil = nombreAnime(() => this.alertes().length);

  /** Chiffre d'affaires mensuel, sur la même définition que le serveur : les ventes. */
  protected readonly caParMois = computed<readonly PointSerie[]>(() => {
    const total = new Map<string, number>();

    for (const vente of this.ressourceVentes.value()?.content ?? []) {
      const mois = cleMois(vente.dateVente);
      if (mois === null) {
        continue;
      }
      const montant = (vente.lignes ?? []).reduce(
        (somme, ligne) => somme + (ligne.prixUnitaire ?? 0) * (ligne.quantite ?? 0),
        0,
      );
      total.set(mois, (total.get(mois) ?? 0) + montant);
    }

    return douzeDerniersMois().map((mois) => ({
      libelle: mois.libelle,
      detail: mois.cle,
      valeur: Math.round(total.get(mois.cle) ?? 0),
    }));
  });

  /** Commandes client livrées par mois : le rythme de sortie, indépendant des montants. */
  protected readonly livraisonsParMois = computed<readonly PointSerie[]>(() => {
    const total = new Map<string, number>();

    for (const commande of this.commandes()) {
      if (commande.etatCommande !== 'LIVREE') {
        continue;
      }
      const mois = cleMois(commande.dateCommande);
      if (mois === null) {
        continue;
      }
      total.set(mois, (total.get(mois) ?? 0) + 1);
    }

    return douzeDerniersMois().map((mois) => ({
      libelle: mois.libelle,
      detail: mois.cle,
      valeur: total.get(mois.cle) ?? 0,
    }));
  });

  protected readonly repartitionCommandes = computed<readonly PartRepartition[]>(() => {
    const commandes = this.commandes();
    return ETATS.map((etat) => ({
      libelle: etat.libelle,
      ton: etat.ton,
      valeur: commandes.filter((commande) => commande.etatCommande === etat.etat).length,
    }));
  });

  protected readonly topArticles = computed<readonly PointSerie[]>(() =>
    (this.stats().topArticlesVendus ?? []).map((article) => ({
      libelle: article.designation ?? '—',
      valeur: article.quantiteVendue ?? 0,
    })),
  );

  protected readonly profondeur = PROFONDEUR;

  protected readonly commandesLues = computed(() => this.commandes().length);

  /** Formats passés aux graphiques : eux ne connaissent ni devise ni locale. */
  protected readonly formatMontant = (valeur: number): string =>
    `${new Intl.NumberFormat('fr', {
      notation: valeur >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: valeur >= 1000000 ? 1 : this.devise.decimales,
    }).format(valeur)} ${this.devise.symbole}`;

  protected readonly formatEntier = (valeur: number): string =>
    new Intl.NumberFormat('fr', { maximumFractionDigits: 0 }).format(valeur);

  protected reessayer(): void {
    this.ressourceStats.reload();
    this.ressourceAlertes.reload();
    this.ressourceVentes.reload();
    this.ressourceCommandes.reload();
  }

  private readonly commandes = computed(() => this.ressourceCommandes.value()?.content ?? []);
}
