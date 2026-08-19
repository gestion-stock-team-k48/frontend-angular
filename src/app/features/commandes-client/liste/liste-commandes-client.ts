import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { ListeCommandes } from '../../../shared/commerce/liste-commandes';
import { ApiCommandesClient } from '../commande-client-api';
import { versVue } from '../adaptateur';
import type { CommandeClient } from '../../../core/api/api-types';

/** Liste des commandes client. */
@Component({
  selector: 'app-liste-commandes-client',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListeCommandes],
  template: `<app-liste-commandes
    titre="Commandes client"
    sousTitre="Les commandes passées par les clients. Une commande livrée sort du stock."
    libelleTiers="Client"
    cheminBase="/commandes-client"
    [url]="api.url"
    [versVue]="versVue"
    [supprimer]="supprimer"
  />`,
})
export class ListeCommandesClient {
  protected readonly api = inject(ApiCommandesClient);

  protected readonly versVue = (reponse: CommandeClient) => versVue(reponse);

  protected readonly supprimer = (id: number): Observable<void> => this.api.supprimer(id);
}
