import type { Routes } from '@angular/router';

export const routesCommandesFournisseur: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Commandes fournisseur · Gestion de Stock',
    loadComponent: () =>
      import('./liste/liste-commandes-fournisseur').then(
        (module) => module.ListeCommandesFournisseur,
      ),
  },
  {
    path: 'nouvelle',
    title: 'Nouvelle commande fournisseur · Gestion de Stock',
    loadComponent: () =>
      import('./ecran/ecran-commande-fournisseur').then(
        (module) => module.EcranCommandeFournisseur,
      ),
  },
  {
    path: ':id',
    title: 'Commande fournisseur · Gestion de Stock',
    loadComponent: () =>
      import('./ecran/ecran-commande-fournisseur').then(
        (module) => module.EcranCommandeFournisseur,
      ),
  },
];
