import type { Routes } from '@angular/router';
import { gardeRole } from '../../core/auth/guards';
import { ROLE_ADMIN } from '../../core/api/api-types';

export const routesEntreprise: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Entreprise · Gestion de Stock',
    canActivate: [gardeRole(ROLE_ADMIN)],
    loadComponent: () =>
      import('./ecran-entreprise/ecran-entreprise').then((module) => module.EcranEntreprise),
  },
];
