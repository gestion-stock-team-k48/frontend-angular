import type { Routes } from '@angular/router';

export const routesCategories: Routes = [
  {
    path: '',
    title: 'Catégories · Gestion de Stock',
    loadComponent: () =>
      import('./liste-categories/liste-categories').then((module) => module.ListeCategories),
  },
];
