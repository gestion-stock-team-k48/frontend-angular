import type { Routes } from '@angular/router';

export const routesClients: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Clients · Gestion de Stock',
    loadComponent: () =>
      import('./liste-clients/liste-clients').then((module) => module.ListeClients),
  },
  {
    path: 'nouveau',
    title: 'Nouveau client · Gestion de Stock',
    loadComponent: () =>
      import('./formulaire-client/formulaire-client').then((module) => module.FormulaireClient),
  },
  {
    path: ':id',
    title: 'Client · Gestion de Stock',
    loadComponent: () =>
      import('./formulaire-client/formulaire-client').then((module) => module.FormulaireClient),
  },
];
