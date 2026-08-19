# État courant

- Dernière mise à jour : 2026-08-19 — session 1
- Phase en cours : 2 · Thème
- Branche de travail : feat/theme-tokens
- Dernier commit : phase 2 en cours — voir git log
- Backend requis démarré : oui — `http://localhost:8080/api/v1`
- Prochaine action précise : télécharger et déclarer les polices auto-hébergées, puis écrire la génération de rampe OKLCH.

## Fait dans cette phase

- Phase 1 validée, fusionnée dans `main`, taguée `v0.2.0`.
- Mécanisme de reprise : `etat.sh` affiche la marche à suivre, le pense-bête local
  renvoie vers la ligne « Prochaine action précise ».

## Reste à faire dans cette phase

- Polices Space Grotesk, IBM Plex Sans, IBM Plex Mono auto-hébergées dans `public/fonts/`.
- Génération de rampe OKLCH depuis l'amorce, avec calcul de contraste.
- Tokens primitifs, sémantiques, système et de mouvement.
- `ThemeService` : mode, amorce, densité, rayon ; persistance et `prefers-color-scheme`.
- `prefers-reduced-motion`, `color-scheme`, `<meta name="theme-color">`.

## Points bloquants / en attente de ma validation

1. **Visibilité du dépôt** — le passage en public a été refusé : le compte est
   Maintainer (40) sur le groupe, or GitLab réserve ce changement au rôle Owner (50).
   À faire par un Owner, ou via `Settings → General → Visibility`.
2. **Route `/connexion` et `/acces-refuse`** référencées par les gardes et l'intercepteur de
   rafraîchissement : elles n'existent pas encore, elles arrivent en phase 4 (shell, page 403) et phase 5 (authentification). Sans elles, une redirection échouerait silencieusement.

## Écarts backend signalés, sans contournement

- Aucun schéma d'erreur publié dans `openapi.json` (ADR-004).
- `POST /auth/refresh-token` ne déclare ni corps ni paramètre alors qu'il lit
  `Authorization: Bearer <refreshToken>`.
- Une requête sans jeton renvoie `403`, pas `401` (ADR-005).

Détail dans `06-API-CONTRAT.md`, section « Écarts constatés ».
