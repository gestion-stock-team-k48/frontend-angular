import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeFr from '@angular/common/locales/fr';
import {
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  type ApplicationConfig,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAppConfig } from './core/config/app-config';
import { intercepteurAuthentification } from './core/auth/auth-interceptor';
import { intercepteurRafraichissement } from './core/auth/refresh-interceptor';
import { intercepteurErreurs } from './core/http/error-interceptor';
import { intercepteurChargement } from './core/http/loading';

registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
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
  ],
};
