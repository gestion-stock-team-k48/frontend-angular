import type { Routes } from '@angular/router';

export const routesFournisseurs: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Fournisseurs · Gestion de Stock',
    loadComponent: () =>
      import('./liste-fournisseurs/liste-fournisseurs').then((module) => module.ListeFournisseurs),
  },
  {
    path: 'nouveau',
    title: 'Nouveau fournisseur · Gestion de Stock',
    loadComponent: () =>
      import('./formulaire-fournisseur/formulaire-fournisseur').then(
        (module) => module.FormulaireFournisseur,
      ),
  },
  {
    path: ':id',
    title: 'Fournisseur · Gestion de Stock',
    loadComponent: () =>
      import('./formulaire-fournisseur/formulaire-fournisseur').then(
        (module) => module.FormulaireFournisseur,
      ),
  },
];
