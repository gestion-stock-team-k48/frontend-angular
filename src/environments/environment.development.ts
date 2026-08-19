/**
 * Configuration de développement.
 * Le même chemin relatif est utilisé qu'en production : `proxy.conf.json` redirige `/api`
 * vers `http://localhost:8080`, ce qui évite tout problème de CORS avec `ng serve`.
 */
export const environment = {
  production: false,
  apiBaseUrl: '/api/v1',
} as const;
