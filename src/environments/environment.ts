/**
 * Configuration de production.
 * `apiBaseUrl` est un chemin relatif : en production l'application et l'API sont servies
 * derrière le même hôte. Aucune URL absolue n'apparaît dans le code.
 */
export const environment = {
  production: true,
  apiBaseUrl: '/api/v1',
} as const;
