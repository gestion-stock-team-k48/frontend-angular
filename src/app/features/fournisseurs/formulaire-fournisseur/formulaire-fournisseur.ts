import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { Observable } from 'rxjs';
import { ServiceNotifications } from '../../../core/notifications/notifications';
import { EtatVide } from '../../../shared/ui/etat-vide/etat-vide';
import { FormulaireTiers } from '../../../shared/tiers/formulaire-tiers';
import type { DemandeTiers } from '../../../shared/tiers/champs-tiers';
import { ApiFournisseurs } from '../fournisseur-api';
import type { Fournisseur } from '../../../core/api/api-types';

/** Création et modification d'un fournisseur. */
@Component({
  selector: 'app-formulaire-fournisseur',
  templateUrl: './formulaire-fournisseur.html',
  styleUrl: '../../../shared/tiers/ecran-tiers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EtatVide, FormulaireTiers],
})
export class FormulaireFournisseur {
  private readonly api = inject(ApiFournisseurs);
  private readonly notifications = inject(ServiceNotifications);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly identifiant = signal<number | null>(
    Number.parseInt(this.route.snapshot.paramMap.get('id') ?? '', 10) || null,
  );

  private readonly ressource = httpResource<Fournisseur>(() => {
    const id = this.identifiant();
    return id === null ? undefined : `${this.api.url}/${id}`;
  });

  protected readonly fournisseur = this.ressource.value;

  protected readonly modification = computed(() => this.identifiant() !== null);

  protected readonly introuvable = computed(() => this.ressource.error() !== undefined);

  protected readonly enregistrer = (demande: DemandeTiers): Observable<Fournisseur> => {
    const id = this.identifiant();
    return id === null ? this.api.creer(demande) : this.api.modifier(id, demande);
  };

  protected readonly envoyerPhoto = computed(() => {
    const id = this.identifiant();
    if (id === null) {
      return null;
    }
    return (fichier: File): Observable<Fournisseur> => this.api.envoyerPhoto(id, fichier);
  });

  protected async apresEnregistrement(): Promise<void> {
    this.notifications.succes(this.modification() ? 'Fournisseur modifié' : 'Fournisseur créé');
    await this.router.navigate(['/fournisseurs']);
  }

  protected async annuler(): Promise<void> {
    await this.router.navigate(['/fournisseurs']);
  }

  protected apresPhoto(): void {
    this.notifications.succes('Photo enregistrée');
    this.ressource.reload();
  }
}
