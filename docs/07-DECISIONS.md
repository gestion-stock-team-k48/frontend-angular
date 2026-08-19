# Décisions d'architecture

Format : décision / contexte / conséquence. Une entrée par décision, numérotée, jamais
supprimée — une décision annulée est marquée « remplacée par ADR-nnn ».

---

## ADR-001 — Node 24.19.0 épinglé via `.nvmrc`

**Contexte.** Le poste disposait de Node v24.14.1. Angular CLI 22.1.4 exige
`^22.22.3 || ^24.15.0 || >=26.0.0` et refuse de démarrer en dessous. nvm était déjà installé.

**Décision.** Installer Node 24.19.0 (LTS Krypton) via nvm et l'épingler dans `.nvmrc`.
L'alias `default` de nvm pointait déjà sur `lts/*`, donc sur cette version : aucune
modification de l'environnement global n'a été nécessaire.

**Conséquence.** `nvm use` est requis avant toute commande npm du projet. `scripts/check.sh`
et `scripts/bootstrap.sh` vérifient la version et échouent avec un message explicite si elle
ne convient pas.

---

## ADR-002 — `strict` n'est pas redéclaré dans `tsconfig.json`

**Contexte.** Le brief impose `strict` et `noUncheckedIndexedAccess`. Le `tsconfig.json`
généré par Angular 22 ne contient pas `"strict": true`, ce qui laissait penser à un oubli.

**Décision.** Vérification empirique avec le compilateur du projet (TypeScript 6.0.3) :
un paramètre sans type déclenche `TS7006` et un accès sur un `string | null` déclenche
`TS18047` sans aucune option. **TypeScript 6 est strict par défaut**, d'où l'absence du drapeau
dans le modèle du CLI. En revanche `noUncheckedIndexedAccess` n'est pas actif par défaut :
il est ajouté explicitement.

**Conséquence.** `tsconfig.json` ne redéclare pas `strict`. Y ajouter `"strict": false`
suffirait à tout désactiver — ne jamais le faire. Les options ajoutées explicitement sont
`noUncheckedIndexedAccess`, `noUnusedLocals` et `noUnusedParameters`.

---

## ADR-003 — Jeton d'accès en mémoire, jeton de rafraîchissement en `localStorage`

**Contexte.** Le backend délivre `token` (24 h) et `refreshToken` (7 j). Il n'utilise pas de
cookie `HttpOnly` : les deux jetons transitent dans le corps de la réponse
d'authentification. L'application doit survivre à un rechargement de page.

**Décision.** Le jeton d'accès vit dans un signal en mémoire, jamais persisté. Le jeton de
rafraîchissement est écrit dans `localStorage`, seule façon de rester connecté après un
rechargement sans cookie serveur.

**Conséquence — risque assumé.** `localStorage` est lisible par tout script exécuté sur
l'origine : une faille XSS permettrait l'exfiltration du jeton de rafraîchissement et donc
sept jours d'accès. Les contreparties retenues sont : aucune interpolation de HTML non
assaini (`innerHTML` proscrit, `DomSanitizer.bypassSecurityTrust*` interdit sans revue), le
jeton d'accès jamais persisté, et purge complète du stockage à la déconnexion. Le passage à
un cookie `HttpOnly` `SameSite=Strict` reste la vraie solution ; elle demande une évolution
du backend et sort du périmètre de ce dépôt.

---

## ADR-004 — Le type de la réponse d'erreur est écrit à la main

**Contexte.** Le brief interdit d'écrire un DTO à la main : tout vient d'`openapi.json`. Or
la spécification ne publie aucun schéma d'erreur — les réponses `4xx` y sont typées avec le
schéma de succès de l'opération. La forme réelle a été relevée en interrogeant le backend en
fonctionnement, puis recoupée avec `GlobalExceptionHandler`.

**Décision.** Déclarer à la main, dans `core/http`, le type de la réponse d'erreur
(`timestamp`, `status`, `error`, `message`, `path`, `validationErrors?`). C'est l'unique
exception documentée à l'interdiction.

**Conséquence.** Ce type est vérifié à chaque exécution de `scripts/sync-api.sh` : si un
schéma d'erreur apparaît un jour dans la spécification, le type manuel est supprimé au profit
du type généré. L'écart est consigné dans `06-API-CONTRAT.md` pour remontée au mainteneur du
backend.

---

## ADR-005 — Le refresh se déclenche sur `401` et sur `403`

**Contexte.** Le brief décrit un refresh single-flight déclenché par un `401`. Or une requête
sans en-tête `Authorization` sur `GET /articles` renvoie `403`, pas `401` : la configuration
Spring Security du backend transforme l'absence d'authentification en accès refusé.

