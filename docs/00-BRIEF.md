# Brief — frontend Angular « Gestion de Stock »

## Mission

Construire le frontend Angular de `gestion-stock`, application SaaS multi-tenant de gestion
de stock. Le backend (Spring Boot 3.2.5 / Java 21, groupe Maven `cm.kfokam`) existe déjà et
n'est jamais modifié depuis ce dépôt.

## Périmètre

Dans le périmètre :

- Interface web complète en français, couvrant les 12 modules métier exposés par l'API :
  articles, catégories, clients, fournisseurs, commandes client, commandes fournisseur,
  mouvements de stock, ventes, entreprise, utilisateurs, tableau de bord, authentification.
- Système de thème runtime permettant à chaque entreprise d'avoir sa couleur de marque.
- Design system maison, sans bibliothèque de composants tierce.

Hors périmètre :

- Toute modification du backend, de sa base de données ou de son infrastructure.
- Le rendu côté serveur (SSR) et la génération statique.
- Une application mobile native. L'application web est responsive jusqu'à 360 px, c'est tout.
- L'internationalisation multi-langue. L'interface est en français, locale `fr`.

## Backend de référence

| | |
|---|---|
| Dépôt local | `../gestion-stock-backend` |
| API REST | `http://localhost:8080/api/v1` |
| Spécification OpenAPI | `http://localhost:8080/api/v1/v3/api-docs` |
| Swagger UI | `http://localhost:8080/api/v1/swagger-ui.html` |
| Authentification | JWT `token` (24 h) + `refreshToken` (7 j), schéma `BearerAuth` |
| Rôles | `ROLE_ADMIN`, `ROLE_USER` |
| Multi-tenant | scoping par entreprise assuré côté serveur |

Infrastructure de développement du backend, à démarrer avec `docker compose up -d` depuis
`../gestion-stock-backend` : PostgreSQL `5433`, MinIO `9005` (console `9006`), Mailpit SMTP
`1025` (interface web `8025`).

La spécification OpenAPI est la **seule** source de vérité pour les endpoints, les DTO et les
codes d'erreur. Voir `06-API-CONTRAT.md`.

## Règles métier structurantes

- Transitions d'état des commandes : `EN_PREPARATION → VALIDEE → LIVREE | ANNULEE`.
  Le backend refuse toute transition illégale ; l'interface ne propose que les transitions
  légales depuis l'état courant.
- Le stock réel est calculé par le backend à partir des mouvements. L'interface ne le
  recalcule jamais.
- Un article dont le stock réel passe sous son seuil minimum déclenche une alerte, remontée
  par `GET /mouvements-stock/alertes-stock`.

## Organisation du travail

Le travail avance par phases (voir `01-ETAT.md` pour la phase en cours). Une phase = une
branche = un merge dans `develop`. Chaque phase se termine par un rapport, la mise à jour de
`01-ETAT.md` et une entrée dans `08-JOURNAL.md`.

## Documents de pilotage

| Fichier | Contenu |
|---|---|
| `00-BRIEF.md` | ce document : mission, périmètre |
| `01-ETAT.md` | état courant — à lire en premier à chaque session |
| `02-CONVENTIONS.md` | git, code, nommage, structure |
| `03-INTERDITS.md` | garde-fous |
| `04-ARCHITECTURE.md` | découpage, flux de données, authentification |
| `05-DESIGN-SYSTEM.md` | tokens, thème, animations |
| `06-API-CONTRAT.md` | endpoints, pagination, erreurs |
| `07-DECISIONS.md` | décisions d'architecture (ADR courts) |
| `08-JOURNAL.md` | journal daté, append-only |
