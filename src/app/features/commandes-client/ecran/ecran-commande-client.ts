import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { Observable } from 'rxjs';
import { ServiceNotifications } from '../../../core/notifications/notifications';
import { EcranCommande } from '../../../shared/commerce/ecran-commande';
import type { SaisieCommande } from '../../../shared/commerce/commande';
import { ApiCommandesClient } from '../commande-client-api';
import { versDemande, versVue } from '../adaptateur';
import type { CommandeClient, EtatCommande } from '../../../core/api/api-types';

/** Création, modification et lecture d'une commande client. */
@Component({
  selector: 'app-ecran-commande-client',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EcranCommande],
  template: `<app-ecran-commande
    libelleTiers="Client"
    champTiers="idClient"
    cheminBase="/commandes-client"
    [urlTiers]="api.urlClients"
    [urlArticles]="api.urlArticles"
    [commande]="commande()"
    [chargement]="chargement()"
    [introuvable]="introuvable()"
    [enregistrer]="enregistrer"
    [changerEtat]="changerEtat()"
    (enregistree)="apresEnregistrement()"
    (etatChange)="ressource.reload()"
  />`,
})
export class EcranCommandeClient {
  protected readonly api = inject(ApiCommandesClient);
  private readonly notifications = inject(ServiceNotifications);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly identifiant = signal<number | null>(
    Number.parseInt(this.route.snapshot.paramMap.get('id') ?? '', 10) || null,
  );

  protected readonly ressource = httpResource<CommandeClient>(() => {
    const id = this.identifiant();
    return id === null ? undefined : `${this.api.url}/${id}`;
  });

  protected readonly commande = computed(() => {
    const reponse = this.ressource.value();
    return reponse === undefined ? null : versVue(reponse);
  });

  protected readonly chargement = computed(() => this.ressource.isLoading());

  protected readonly introuvable = computed(() => this.ressource.error() !== undefined);

  protected readonly enregistrer = (saisie: SaisieCommande): Observable<CommandeClient> => {
    const id = this.identifiant();
    const demande = versDemande(saisie);
    return id === null ? this.api.creer(demande) : this.api.modifier(id, demande);
  };

  protected readonly changerEtat = computed(() => {
    const id = this.identifiant();
    if (id === null) {
      return null;
    }
    return (etat: EtatCommande): Observable<CommandeClient> => this.api.changerEtat(id, etat);
  });

  protected async apresEnregistrement(): Promise<void> {
    const creation = this.identifiant() === null;
    this.notifications.succes(creation ? 'Commande créée' : 'Commande modifiée');

    if (creation) {
      await this.router.navigate(['/commandes-client']);
      return;
    }
    this.ressource.reload();
  }
}
