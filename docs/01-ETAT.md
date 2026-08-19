# État courant

- Dernière mise à jour : 2026-08-19 — session 1
- Phase en cours : 8 · Tiers — terminée, en attente de vérification visuelle
- Branche de travail : feat/clients-fournisseurs
- Dernier commit : 3dbb3f9 — feat(layout): open the third-party entries in the navigation
- Backend requis démarré : oui — `http://localhost:8080/api/v1`
- Prochaine action précise : vérifier les écrans clients et fournisseurs à la main (voir
  « À vérifier »), puis fusionner dans `develop` et ouvrir la phase 9 · Commerce.

## Fait dans cette phase

- `shared/tiers` : liste et formulaire communs aux clients et aux fournisseurs, sans aucune
  URL ni service d'API — l'écran hôte passe ce qu'il faut appeler (ADR-018).
- Clients : liste paginée et triée, création, modification, suppression, envoi de photo.
- Fournisseurs : les mêmes, sur leur propre endpoint.
- Champs facultatifs vides omis de la requête plutôt qu'envoyés en chaîne vide.
- Entrées « Clients » et « Fournisseurs » ouvertes dans la navigation.
- 174 tests.

## Reste à faire dans cette phase

- Rien de code. La vérification visuelle appartient au mainteneur.

## À vérifier à la main

    nvm use && npm start

Puis, sur `http://localhost:4200`, connecté :

1. `/clients` → liste triée par nom ; trier sur « Email », changer de page, changer la taille.
2. Créer un client avec le nom, le prénom et l'email seuls → la requête ne contient que ces
   trois champs (onglet Réseau), pas de chaînes vides.
3. Créer un second client avec le même email → le message du backend se pose sous « Email »,
   sans notification en double.
4. Modifier un client, envoyer une photo → « Photo enregistrée » et le nom de l'objet
   s'affiche. L'image ne peut pas être montrée (écart backend nº 6).
5. Supprimer un client → confirmation, puis la liste se recharge. Un client engagé dans une
   commande doit être refusé par le serveur, avec un message lisible.
6. `/fournisseurs` → mêmes vérifications ; les deux écrans se comportent à l'identique.
7. Liste vide → l'écran propose de créer, il ne laisse pas d'impasse.

## Points bloquants / en attente de ma validation

1. **Découpage des phases 6 à 11 déduit, pas donné** (ADR-015). À confirmer ou corriger.
2. **Push impossible** — `git push` refusé par GitLab : « HTTP Basic: Access denied ».
   Les phases 5 à 8 sont commitées en local seulement. Relancer `glab auth login`, puis
   `git push origin main develop`.
3. **Relecture d'ensemble** — les phases 2 à 8 ont été enchaînées sans validation
   intermédiaire.
4. **Partage entre clients et fournisseurs** (ADR-018) — écrans mis en commun parce que les
   DTO sont identiques. À confirmer, ou à défaire si les deux modules doivent diverger.
5. **Visibilité du dépôt** — passage en public refusé : rôle Maintainer, GitLab exige Owner.
6. **`@types/node` ajouté sans validation** (ADR-010).

## Écarts backend signalés, sans contournement

- Aucun schéma d'erreur publié dans `openapi.json` (ADR-004).
- `POST /auth/refresh-token` ne déclare ni corps ni paramètre alors qu'il lit
  `Authorization: Bearer <refreshToken>`.
- Une requête sans jeton renvoie `403`, pas `401` (ADR-005).
- `POST /utilisateurs/change-password` répond `401` sur un mauvais ancien mot de passe (ADR-013).
- `GET /articles` n'accepte ni recherche ni filtre. Les listes de tiers non plus.
- `GET /categories` n'est pas paginé.
- Les photos s'envoient mais aucun endpoint ne permet de les relire.
- Aucune liste globale des mouvements de stock : lecture article par article (ADR-017).
- L'historique d'un article ignore le tri demandé.
- `GET /mouvements-stock/alertes-stock` recalcule le stock de tout le catalogue, sans pagination.

Détail dans `06-API-CONTRAT.md`, section « Écarts constatés ».
