# État courant

- Dernière mise à jour : 2026-08-19 — session 1
- Phase en cours : affinage visuel — couleur, relief et mouvement. Les onze phases du plan
  déduit (ADR-015) sont terminées et fusionnées dans `develop`.
- Branche de travail : feat/theme-affinage
- Dernier commit : voir `git log -1` — tableau de bord et documentation
- Backend requis démarré : oui — `http://localhost:8080/api/v1`
- Prochaine action précise : regarder l'application à l'écran (voir « À vérifier »), puis
  fusionner dans `develop`. Ensuite : relecture d'ensemble, fusion dans `main` et tag, ou
  reprise des écarts backend signalés.

## Fait dans cet affinage

Le mouvement décrit depuis la phase 2 dans `05-DESIGN-SYSTEM.md` n'avait jamais été posé.
Il l'est, entièrement piloté par les tokens de durée existants — `prefers-reduced-motion`
éteint donc toujours l'application d'un bloc.

- **Couleur** : trois familles de tokens sémantiques bâties sur `color-mix` de `--brand`,
  donc portées par la couleur d'amorce de l'entreprise — surfaces teintées pour le survol et
  l'entrée de navigation active, dégradé de marque pour les actions et les filets de tête,
  ombre teintée pour ce qui est cliquable, halo de fond sur la coquille et l'écran de
  connexion.
- **Relief** : entêtes de tableau collants et dégradés, calques floutés (bandeau, voile de
  modale, tiroir), tuiles du tableau de bord qui se soulèvent au survol.
- **Mouvement** : apparition en cascade des lignes de tableau, modale en fondu et échelle,
  notifications qui entrent par le bord où elles se posent, jauge de seuil qui se déploie,
  mesures du tableau de bord qui courent vers leur valeur, entrée de navigation qui avance
  d'un cran sous le curseur.
- 232 tests.

## Deux défauts trouvés en chemin

1. **Les styles de ligne de tableau ne s'appliquaient pas.** Les lignes sont projetées dans
   `app-tableau` par l'écran appelant : elles portent l'attribut d'encapsulation du parent,
   et aucune règle de `tableau.scss` ne pouvait les atteindre. Le survol posé en phase 6
   n'avait donc jamais rien fait. Les règles vivent maintenant dans `styles/_tableau.scss`,
   pour la même raison qui met le style des champs dans `_base.scss`.
2. **Le compteur animé lisait une horloge décalée.** `requestAnimationFrame` passe un
   horodatage dont l'origine diffère de `performance.now()` selon l'environnement, ce qui
   produisait un avancement négatif. L'horloge est relue à chaque image.

## À vérifier à la main

    nvm use && npm start

1. Écran de connexion : deux halos de marque en fond, carte avec filet de marque en tête.
2. Une liste : les lignes arrivent en cascade, le survol pose un liseré de marque à gauche,
   l'entête reste visible en défilant.
3. Le bandeau et le tiroir de navigation laissent deviner le contenu qui passe dessous.
4. Ouvrir une modale : fondu, léger agrandissement, arrière-plan flouté ; la croix pivote au
   survol.
5. Enregistrer quelque chose : la notification entre par la droite, teintée selon son niveau.
6. Tableau de bord : les quatre mesures courent vers leur valeur, les barres du classement se
   déploient, la tuile du mois porte l'ombre de marque.
7. `/parametres/apparence` : changer la couleur d'amorce recolore tout ce qui précède, y
   compris les ombres et les dégradés.
8. Système réglé sur « animations réduites » : plus rien ne bouge, tout reste lisible.

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
