import type { Routes } from '@angular/router';
import { gardeAuthentification, gardeInvite } from '../../core/auth/guards';

/**
 * Routes d'authentification.
 *
 * Elles sont montées à la racine, hors du shell applicatif : ces écrans n'ont ni navigation
 * ni fil d'Ariane. Le parent porte la coquille commune ; comme aucun de ses enfants n'a de
 * chemin vide, l'URL `/` ne l'atteint jamais et poursuit vers le shell.
 *
 * `/changer-mot-de-passe` vit ici, sous une garde différente : l'écran s'adresse à un
 * utilisateur déjà connecté, mais qui n'a pas encore le droit d'entrer dans l'application.
 */
export const routesAuth: Routes = [
  {
    path: '',
    loadComponent: () => import('./coquille-auth').then((module) => module.CoquilleAuth),
    children: [
      {
        path: 'connexion',
        title: 'Connexion · Gestion de Stock',
        canActivate: [gardeInvite],
        loadComponent: () => import('./connexion/connexion').then((module) => module.Connexion),
      },
      {
        path: 'inscription',
        title: 'Inscrire une entreprise · Gestion de Stock',
        canActivate: [gardeInvite],
        loadComponent: () =>
          import('./inscription/inscription').then((module) => module.Inscription),
      },
      {
        path: 'mot-de-passe-oublie',
        title: 'Mot de passe oublié · Gestion de Stock',
        canActivate: [gardeInvite],
        loadComponent: () =>
          import('./mot-de-passe-oublie/mot-de-passe-oublie').then(
            (module) => module.MotDePasseOublie,
          ),
      },
      {
        path: 'reinitialisation',
        title: 'Nouveau mot de passe · Gestion de Stock',
        canActivate: [gardeInvite],
        loadComponent: () =>
          import('./reinitialisation/reinitialisation').then((module) => module.Reinitialisation),
      },
      {
        path: 'changer-mot-de-passe',
        title: 'Changer le mot de passe · Gestion de Stock',
        canActivate: [gardeAuthentification],
        loadComponent: () =>
          import('./changer-mot-de-passe/changer-mot-de-passe').then(
            (module) => module.ChangerMotDePasse,
          ),
      },
    ],
  },
];
