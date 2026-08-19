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
