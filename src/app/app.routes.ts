import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((module) => module.Shell),
    children: [
      {
        path: 'parametres',
        loadChildren: () =>
          import('./features/parametres/parametres.routes').then(
            (module) => module.routesParametres,
          ),
      },
      {
        path: 'acces-refuse',
        title: 'Accès refusé · Gestion de Stock',
        loadComponent: () =>
          import('./features/erreurs/acces-refuse').then((module) => module.AccesRefuse),
      },
      {
        // Le tableau de bord prendra la racine en phase 11. En attendant, la racine mène
        // au seul écran qui existe.
        path: '',
        pathMatch: 'full',
        redirectTo: 'parametres/apparence',
      },
      {
        path: '**',
        title: 'Page introuvable · Gestion de Stock',
        loadComponent: () =>
          import('./features/erreurs/page-introuvable').then((module) => module.PageIntrouvable),
      },
    ],
  },
];
