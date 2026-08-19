import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { ListeCommandes } from '../../../shared/commerce/liste-commandes';
import { ApiCommandesFournisseur } from '../commande-fournisseur-api';
import { versVue } from '../adaptateur';
import type { CommandeFournisseur } from '../../../core/api/api-types';

/** Liste des commandes fournisseur. */
@Component({
  selector: 'app-liste-commandes-fournisseur',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ListeCommandes],
  template: `<app-liste-commandes
    titre="Commandes fournisseur"
    sousTitre="Les commandes passées aux fournisseurs. Une commande livrée entre en stock."
    libelleTiers="Fournisseur"
    cheminBase="/commandes-fournisseur"
    [url]="api.url"
    [versVue]="versVue"
    [supprimer]="supprimer"
  />`,
})
export class ListeCommandesFournisseur {
  protected readonly api = inject(ApiCommandesFournisseur);

  protected readonly versVue = (reponse: CommandeFournisseur) => versVue(reponse);

  protected readonly supprimer = (id: number): Observable<void> => this.api.supprimer(id);
}
