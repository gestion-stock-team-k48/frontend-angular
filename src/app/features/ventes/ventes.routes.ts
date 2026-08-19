import type { Routes } from '@angular/router';

export const routesVentes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Ventes · Gestion de Stock',
    loadComponent: () => import('./liste-ventes/liste-ventes').then((module) => module.ListeVentes),
  },
  {
    path: 'nouvelle',
    title: 'Nouvelle vente · Gestion de Stock',
    loadComponent: () =>
      import('./nouvelle-vente/nouvelle-vente').then((module) => module.NouvelleVente),
  },
  {
    path: ':id',
    title: 'Vente · Gestion de Stock',
    loadComponent: () => import('./detail-vente/detail-vente').then((module) => module.DetailVente),
  },
];
