# Journal

Une entrée par session, datée, ajoutée en fin de fichier. Jamais de réécriture d'une entrée
passée.

---

## 2026-08-19 — session 1 — Phase 0 · Fondations

**Branche** : `chore/core-foundations` (depuis `develop`, depuis `main`)

**Contexte de départ.** Le backend était encore un squelette en début de session : douze
contrôleurs vides, aucun endpoint, `SecurityConfig` et `JwtAuthenticationFilter` sans corps.
Il a été implémenté en cours de session par l'équipe backend et est devenu interrogeable :
41 chemins, 66 opérations, 47 schémas. Le port 8080 était par ailleurs occupé par un projet
sans rapport, ce qui a d'abord donné un `401` trompeur.

**Fait.**

- Environnement : Node 24.14.1 refusé par Angular CLI 22 (`^22.22.3 || ^24.15.0 || >=26`).
  Installation de 24.19.0 via nvm, épinglée dans `.nvmrc` (ADR-001).
- Espace de travail Angular 22.1.4 créé en standalone, zoneless, SCSS, Vitest, sans SSR.
- Neuf documents de pilotage, huit ADR.
- Verrou anti-mentions d'IA : `.gitignore` plus hook `commit-msg`, testé sur 13 cas.
- Quatre scripts de pilotage, tous exécutés au moins une fois de bout en bout.
- Chaîne de qualité : ESLint, Stylelint, Prettier, commitlint, lint-staged.
- Contrat API et correspondance des erreurs relevés sur le backend et sur son
  `GlobalExceptionHandler`, pas déduits.

**Découvert en route.**

- TypeScript 6 est strict par défaut, ce qui explique l'absence de `"strict": true` dans le
  `tsconfig.json` généré. Vérifié empiriquement plutôt que supposé (ADR-002).
- `openapi-typescript` exige encore `typescript@^5.x` : exécuté en isolation via `npx`,
  jamais installé (ADR-007).
- husky et `.githooks` se disputent `core.hooksPath` : husky retiré (ADR-008).
- `tsc -b` émettait des `.js` à côté des sources ; le script `typecheck` vérifie désormais
  les deux tsconfig sans émettre.
- La spécification ne publie aucun schéma d'erreur, et une requête sans jeton renvoie `403`
  au lieu de `401`. Les deux écarts sont documentés et signalés, sans contournement.

**Vérifications finales.** Lint 0 erreur / 0 avertissement, typecheck OK, 2 tests passés,
build de production 216,20 ko, bootstrap 7/7, check 5/5.

**En attente.** Typographie, couleur d'amorce, devise, dépôt distant, arbitrage husky.
Détail dans `01-ETAT.md`.

---

## 2026-08-19 — session 1 (suite) — Phase 1 · Noyau

**Branche** : `feat/core-noyau` (depuis `develop`)

**Arbitrages rendus avant d'ouvrir la phase.** Typographie Space Grotesk + IBM Plex Sans +
IBM Plex Mono, amorce `oklch(0.55 0.13 250)`, devise `XAF` sans décimale, `.githooks`
confirmé sans husky, dépôt GitLab. Consignés en ADR-009.

**Dépôt distant.** `gestion-stock-team/frontend-angular` créé en privé via `glab`, `main`,
`develop` et le tag `v0.1.0` poussés. Le projet `gestion-de-stock-frontend`, déjà présent
dans le même groupe et actif, appartient à un autre membre de l'équipe : laissé intact.

**Fait.**

- Types API générés et versionnés ; alias de lecture dans `core/api/api-types.ts`.
- Tokens de configuration, environnements de développement et de production.
- Contrat d'erreur, traduction en messages utilisateur, file de notifications.
- Quatre intercepteurs et leur ordre d'inversion, service d'authentification, gardes.
- 25 tests unitaires.

**Découvert en route.**

- L'ordre des intercepteurs s'inverse au retour : posé à l'envers au premier jet, ce qui
  aurait notifié une erreur avant même la tentative de rafraîchissement. Corrigé et
  documenté dans `04-ARCHITECTURE.md`.
- `GET /utilisateurs/me` expose `roles`, `entrepriseId` et `entrepriseNom` : inutile de
  décoder le jeton côté client pour connaître les droits.
- `lint-staged` faisait échouer tout commit contenant les types générés : ESLint avertit
  quand on lui présente un fichier qu'il ignore, et `--max-warnings 0` en faisait une
  erreur. Résolu par `--no-warn-ignored`.
- Un commit fourre-tout de douze fichiers s'est formé après quatre commits refusés d'affilée
  — l'index conservait les fichiers des tentatives précédentes. Défait par `reset --mixed`,
  puis refait en huit commits atomiques.

**Vérifications finales.** Lint 0 erreur / 0 avertissement, typecheck OK, 25 tests passés,
build de production 246,68 ko.

**En attente.** Validation de la phase 1. Les routes `/connexion` et `/acces-refuse`,
référencées par les gardes, n'existent pas avant les phases 4 et 5.
