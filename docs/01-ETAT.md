# État courant

- Dernière mise à jour : 2026-08-19 — session 1
- Phase en cours : 0 · Fondations
- Branche de travail : chore/core-foundations
- Dernier commit : d194ccf — fix(scripts): stop typecheck from emitting and align report columns
- Backend requis démarré : oui — `http://localhost:8080/api/v1`, spécification récupérée
- Prochaine action précise : obtenir l'arbitrage sur les quatre points en attente, puis ouvrir la phase 1 (noyau).

## Fait dans cette phase

- Dépôt `frontend-angular` initialisé, branches `main` et `develop` créées.
- Espace de travail Angular 22.1.4 : standalone, zoneless, SCSS, Vitest, sans SSR.
- Node 24.19.0 installé via nvm et épinglé dans `.nvmrc` (le CLI refuse la 24.14.1).
- Documentation de pilotage complète : `00-BRIEF` à `08-JOURNAL`, huit ADR.
- `.gitignore` couvrant les fichiers d'agent IA, les secrets et les artefacts.
- Hooks git versionnés dans `.githooks` : `commit-msg` (règle anti-IA puis commitlint),
  `pre-commit` (lint-staged). 13 cas de test passés à la main.
- Scripts `bootstrap.sh`, `check.sh`, `sync-api.sh`, `etat.sh` : étapes numérotées, rapport
  final tabulé. Bootstrap 7/7, check 5/5, sync-api 3/4 (le 4e signale une absence côté
  backend, pas un échec).
- ESLint, Prettier, Stylelint configurés ; `any`, `@ts-ignore` et `!` interdits par le lint ;
  `OnPush` imposé ; `core` et `shared` ne peuvent pas importer une feature.
- `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters` activés.
- Contrat API relevé sur le backend en fonctionnement : 41 chemins, 66 opérations,
  47 schémas, plus la forme réelle des réponses d'erreur et leur correspondance.

## Reste à faire dans cette phase

- Rien. La phase 0 est complète, en attente de validation.

## Points bloquants / en attente de ma validation

1. **Typographie** — pairing 1 (Bricolage Grotesque + Inter + JetBrains Mono) ou pairing 2
   (Space Grotesk + IBM Plex Sans + IBM Plex Mono) ? Bloque la phase 2.
2. **Couleur d'amorce par défaut** — `oklch(0.55 0.13 250)`, bleu-indigo désaturé, proposé
   pour ne pas concurrencer le vert / ambre / rouge de la jauge de seuil. Bloque la phase 2.
3. **Devise** — `XAF` / FCFA sans décimales, à confirmer avant d'être figé dans le token de
   configuration.
4. **Dépôt distant** — dépôt local seul, ou remote à créer ? Le backend est hébergé sur
   GitLab au vu de ses messages de merge.
5. **husky écarté** — le brief l'impose au §4, mais il revendique `core.hooksPath`, que
   `.githooks` occupe déjà (§3.3). Choix retenu : `.githooks`, husky retiré (ADR-008).
   À confirmer ou à inverser.

## Écarts backend signalés, sans contournement

- Aucun schéma d'erreur n'est publié dans `openapi.json` ; la forme réelle a été relevée en
  interrogeant le backend (ADR-004).
- `POST /auth/refresh-token` ne déclare ni corps ni paramètre alors qu'il lit
  `Authorization: Bearer <refreshToken>`.
- Une requête sans jeton renvoie `403`, pas `401` (ADR-005).

Détail dans `06-API-CONTRAT.md`, section « Écarts constatés ».