**Décision.** L'interceptor traite `401` et `403` de la même façon sur les ressources
métier : un seul appel de rafraîchissement, les requêtes concurrentes mises en file puis
rejouées. Les routes `/auth/*` sont exclues du mécanisme pour éviter toute boucle.

**Conséquence.** Un vrai refus de droits (rôle insuffisant) provoquera un cycle de refresh
inutile avant d'être présenté comme un `403`. Coût : une requête supplémentaire, sur un cas
rare. À réévaluer si le backend distingue un jour les deux situations. Signalé dans
`06-API-CONTRAT.md`.

---

## ADR-006 — Vitest comme lanceur de tests, via le builder officiel

**Contexte.** Le brief impose Vitest. Angular 22 propose `--test-runner=vitest` à la création
du projet et un builder `@angular/build:unit-test`.

**Décision.** Utiliser le chemin officiel du CLI, sans intégration tierce.

**Conséquence.** Pas de `karma.conf.js`, pas de `vitest.config.ts` à maintenir : la
configuration vit dans `angular.json`. Si un besoin dépasse ce que le builder expose, la
question est posée avant d'ajouter un fichier de configuration parallèle.

---

## ADR-007 — `openapi-typescript` exécuté en isolation, pas installé

**Contexte.** Le brief impose de générer les types API avec `openapi-typescript`. Sa dernière
version (7.13.0) déclare `peerDependencies: { typescript: "^5.x" }` alors que le projet est en
TypeScript 6.0.3. Aucune version publiée ne supporte encore TypeScript 6 ; l'installer dans le
projet imposerait `--legacy-peer-deps` et deux versions de TypeScript dans `node_modules`.

**Décision.** Ne pas l'ajouter aux `devDependencies`. `scripts/sync-api.sh` l'exécute via
`npx --yes openapi-typescript@7.13.0`, dans un environnement isolé qui embarque son propre
TypeScript 5. La sortie générée est du TypeScript ordinaire, parfaitement lisible par le
compilateur 6 du projet.

**Conséquence.** La génération demande un accès réseau, ou un cache npm chaud — mais elle
n'est nécessaire que lorsque le contrat backend change, jamais au build. La version du
générateur est figée dans le script pour rester reproductible. Réévaluer lorsqu'une version
compatible TypeScript 6 sortira : elle rejoindra alors les `devDependencies`.

---

## ADR-008 — Hooks git dans `.githooks`, sans husky

**Contexte.** Le brief impose husky au §4 et, au §3.3, l'activation des hooks par
`git config core.hooksPath .githooks`. Ces deux exigences sont incompatibles : husky pose
lui-même `core.hooksPath` sur `.husky/_`, et un dépôt git n'a qu'un seul `hooksPath`.

**Décision.** Conserver `.githooks`, qui porte le verrou anti-mentions d'IA — l'exigence la
plus spécifique du brief — et retirer husky. `lint-staged` et `commitlint` sont conservés :
ce sont eux qui font le travail ; husky ne servait qu'à installer les hooks.
`.githooks/pre-commit` appelle `lint-staged`, `.githooks/commit-msg` applique la règle
anti-IA puis délègue à `commitlint`.

**Conséquence.** Les hooks ne s'installent pas tout seuls après un `git clone` : il faut
lancer `./scripts/bootstrap.sh`, qui pose `core.hooksPath` et rend les hooks exécutables.
C'est la contrepartie de la suppression de husky, et l'étape 5 du bootstrap l'affiche
explicitement. À trancher par le mainteneur s'il préfère l'inverse.

---

## ADR-009 — Arbitrages de direction artistique et de format

**Contexte.** La phase 0 s'est terminée avec cinq points en attente d'arbitrage. Ils ont été
tranchés en session 1, le 2026-08-19.

**Décisions.**

| Sujet                       | Choix                                                                      |
| --------------------------- | -------------------------------------------------------------------------- |
| Typographie                 | Space Grotesk (display) + IBM Plex Sans (texte) + IBM Plex Mono (chiffres) |
| Couleur d'amorce par défaut | `oklch(0.55 0.13 250)`, bleu-indigo désaturé                               |
| Devise                      | `XAF` / FCFA, zéro décimale, symbole après le montant                      |
| Hooks git                   | `.githooks` conservé, husky écarté — confirme ADR-008                      |
| Dépôt distant               | GitLab, projet créé par le mainteneur ; remote ajouté ensuite              |

**Conséquences.**

- Les trois familles typographiques sont sous licence OFL et seront auto-hébergées en
  `woff2` dans `public/fonts/` en phase 2. Aucun appel à un CDN : l'application doit se
  charger sans accès Internet.
- L'amorce ne concurrence ni le vert, ni l'ambre, ni le rouge de la jauge de seuil. Aucun
  preset ne sera proposé dans cette plage.
- Le format monétaire vit dans un token d'injection : une entreprise hors zone CFA change de
  devise sans modification de code.
