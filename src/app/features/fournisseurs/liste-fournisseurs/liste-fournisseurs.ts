import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { ListeTiers } from '../../../shared/tiers/liste-tiers';
import { ApiFournisseurs } from '../fournisseur-api';

/** Liste des fournisseurs. Tout ce qui ne distingue pas un fournisseur d'un client vit dans `shared/tiers`. */
@Component({
  selector: 'app-liste-fournisseurs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListeTiers],
  template: `<app-liste-tiers
    titre="Fournisseurs"
    sousTitre="Les fournisseurs de l'entreprise. Une commande fournisseur est toujours rattachée à l'un d'eux."
    singulier="fournisseur"
    cheminBase="/fournisseurs"
    [url]="api.url"
    [supprimer]="supprimer"
  />`,
})
export class ListeFournisseurs {
  protected readonly api = inject(ApiFournisseurs);

  /** Passée à l'écran partagé : il déclenche la suppression, il n'en connaît pas l'URL. */
  protected readonly supprimer = (id: number): Observable<void> => this.api.supprimer(id);
}
