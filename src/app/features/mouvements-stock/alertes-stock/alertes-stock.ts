import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EtatVide } from '../../../shared/ui/etat-vide/etat-vide';
import { JaugeSeuil } from '../../../shared/ui/jauge-seuil/jauge-seuil';
import { Tableau, type ColonneTableau, type EtatTableau } from '../../../shared/ui/tableau/tableau';
import { QuantitePipe } from '../../../shared/pipes/quantite';
import { ApiMouvementsStock } from '../mouvement-api';
import type { AlerteStock } from '../../../core/api/api-types';

const COLONNES: readonly ColonneTableau[] = [
  { cle: 'code', libelle: 'Code' },
  { cle: 'designation', libelle: 'Désignation' },
  { cle: 'jauge', libelle: 'Stock' },
  { cle: 'quantiteStock', libelle: 'En stock', alignement: 'fin' },
  { cle: 'seuilMinimum', libelle: 'Seuil', alignement: 'fin' },
];

/**
 * Articles dont le stock a atteint ou dépassé le seuil, par le bas.
 *
 * Le backend renvoie la liste complète, sans pagination : il calcule le stock réel de chaque
 * article du catalogue pour la construire. L'écran l'affiche telle quelle et trie du plus
 * critique au moins critique — ce qui est en rupture passe devant.
 */
@Component({
  selector: 'app-alertes-stock',
  templateUrl: './alertes-stock.html',
  styleUrl: './alertes-stock.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EtatVide, JaugeSeuil, Tableau, QuantitePipe],
})
export class AlertesStock {
  private readonly api = inject(ApiMouvementsStock);

  protected readonly colonnes = COLONNES;

  private readonly ressource = httpResource<AlerteStock[]>(() => this.api.urlAlertes, {
    defaultValue: [],
  });

  /** Le plus urgent d'abord : l'écart au seuil, en valeur relative, classe les lignes. */
  protected readonly alertes = computed(() =>
    [...this.ressource.value()].sort((gauche, droite) => manque(droite) - manque(gauche)),
  );

  protected readonly etat = computed<EtatTableau>(() => {
    if (this.ressource.isLoading()) {
      return 'chargement';
    }
    if (this.ressource.error() !== undefined) {
      return 'erreur';
    }
    return this.alertes().length === 0 ? 'vide' : 'pret';
  });

  protected reessayer(): void {
    this.ressource.reload();
  }
}

/** Ce qui manque pour repasser au-dessus du seuil, ramené au seuil lui-même. */
function manque(alerte: AlerteStock): number {
  const seuil = alerte.seuilMinimum ?? 0;
  const stock = alerte.quantiteStock ?? 0;
  if (seuil <= 0) {
    return stock <= 0 ? 1 : 0;
  }
  return (seuil - stock) / seuil;
}
