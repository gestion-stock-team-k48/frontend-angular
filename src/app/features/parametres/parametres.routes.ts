import type { Routes } from '@angular/router';

export const routesParametres: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'apparence',
  },
  {
    path: 'apparence',
    title: 'Apparence · Gestion de Stock',
    loadComponent: () => import('./apparence/apparence').then((module) => module.Apparence),
  },
];
