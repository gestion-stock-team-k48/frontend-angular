import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EtatVide } from '../../../shared/ui/etat-vide/etat-vide';
import { MontantPipe } from '../../../shared/pipes/montant';
import { ApiVentes } from '../vente-api';
import { totalVente } from '../total-vente';
import type { Vente } from '../../../core/api/api-types';

/**
 * Fiche d'une vente.
 *
 * En lecture seule, faute d'endpoint de modification, et sans bouton de suppression : le
 * serveur la refuse dans tous les cas. Proposer un bouton qui échoue à coup sûr serait une
 * promesse en l'air.
 */
@Component({
  selector: 'app-detail-vente',
  templateUrl: './detail-vente.html',
  styleUrl: './detail-vente.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, EtatVide, MontantPipe],
})
export class DetailVente {
  private readonly api = inject(ApiVentes);
  private readonly route = inject(ActivatedRoute);

  private readonly identifiant = signal<number>(
    Number.parseInt(this.route.snapshot.paramMap.get('id') ?? '', 10) || 0,
  );

  private readonly ressource = httpResource<Vente>(() => `${this.api.url}/${this.identifiant()}`);

  protected readonly vente = this.ressource.value;

  protected readonly chargement = computed(() => this.ressource.isLoading());

  protected readonly introuvable = computed(() => this.ressource.error() !== undefined);

  protected readonly total = computed(() => totalVente(this.vente()));
}
