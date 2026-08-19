import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { ListeTiers } from '../../../shared/tiers/liste-tiers';
import { ApiClients } from '../client-api';

/** Liste des clients. Tout ce qui ne distingue pas un client d'un fournisseur vit dans `shared/tiers`. */
@Component({
  selector: 'app-liste-clients',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListeTiers],
  template: `<app-liste-tiers
    titre="Clients"
    sousTitre="Les clients de l'entreprise. Une commande client est toujours rattachée à l'un d'eux."
    singulier="client"
    cheminBase="/clients"
    [url]="api.url"
    [supprimer]="supprimer"
  />`,
})
export class ListeClients {
  protected readonly api = inject(ApiClients);

  /** Passée à l'écran partagé : il déclenche la suppression, il n'en connaît pas l'URL. */
  protected readonly supprimer = (id: number): Observable<void> => this.api.supprimer(id);
}
