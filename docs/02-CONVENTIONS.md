# Conventions

## Git — branches

| Branche                                                              | Rôle                                                    |
| -------------------------------------------------------------------- | ------------------------------------------------------- |
| `main`                                                               | stable, uniquement des merges validés, taguée en SemVer |
| `develop`                                                            | intégration continue du travail                         |
| `feat/<scope>-<slug>`                                                | nouvelle fonctionnalité                                 |
| `fix/<scope>-<slug>`                                                 | correction                                              |
| `refactor/`, `perf/`, `docs/`, `chore/`, `build/`, `test/`, `style/` | selon la nature                                         |

Une phase du plan de livraison = une branche = un merge. Merge dans `develop` en `--no-ff`.
Pas de rebase d'une branche déjà poussée. Jamais de `push --force` sur `main` ni `develop`.

## Git — messages de commit

Format Conventional Commits. Sujet à l'impératif, en anglais, minuscule, sans point final,
72 caractères maximum.

```
feat(articles): add article list with server-side pagination

Wire the list to GET /articles and expose sort + search as query params.
Empty and error states handled by the shared table component.
```

`scope` = module métier ou couche : `auth`, `articles`, `categories`, `clients`,
`fournisseurs`, `commandes-client`, `commandes-fournisseur`, `mouvements-stock`, `ventes`,
`entreprise`, `utilisateurs`, `dashboard`, `parametres`, `ui`, `theme`, `layout`, `core`,
`http`, `docs`, `repo`, `scripts`, `lint`, `hooks`, `ci`.

Interdits absolus dans un message de commit : `Co-authored-by`, `Generated with`, toute
mention d'un outil ou modèle d'IA, tout emoji. Le hook `.githooks/commit-msg` bloque ces cas
et indique la ligne fautive.

Un commit = une intention. Pas de commit fourre-tout, pas de `wip` sur `develop`.
`git add .` est interdit : les fichiers sont ajoutés explicitement, et `git diff --staged`
est relu avant chaque commit.

Avant tout commit : `npm run lint`, `npm run typecheck` et `npm run build` doivent passer
(`scripts/check.sh` fait les trois plus les tests).

Tags SemVer sur `main` : `v0.1.0`, `v0.2.0`, …

## Environnement

- Node : version épinglée dans `.nvmrc`. `nvm use` avant toute commande.
  Angular CLI 22 exige `^22.22.3 || ^24.15.0 || >=26.0.0`.
- Installation : `./scripts/bootstrap.sh`.
- Vérification complète : `./scripts/check.sh`.
- Régénération des types API : `./scripts/sync-api.sh` (backend démarré requis).
- État du dépôt en un coup d'œil : `./scripts/etat.sh`.

## Code TypeScript

- TypeScript 6 : `strict` est actif par défaut, ne pas le redéclarer.
  `noUncheckedIndexedAccess` est activé explicitement dans `tsconfig.json`.
- Zéro `any`, zéro `@ts-ignore`, zéro `!` (non-null assertion) sans commentaire justifiant.
- Composants standalone uniquement, `inject()`, pas de NgModule.
- `changeDetection: OnPush` partout ; l'application est zoneless, `zone.js` n'est pas installé.
- État réactif : `signal` / `computed` / `linkedSignal`. Données asynchrones : `resource` /
  `httpResource`.
- Formulaires : Signal Forms (`@angular/forms/signals`).
- Aucune URL, couleur, durée, espacement ou libellé métier codé en dur : tout passe par un
  token d'injection, un token CSS ou un fichier de configuration.

## Nommage des fichiers

Convention Angular « 2025 » (option par défaut du CLI v22) : `article-list.ts`,
`article-list.html`, `article-list.scss`, `article-store.ts`, `article-api.ts`.
Pas de suffixe `.component.ts` ni `.service.ts`.

Sélecteurs : préfixe `app`, kebab-case — `<app-jauge-seuil>`.

## Nommage du code

Le code est en anglais pour les mots-clés techniques, mais **le vocabulaire métier reste en
français**, aligné sur les DTO du backend : `article`, `categorie`, `client`, `fournisseur`,
`commandeClient`, `mouvementStock`, `vente`, `entreprise`, `utilisateur`.

## Structure des dossiers

Voir `04-ARCHITECTURE.md`.

## SCSS

- Un fichier de tokens global, des composants qui ne consomment que des variables CSS
  sémantiques (`var(--surface-1)`), jamais un token primitif ni une valeur littérale.
- `stylelint` avec `stylelint-config-standard-scss` ; la règle interdisant les couleurs
  littérales hors du fichier de tokens est active.

## Écriture de l'interface

Vocabulaire de l'utilisateur, jamais celui du code : « Mouvement de stock », pas « MvtStk ».
Verbes cohérents d'un bout à l'autre d'un flux : le bouton « Valider la commande » produit le
message « Commande validée ». Pas de ton d'excuse dans les erreurs, pas de point
d'exclamation, pas d'emoji dans l'interface.
