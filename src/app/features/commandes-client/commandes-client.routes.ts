import type { Routes } from '@angular/router';

export const routesCommandesClient: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Commandes client · Gestion de Stock',
    loadComponent: () =>
      import('./liste/liste-commandes-client').then((module) => module.ListeCommandesClient),
  },
  {
    path: 'nouvelle',
    title: 'Nouvelle commande client · Gestion de Stock',
    loadComponent: () =>
      import('./ecran/ecran-commande-client').then((module) => module.EcranCommandeClient),
  },
  {
    path: ':id',
    title: 'Commande client · Gestion de Stock',
    loadComponent: () =>
      import('./ecran/ecran-commande-client').then((module) => module.EcranCommandeClient),
  },
];
