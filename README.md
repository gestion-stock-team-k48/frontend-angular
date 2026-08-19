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
