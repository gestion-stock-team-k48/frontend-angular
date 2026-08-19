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
        path: 'tableau-de-bord',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then(
            (module) => module.routesTableauDeBord,
          ),
      },
      {
        path: 'commandes-client',
        loadChildren: () =>
          import('./features/commandes-client/commandes-client.routes').then(
            (module) => module.routesCommandesClient,
          ),
      },
      {
        path: 'commandes-fournisseur',
        loadChildren: () =>
          import('./features/commandes-fournisseur/commandes-fournisseur.routes').then(
            (module) => module.routesCommandesFournisseur,
          ),
      },
      {
        path: 'ventes',
        loadChildren: () =>
          import('./features/ventes/ventes.routes').then((module) => module.routesVentes),
      },
      {
        path: 'clients',
        loadChildren: () =>
          import('./features/clients/clients.routes').then((module) => module.routesClients),
      },
      {
        path: 'fournisseurs',
        loadChildren: () =>
          import('./features/fournisseurs/fournisseurs.routes').then(
            (module) => module.routesFournisseurs,
          ),
      },
      {
        path: 'mouvements-stock',
        loadChildren: () =>
          import('./features/mouvements-stock/mouvements-stock.routes').then(
            (module) => module.routesMouvementsStock,
          ),
      },
      {
        path: 'categories',
        loadChildren: () =>
          import('./features/categories/categories.routes').then(
            (module) => module.routesCategories,
          ),
      },
      {
        path: 'entreprise',
        loadChildren: () =>
          import('./features/entreprise/entreprise.routes').then(
            (module) => module.routesEntreprise,
          ),
      },
      {
        path: 'utilisateurs',
        loadChildren: () =>
          import('./features/utilisateurs/utilisateurs.routes').then(
            (module) => module.routesUtilisateurs,
          ),
      },
      {
        path: 'profil',
        loadChildren: () =>
          import('./features/utilisateurs/utilisateurs.routes').then(
            (module) => module.routesProfil,
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
        // La racine mène au tableau de bord : c'est de là qu'on décide quoi faire.
        path: '',
        pathMatch: 'full',
        redirectTo: 'tableau-de-bord',
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
