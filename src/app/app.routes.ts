import type { Routes } from '@angular/router';
import { gardeAuthentification, gardeMotDePasse } from './core/auth/guards';
import { routesAuth } from './features/auth/auth.routes';

export const routes: Routes = [
  // Les écrans d'authentification passent avant le shell : ils sont les seuls à vivre hors
  // de la coquille applicative, et le shell attrape tout le reste par sa route générique.
  // Leurs définitions sont importées directement — ce ne sont que des objets de route, les
  // composants, eux, restent chargés à la demande.
  ...routesAuth,
  {
    path: '',
    canActivate: [gardeAuthentification],
    // Relue à chaque changement d'écran : la session peut se fermer, et un mot de passe
    // temporaire doit être remplacé avant d'atteindre quoi que ce soit d'autre.
    canActivateChild: [gardeAuthentification, gardeMotDePasse],
    loadComponent: () => import('./layout/shell/shell').then((module) => module.Shell),
    children: [
      {
        path: 'articles',
        loadChildren: () =>
          import('./features/articles/articles.routes').then((module) => module.routesArticles),
      },
      {
        path: 'categories',
        loadChildren: () =>
          import('./features/categories/categories.routes').then(
            (module) => module.routesCategories,
          ),
      },
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
