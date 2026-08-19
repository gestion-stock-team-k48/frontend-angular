import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'parametres',
    loadChildren: () =>
      import('./features/parametres/parametres.routes').then((module) => module.routesParametres),
  },
  {
    // Le shell applicatif et sa page d'accueil arrivent en phase 4. En attendant,
    // la racine mène à l'écran qui existe.
    path: '',
    pathMatch: 'full',
    redirectTo: 'parametres/apparence',
  },
];
