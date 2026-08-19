import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeFr from '@angular/common/locales/fr';
import {
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  type ApplicationConfig,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { provideAppConfig } from './core/config/app-config';
import { ServiceAuthentification } from './core/auth/auth';
import { intercepteurAuthentification } from './core/auth/auth-interceptor';
import { intercepteurRafraichissement } from './core/auth/refresh-interceptor';
import { intercepteurErreurs } from './core/http/error-interceptor';
import { intercepteurChargement } from './core/http/loading';

registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Transition native entre écrans. Le navigateur qui ne la connaît pas navigue
      // normalement : rien à prévoir de plus.
      withViewTransitions(),
      // Un changement d'écran repart du haut ; un retour arrière retrouve sa position.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    provideAppConfig(),
    { provide: LOCALE_ID, useValue: 'fr' },
    provideHttpClient(
      // L'ordre compte, et il s'inverse au retour : le premier de la liste traite la requête
      // en premier, mais voit la réponse — et l'erreur — en dernier.
      //
      //   requête  : chargement → erreurs → authentification → rafraîchissement → réseau
      //   erreur   : rafraîchissement (rejoue) → erreurs (traduit) → chargement (referme)
      //
      // Une erreur n'est donc traduite qu'après l'échec du rafraîchissement, et le compteur
      // de chargement ne retombe qu'une fois les tentatives épuisées.
      withInterceptors([
        intercepteurChargement,
        intercepteurErreurs,
        intercepteurAuthentification,
        intercepteurRafraichissement,
      ]),
    ),
    // Rejoué avant le premier affichage : le jeton d'accès n'a pas survécu au rechargement,
    // seul le jeton de rafraîchissement subsiste. Sans cette étape, les gardes trancheraient
    // sur une session qu'elles croiraient fermée et renverraient vers la connexion un
    // utilisateur qui ne l'a jamais quittée. L'échec est absorbé par le service : on démarre
    // alors déconnecté, sans bloquer l'application.
    provideAppInitializer(() => inject(ServiceAuthentification).restaurerSession()),
  ],
};
