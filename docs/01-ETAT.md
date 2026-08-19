# État courant

- Dernière mise à jour : 2026-08-19 — session 1
- Phase en cours : 6 · Catalogue — terminée, en attente de vérification visuelle
- Branche de travail : feat/articles-catalogue
- Dernier commit : bdfa48d — feat(layout): open the catalogue entries in the navigation
- Backend requis démarré : oui — `http://localhost:8080/api/v1`
- Prochaine action précise : vérifier les écrans du catalogue à la main (voir « À vérifier »),
  puis fusionner dans `develop` et ouvrir la phase 7 · Stock.

## Fait dans cette phase

- Primitives de liste : `shared/ui/tableau` (en-têtes, tri annoncé, lignes de chargement,
  zone d'état vide) et `shared/ui/pagination`. Pipe `montant`, dans la devise configurée.
- `core/api/pagination.ts` : paramètres `page` / `size` / `sort`, et dérivation de ce que le
  backend ne renvoie pas (`premiere`, `nombreElements`).
- Catégories : liste triée côté navigateur, création et modification en modale, suppression
  confirmée.
- Articles : liste paginée et triée côté serveur, formulaire de création et de modification,
  suppression confirmée, envoi de photo.
- Prix TTC calculé à partir du HT et du taux, arrondi selon la devise (ADR-016).
- Correctif de la phase 5 : une erreur affichée dans un formulaire n'est plus doublée d'une
  notification globale.
- Entrées « Articles » et « Catégories » ouvertes dans la navigation.
- 137 tests.

## Reste à faire dans cette phase

- Rien de code. La vérification visuelle appartient au mainteneur.

## À vérifier à la main

    nvm use && npm start

Puis, sur `http://localhost:4200`, connecté :

1. `/categories` → liste triée par code ; cliquer « Code » puis « Désignation » réordonne
   sans appel réseau (onglet Réseau à l'appui).
2. Créer une catégorie, puis en créer une seconde avec le même code → le message du backend
   se pose sous le champ « Code », **sans** notification en double.
3. Modifier une catégorie, puis la supprimer. Une catégorie qui porte des articles doit être
   refusée par le serveur, avec un message lisible.
4. `/articles` → pagination : changer de page, changer la taille de page (retour en page 1),
   trier sur « Prix HT ».
5. Créer un article : saisir HT 6 000 et TVA 19,25 → « Prix TTC calculé : 7 155 FCFA ».
   Enregistrer, vérifier la ligne dans la liste.
6. Modifier l'article, envoyer une photo → notification « Photo enregistrée », et le nom de
   l'objet s'affiche. L'image elle-même ne peut pas être montrée (écart backend nº 6).
7. Supprimer un article engagé dans un mouvement de stock → refus lisible du serveur.
8. Catalogue vide → l'écran propose de créer, il ne laisse pas d'impasse.

## Points bloquants / en attente de ma validation

1. **Découpage des phases 6 à 11 déduit, pas donné** (ADR-015). Le plan complet n'est pas
   dans le dépôt : la phase 6 a été ouverte sur le groupe « Catalogue » de la navigation.
   À confirmer ou à corriger.
2. **Push impossible** — `git push origin develop` est refusé par GitLab :
   « HTTP Basic: Access denied ». Jeton expiré ou mal scopé. Les phases 5 et 6 sont
   fusionnées et commitées en local seulement. Relancer `glab auth login`, puis
   `git push origin main develop`.
3. **Relecture d'ensemble** — les phases 2 à 6 ont été enchaînées sans validation
   intermédiaire.
4. **Visibilité du dépôt** — passage en public refusé : compte Maintainer (40), GitLab exige
   Owner (50).
5. **`@types/node` ajouté sans validation** (ADR-010).
6. **Périmètre du formulaire d'inscription** — champs exigés par le backend seulement.

## Écarts backend signalés, sans contournement

- Aucun schéma d'erreur publié dans `openapi.json` (ADR-004).
- `POST /auth/refresh-token` ne déclare ni corps ni paramètre alors qu'il lit
  `Authorization: Bearer <refreshToken>`.
- Une requête sans jeton renvoie `403`, pas `401` (ADR-005).
- `POST /utilisateurs/change-password` répond `401` sur un mauvais ancien mot de passe (ADR-013).
- `GET /articles` n'accepte ni recherche ni filtre : pas de champ de recherche dans l'écran.
- `GET /categories` n'est pas paginé, contrairement aux autres listes.
- Les photos s'envoient mais aucun endpoint ne permet de les relire : l'interface ne peut pas
  les afficher.

Détail dans `06-API-CONTRAT.md`, section « Écarts constatés ».
