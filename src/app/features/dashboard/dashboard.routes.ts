import type { Routes } from '@angular/router';

export const routesTableauDeBord: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Tableau de bord · Gestion de Stock',
    loadComponent: () =>
      import('./tableau-de-bord/tableau-de-bord').then((module) => module.TableauDeBord),
  },
];
