# État courant

- Dernière mise à jour : 2026-08-19 — session 1
- Phase en cours : 11 · Tableau de bord — terminée, en attente de vérification visuelle.
  **C'est la dernière phase du plan déduit (ADR-015).**
- Branche de travail : feat/tableau-de-bord
- Dernier commit : voir `git log -1` — tableau de bord et documentation
- Backend requis démarré : oui — `http://localhost:8080/api/v1`
- Prochaine action précise : vérifier le tableau de bord à la main (voir « À vérifier »),
  fusionner dans `develop`, puis décider de la suite — relecture d'ensemble des phases 2 à 11,
  fusion dans `main` et tag, ou reprise des écarts backend signalés.

## Fait dans cette phase

- `/tableau-de-bord` : chiffre d'affaires du mois et total, commandes client et fournisseur
  par état, classement des articles les plus vendus, aperçu des alertes de seuil.
- La racine de l'application mène désormais au tableau de bord.
- Dernière entrée de navigation ouverte : plus aucun écran annoncé n'est inerte.
- 230 tests.

## Reste à faire dans cette phase

- Rien de code. La vérification visuelle appartient au mainteneur.

## À vérifier à la main

    nvm use && npm start

1. `/` redirige vers `/tableau-de-bord`.
2. Les quatre tuiles affichent les chiffres du serveur ; le chiffre d'affaires du mois est
   mis en avant par la couleur de marque.
3. Le classement des ventes met le meilleur article à pleine largeur, les autres au prorata.
4. Un article sous son seuil apparaît dans les alertes, avec sa jauge ; « Tout voir » mène à
   `/mouvements-stock/alertes`, et cliquer un article mène à son stock.
5. Sans aucune vente ni aucune alerte, les deux cartes le disent au lieu d'afficher du vide.
6. La navigation ne contient plus aucune entrée grisée.

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
5. **Restrictions d'interface faute de contrôle serveur** — modification d'une commande
   bornée à `EN_PREPARATION` (ADR-019), suppression de son propre compte refusée (ADR-020).
   À faire remonter à l'équipe backend : le second cas laisse aussi supprimer le dernier
   administrateur de l'entreprise, ce que l'interface ne peut pas empêcher.
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
- `DELETE /utilisateurs/{id}` ne protège ni le compte courant ni le dernier administrateur.
- Aucun endpoint n'envoie de logo d'entreprise, alors que le DTO porte un champ `photo`.

Détail dans `06-API-CONTRAT.md`, section « Écarts constatés ».
