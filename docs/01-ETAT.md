# État courant

- Dernière mise à jour : 2026-08-19 — session 1
- Phase en cours : 1 · Noyau — terminée, en attente de validation
- Branche de travail : feat/core-noyau
- Dernier commit : e6bcae9 — feat(core): wire interceptors, configuration and the fr locale
- Backend requis démarré : oui — `http://localhost:8080/api/v1`
- Prochaine action précise : valider la phase 1, puis ouvrir la phase 2 (thème OKLCH et ThemeService).

## Fait dans cette phase

- Types API générés depuis `openapi.json` : 41 chemins, 66 opérations, 47 schémas.
  `core/api/api-types.ts` ne fait que leur donner des noms courts.
- Configuration par tokens d'injection : `API_BASE_URL`, `APP_LOCALE`, `DEVISE`.
  Aucune URL en dur ; chemin relatif `/api/v1` en développement comme en production.
- Contrat d'erreur déclaré à la main (ADR-004) plus la traduction en messages utilisateur.
- Quatre intercepteurs : chargement, erreurs, authentification, rafraîchissement, avec
  l'ordre d'inversion documenté dans `04-ARCHITECTURE.md`.
- `ServiceAuthentification` : jeton d'accès en signal mémoire, jeton de rafraîchissement en
  `localStorage`, rafraîchissement single-flight, restauration de session au démarrage.
- Gardes fonctionnelles `gardeAuthentification`, `gardeRole`, `gardeInvite`.
- File de notifications en `core`, alimentée par l'intercepteur d'erreurs. Son rendu visuel
  arrive avec le design system en phase 3.
- 25 tests, dont le single-flight, le rejeu après rafraîchissement et l'absence de boucle.

## Reste à faire dans cette phase

- Rien. En attente de validation.

## Points bloquants / en attente de ma validation

1. **Validation de la phase 1** avant d'ouvrir la phase 2.
2. **Route `/connexion` et `/acces-refuse`** référencées par les gardes et l'intercepteur de
   rafraîchissement : elles n'existent pas encore, elles arrivent en phase 4 (shell, page 403) et phase 5 (authentification). Sans elles, une redirection échouerait silencieusement.

## Écarts backend signalés, sans contournement

- Aucun schéma d'erreur publié dans `openapi.json` (ADR-004).
- `POST /auth/refresh-token` ne déclare ni corps ni paramètre alors qu'il lit
  `Authorization: Bearer <refreshToken>`.
- Une requête sans jeton renvoie `403`, pas `401` (ADR-005).

Détail dans `06-API-CONTRAT.md`, section « Écarts constatés ».
