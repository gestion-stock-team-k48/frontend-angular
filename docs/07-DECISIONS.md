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
