import type { Routes } from '@angular/router';
import { gardeRole } from '../../core/auth/guards';
import { ROLE_ADMIN } from '../../core/api/api-types';

export const routesUtilisateurs: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Utilisateurs · Gestion de Stock',
    canActivate: [gardeRole(ROLE_ADMIN)],
    loadComponent: () =>
      import('./liste-utilisateurs/liste-utilisateurs').then((module) => module.ListeUtilisateurs),
  },
  {
    path: 'nouveau',
    title: 'Nouvel utilisateur · Gestion de Stock',
    canActivate: [gardeRole(ROLE_ADMIN)],
    loadComponent: () =>
      import('./formulaire-utilisateur/formulaire-utilisateur').then(
        (module) => module.FormulaireUtilisateur,
      ),
  },
  {
    path: ':id',
    title: 'Utilisateur · Gestion de Stock',
    canActivate: [gardeRole(ROLE_ADMIN)],
    loadComponent: () =>
      import('./formulaire-utilisateur/formulaire-utilisateur').then(
        (module) => module.FormulaireUtilisateur,
      ),
  },
];

/** « Mon profil » n'est pas réservé aux administrateurs : chacun modifie le sien. */
export const routesProfil: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Mon profil · Gestion de Stock',
    loadComponent: () => import('./profil/profil').then((module) => module.Profil),
  },
];
