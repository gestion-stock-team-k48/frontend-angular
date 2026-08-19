# État courant

- Dernière mise à jour : 2026-08-19 — session 1
- Phase en cours : 9 · Commerce — terminée, en attente de vérification visuelle
- Branche de travail : feat/commandes-ventes
- Dernier commit : 17f8d8a — feat(layout): open the commerce entries in the navigation
- Backend requis démarré : oui — `http://localhost:8080/api/v1`
- Prochaine action précise : vérifier les écrans de commerce à la main (voir « À vérifier »),
  puis fusionner dans `develop` et ouvrir la phase 10 · Administration.

## Fait dans cette phase

- `shared/commerce` : états et transitions déclarés une fois, éditeur de lignes, liste et
  écran de commande communs aux deux modules (ADR-019).
- Commandes client et commandes fournisseur : liste paginée, création, modification tant que
  la commande est en préparation, transitions d'état, suppression sauf commande livrée.
- Ventes : liste paginée, recherche par code, enregistrement, fiche en lecture seule.
- Entrées « Commandes client », « Commandes fournisseur » et « Ventes » ouvertes dans la
  navigation.
- 208 tests.

## Reste à faire dans cette phase

- Rien de code. La vérification visuelle appartient au mainteneur.

## À vérifier à la main

    nvm use && npm start

Puis, sur `http://localhost:4200`, connecté, avec un client, un fournisseur et un article
disposant de stock :

1. `/commandes-client` → « Nouvelle commande » : laisser le code vide, choisir un client, une
   date, ajouter une ligne. Le total estimé s'affiche pendant la saisie.
2. Enregistrer → la commande apparaît en « En préparation », avec un code attribué par le
   serveur.
3. L'ouvrir → « Valider la commande ». L'écran passe en lecture seule : plus de formulaire,
   et seules « Marquer livrée » et « Annuler la commande » restent proposées.
4. « Marquer livrée » → la commande passe en « Livrée », et le stock de l'article a baissé
   (`/mouvements-stock/article/:id` : une ligne « Sortie · Commande client »).
5. Tenter de livrer une commande dont la quantité dépasse le stock → message du backend
   « Stock insuffisant… », et l'écran se recharge sur l'état réel, sans rester bloqué.
6. Une commande livrée ne propose plus « Supprimer » dans la liste.
7. `/commandes-fournisseur` → même parcours ; à la livraison, le stock **monte**.
8. `/ventes/nouvelle` → l'avertissement d'écriture définitive est visible avant l'envoi.
   Enregistrer, puis vérifier la sortie de stock correspondante.
9. `/ventes` → rechercher la vente par son code : l'écran l'ouvre. Un code inconnu affiche
   « Aucune vente ne porte le code … ».
10. Une vente ouverte ne propose ni modification ni suppression.

## Points bloquants / en attente de ma validation

1. **Découpage des phases 6 à 11 déduit, pas donné** (ADR-015). À confirmer ou corriger.
2. **Push impossible** — jeton GitLab invalide (`glab auth status` : « Invalid token
   provided »). Les phases 5 à 9 sont commitées en local seulement. Créer un jeton avec les
   portées `api` et `write_repository`, puis `glab auth login` depuis un terminal, et
   `git push origin main develop`.
3. **Relecture d'ensemble** — les phases 2 à 9 ont été enchaînées sans validation
   intermédiaire.
4. **Écrans partagés** (ADR-018, ADR-019) — tiers et commandes mis en commun parce que leurs
   DTO ne diffèrent que par un nom. À confirmer, ou à défaire si les modules doivent diverger.
5. **Modification d'une commande bornée à `EN_PREPARATION`** (ADR-019) — restriction
   d'interface, faute de contrôle côté serveur. À faire remonter à l'équipe backend.
6. **Visibilité du dépôt** — passage en public refusé : rôle Maintainer, GitLab exige Owner.
7. **`@types/node` ajouté sans validation** (ADR-010).

## Écarts backend signalés, sans contournement

- Aucun schéma d'erreur publié dans `openapi.json` (ADR-004).
- `POST /auth/refresh-token` ne déclare ni corps ni paramètre alors qu'il lit
  `Authorization: Bearer <refreshToken>`.
- Une requête sans jeton renvoie `403`, pas `401` (ADR-005).
- `POST /utilisateurs/change-password` répond `401` sur un mauvais ancien mot de passe (ADR-013).
- Aucune recherche ni filtre sur les listes : articles, tiers, commandes, ventes.
- `GET /categories` n'est pas paginé.
- Les photos s'envoient mais aucun endpoint ne permet de les relire.
- Aucune liste globale des mouvements de stock (ADR-017) ; l'historique ignore le tri demandé ;
  les alertes recalculent tout le catalogue à chaque appel.
- `PUT` sur une commande ne vérifie pas son état (ADR-019).
- `DELETE /ventes/{id}` échoue toujours : l'endpoint est publié mais ne peut pas aboutir.
- `VenteResponse` ne porte aucun total, contrairement aux commandes.

Détail dans `06-API-CONTRAT.md`, section « Écarts constatés ».
