# État courant

- Dernière mise à jour : 2026-08-19 — session 1
- Phase en cours : 7 · Stock — terminée, en attente de vérification visuelle
- Branche de travail : feat/mouvements-stock
- Dernier commit : 3a56915 — feat(layout): open the stock entries in the navigation
- Backend requis démarré : oui — `http://localhost:8080/api/v1`
- Prochaine action précise : vérifier les écrans de stock à la main (voir « À vérifier »),
  puis fusionner dans `develop` et ouvrir la phase 8 · Tiers.

## Fait dans cette phase

- Choix de l'article : catalogue paginé et trié, porte d'entrée de la section (ADR-017).
- Stock d'un article : stock réel du serveur, jauge de seuil, historique paginé, et les
  quatre opérations — entrée, sortie, correction positive, correction négative.
- Alertes de seuil : liste complète, la plus critique en tête, chaque ligne mesurée par
  rapport à son propre seuil.
- Pipe `quantite` ; helper d'erreurs de formulaire élargi aux champs numériques.
- Entrées « Mouvements de stock » et « Alertes de seuil » ouvertes dans la navigation.
- 157 tests.

## Reste à faire dans cette phase

- Rien de code. La vérification visuelle appartient au mainteneur.

## À vérifier à la main

    nvm use && npm start

Puis, sur `http://localhost:4200`, connecté, avec au moins un article au catalogue :

1. `/mouvements-stock` → le catalogue, trié par désignation. « Voir le stock » ouvre l'article.
2. Sur un article sans mouvement : la jauge est à zéro, l'écran propose d'enregistrer une
   entrée plutôt que d'afficher un tableau vide.
3. Entrée de 40, source « Stock initial » → le stock réel passe à 40 **après appel serveur**
   (onglet Réseau : `stock-reel` est redemandé, il n'est pas recalculé côté navigateur).
4. Sortie de 15, source « Vente » → stock 25, la ligne d'historique affiche « −15 ».
5. Sortie de 999 → le message du backend « Stock insuffisant… » s'affiche dans le bandeau du
   formulaire, **sans** notification en double, et la modale reste ouverte.
6. Correction négative → le motif est obligatoire, la source disparaît du formulaire.
7. Faire passer le stock sous le seuil de l'article, puis `/mouvements-stock/alertes` → la
   ligne apparaît, la plus critique en tête.
8. Vider le stock d'un article (rupture) → sa jauge passe en rouge, devant les autres alertes.

## Points bloquants / en attente de ma validation

1. **Découpage des phases 6 à 11 déduit, pas donné** (ADR-015). À confirmer ou corriger.
2. **Push impossible** — `git push` refusé par GitLab : « HTTP Basic: Access denied ».
   Jeton expiré ou mal scopé. Les phases 5, 6 et 7 sont commitées en local seulement.
   Relancer `glab auth login`, puis `git push origin main develop`.
3. **Relecture d'ensemble** — les phases 2 à 7 ont été enchaînées sans validation
   intermédiaire.
4. **Visibilité du dépôt** — passage en public refusé : rôle Maintainer, GitLab exige Owner.
5. **`@types/node` ajouté sans validation** (ADR-010).
6. **Périmètre du formulaire d'inscription** — champs exigés par le backend seulement.

## Écarts backend signalés, sans contournement

- Aucun schéma d'erreur publié dans `openapi.json` (ADR-004).
- `POST /auth/refresh-token` ne déclare ni corps ni paramètre alors qu'il lit
  `Authorization: Bearer <refreshToken>`.
- Une requête sans jeton renvoie `403`, pas `401` (ADR-005).
- `POST /utilisateurs/change-password` répond `401` sur un mauvais ancien mot de passe (ADR-013).
- `GET /articles` n'accepte ni recherche ni filtre.
- `GET /categories` n'est pas paginé.
- Les photos s'envoient mais aucun endpoint ne permet de les relire.
- Aucune liste globale des mouvements de stock : lecture article par article (ADR-017).
- L'historique d'un article ignore le tri demandé : l'ordre des dates est forcé côté serveur.
- `GET /mouvements-stock/alertes-stock` recalcule le stock de tout le catalogue, sans pagination.

Détail dans `06-API-CONTRAT.md`, section « Écarts constatés ».
