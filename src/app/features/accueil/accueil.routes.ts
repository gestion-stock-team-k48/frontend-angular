import type { Routes } from '@angular/router';
import { gardeAccueil } from '../../core/auth/guards';

export const routesAccueil: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Gestion de Stock — le stock, sans tableur',
    canActivate: [gardeAccueil],
    loadComponent: () => import('./vitrine/vitrine').then((module) => module.Vitrine),
  },
];
