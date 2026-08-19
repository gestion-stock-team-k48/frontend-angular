import type { Routes } from '@angular/router';

export const routesMouvementsStock: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Mouvements de stock · Gestion de Stock',
    loadComponent: () =>
      import('./choix-article/choix-article').then((module) => module.ChoixArticle),
  },
  {
    path: 'alertes',
    title: 'Alertes de seuil · Gestion de Stock',
    loadComponent: () =>
      import('./alertes-stock/alertes-stock').then((module) => module.AlertesStock),
  },
  {
    path: 'article/:id',
    title: 'Stock de l’article · Gestion de Stock',
    loadComponent: () =>
      import('./stock-article/stock-article').then((module) => module.StockArticle),
  },
];
