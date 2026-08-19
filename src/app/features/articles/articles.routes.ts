import type { Routes } from '@angular/router';

export const routesArticles: Routes = [
  {
    path: '',
    title: 'Articles · Gestion de Stock',
    loadComponent: () =>
      import('./liste-articles/liste-articles').then((module) => module.ListeArticles),
  },
  {
    path: 'nouveau',
    title: 'Nouvel article · Gestion de Stock',
    loadComponent: () =>
      import('./formulaire-article/formulaire-article').then((module) => module.FormulaireArticle),
  },
  {
    path: ':id',
    title: 'Article · Gestion de Stock',
    loadComponent: () =>
      import('./formulaire-article/formulaire-article').then((module) => module.FormulaireArticle),
  },
];
