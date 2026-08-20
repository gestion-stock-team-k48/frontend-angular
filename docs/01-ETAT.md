# État courant

- Dernière mise à jour : 2026-08-19 — session 1
- Phase en cours : affinage de l'interface — tableau de bord, navigation, responsive.
- Branche de travail : feat/ui-tableau-de-bord
- Dernier commit : voir `git log -1` — tableau de bord et documentation
- Backend requis démarré : oui — `http://localhost:8080/api/v1`
- Prochaine action précise : regarder l'application à l'écran, avec le jeu de démonstration
  en place (voir « À vérifier »). Ensuite, au choix : relecture d'ensemble des phases 2 à 11,
  fusion dans `main` et tag `v1.0.0`, ou remontée des seize écarts backend à l'équipe
  concernée — l'écart nº 16 bloque les ventes hors de la première entreprise.

## Fait depuis la dernière entrée

**Tableau de bord.** Reconstruit autour des trois questions du matin : combien j'ai encaissé,
où en sont mes commandes, ce qui manque en rayon. Quatre mesures en tête, le chiffre du mois
en chiffre d'appel, puis une courbe du chiffre d'affaires par mois, la répartition des
commandes par état, les livraisons par mois, le classement des articles vendus, et l'aperçu
des alertes de seuil.

Le backend ne publie aucune série temporelle : les tendances sont agrégées côté navigateur à
partir des 200 dernières ventes et commandes, sur la définition du serveur — le chiffre
d'affaires, ce sont les ventes. L'écran le dit sous la courbe plutôt que de faire passer une
somme du navigateur pour un chiffre serveur.

**Graphiques** — trois formes écrites en SVG dans `shared/dataviz`, sans bibliothèque
(ADR-021) : la couleur d'amorce de l'entreprise se propage aux dessins sans qu'une ligne de
code s'exécute, ce qu'aucune bibliothèque à canevas ne fait gratuitement. Chaque graphique
porte une table de données dépliable.

**Navigation et bandeau.** Repliée, la navigation devient un rail d'icônes au lieu de
disparaître. Le bandeau est translucide et flouté, colle en haut, se réduit sur écran étroit,
et porte un lien de saut vers le contenu. Jeu d'icônes maison, au trait.

**Écrans.** Largeur de confort de 90 rem, rembourrage et titres fluides en `clamp()`, entêtes
qui passent en colonne sous 40 rem — dans une feuille commune plutôt que répétés par écran.

**251 tests.** Build 329,21 ko, soit un demi-kilo-octet de plus qu'avant les graphiques.

## À vérifier à la main

    nvm use && npm start

Avec le jeu de démonstration en place (`admin@quincaillerie-centredemo.cm`) :

1. Tableau de bord : les quatre mesures, la courbe du chiffre d'affaires, la répartition par
   état, les livraisons par mois, le classement, les alertes.
2. Survoler la courbe : l'infobulle suit le mois pointé. Déplier « Voir les données » sous
   chaque graphique.
3. `/parametres/apparence` : changer la couleur d'amorce — courbes, barres et jauges se
   repeignent avec le reste, en clair comme en sombre.
4. Replier la navigation : elle devient un rail d'icônes, les libellés passent en infobulle.
5. Réduire la fenêtre à moins de 48 rem : la navigation devient un tiroir, le bandeau se
   réduit à la marque, la pastille et les actions.
6. Premier `Tab` sur n'importe quel écran : le lien « Aller au contenu » apparaît.
7. Système réglé sur « animations réduites » : plus rien ne bouge, tout reste lisible.

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
