# frontend-angular — Gestion de Stock

Frontend Angular de `gestion-stock`, application SaaS multi-tenant de gestion de stock.
Le backend vit dans un dépôt séparé, `../gestion-stock-backend`, et n'est jamais modifié
depuis ici.

## Démarrage

```bash
nvm use                 # Node épinglé dans .nvmrc
./scripts/bootstrap.sh  # dépendances, hooks git, spécification OpenAPI
npm start               # http://localhost:4200
```

Le backend doit tourner pour que l'application serve à quelque chose :

```bash
cd ../gestion-stock-backend
docker compose up -d    # PostgreSQL 5433, MinIO 9005, Mailpit 1025
./mvnw spring-boot:run  # http://localhost:8080/api/v1
```

## Commandes

| Commande           | Rôle                                                    |
| ------------------ | ------------------------------------------------------- |
| `npm start`        | serveur de développement, `/api` relayé vers le backend |
| `npm run build`    | build de production                                     |
| `npm test`         | tests unitaires en mode veille                          |
| `npm run check`    | lint, styles, types, tests et build, avec rapport       |
| `npm run sync:api` | récupère la spécification OpenAPI et régénère les types |
| `npm run etat`     | état courant : branche, phase, prochaine action         |

## Jeu de démonstration

`npm run seed` remplit le backend par son API publique — les mêmes appels que ferait
l'interface, donc les mêmes règles métier appliquées par le serveur. Il crée douze
entreprises, chacune avec ses catégories, ses articles, ses tiers, ses comptes, son stock,
ses commandes et ses ventes.

Le backend et Mailpit doivent tourner, et la base être vierge :

```bash
cd ../gestion-stock-backend
docker compose down -v && docker compose up -d   # base remise à zéro
./mvnw spring-boot:run
cd ../frontend-angular && npm run seed
```

Tous les comptes créés partagent le mot de passe `GestionStock2026!`. Le backend ne permet pas
de le choisir à la création : le script emprunte donc le parcours « mot de passe oublié » —
demande de réinitialisation, lecture du code dans Mailpit, pose du mot de passe — exactement
ce que ferait la personne elle-même.

`SEED_ALIGNEMENT=1 npm run seed` repasse sur les comptes restés à leur mot de passe
temporaire, sans rien recréer.

Réglages par variables d'environnement — `SEED_ENTREPRISES`, `SEED_ARTICLES`,
`SEED_MOT_DE_PASSE`, `SEED_ETIQUETTE` (suffixe à poser pour ajouter des entreprises à une
base déjà remplie), et les autres, listées en tête de `scripts/seed.mjs`.

## Documentation

Tout le pilotage du projet est dans `docs/`, en français.
Commencer par `docs/01-ETAT.md` : phase en cours, ce qui reste, ce qui attend un arbitrage.

| Fichier                                           | Contenu                        |
| ------------------------------------------------- | ------------------------------ |
| [`00-BRIEF.md`](docs/00-BRIEF.md)                 | mission et périmètre           |
| [`01-ETAT.md`](docs/01-ETAT.md)                   | état courant                   |
| [`02-CONVENTIONS.md`](docs/02-CONVENTIONS.md)     | git, code, nommage             |
| [`03-INTERDITS.md`](docs/03-INTERDITS.md)         | garde-fous                     |
| [`04-ARCHITECTURE.md`](docs/04-ARCHITECTURE.md)   | découpage et flux de données   |
| [`05-DESIGN-SYSTEM.md`](docs/05-DESIGN-SYSTEM.md) | tokens, thème, animations      |
| [`06-API-CONTRAT.md`](docs/06-API-CONTRAT.md)     | endpoints, pagination, erreurs |
| [`07-DECISIONS.md`](docs/07-DECISIONS.md)         | décisions d'architecture       |
| [`08-JOURNAL.md`](docs/08-JOURNAL.md)             | journal de bord                |

## Stack

Angular 22 standalone et zoneless, TypeScript 6, signaux et `httpResource`, Signal Forms,
Angular Aria pour les primitives accessibles, SCSS avec tokens en variables CSS, Vitest.
Aucune bibliothèque de composants tierce : la personnalisation des couleurs par entreprise
l'interdit.
