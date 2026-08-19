# Contrat API

Source unique de vérité : `http://localhost:8080/api/v1/v3/api-docs`.
Ce document est un **résumé de lecture**, pas une source. En cas de divergence, la
spécification gagne. Régénérer les types avec `./scripts/sync-api.sh`.

Relevé du 2026-08-19 : `API Gestion de Stock Multi-Tenant` v1.0.0 — 41 chemins,
66 opérations, 47 schémas.

## Base et authentification

| | |
|---|---|
| Serveur déclaré | `http://localhost:8080/api/v1` |
| Schéma de sécurité | `BearerAuth` — `Authorization: Bearer <token>` |
| Obtention du jeton | `POST /auth/authenticate` → `{ token, refreshToken }` |
| Rafraîchissement | `POST /auth/refresh-token`, **sans corps** : le refresh token va dans l'en-tête `Authorization: Bearer <refreshToken>` |

## Pagination

Les listes paginées prennent un paramètre de requête `pageable` décomposé en :

| Paramètre | Type | Contrainte |
|---|---|---|
| `page` | `int32` | ≥ 0 |
| `size` | `int32` | ≥ 1 |
| `sort` | `string[]` | ex. `code,asc` |

Réponse (`PageResponse<T>`) :

```jsonc
{
  "content": [ /* T[] */ ],
  "pageNumber": 0,
  "pageSize": 20,
  "totalElements": 137,
  "totalPages": 7,
  "isLast": false
}
```

Attention : le champ est `isLast`, pas `last`. Il n'y a **pas** de `isFirst` ni de
`numberOfElements` — le composant de pagination les dérive.

## Réponse d'erreur

Forme réelle, relevée sur le backend en fonctionnement (elle n'est **pas** décrite dans la
spécification, voir « Écarts » plus bas) :

```jsonc
{
  "timestamp": "2026-08-19T11:00:43",
  "status": 400,
  "error": "Bad Request",
  "message": "Un ou plusieurs champs sont invalides. Voir 'validationErrors' pour le détail.",
  "path": "/api/v1/auth/authenticate",
  "validationErrors": {            // présent uniquement sur les erreurs de validation
    "email": "L'email est obligatoire",
    "motDePasse": "Le mot de passe est obligatoire"
  }
}
```

Il n'existe **aucun champ `code`** identifiant l'exception métier. La correspondance vers un
message utilisateur se fait donc sur `status` + `message`, et sur `validationErrors` pour
l'affichage champ par champ.

### Correspondance erreur → message utilisateur

Relevée dans `GlobalExceptionHandler` du backend, pas déduite. Toutes les règles métier
refusées remontent en `409 Conflict`, jamais en `400`.

| Statut | Exception backend | Traitement dans l'interface |
|---|---|---|
| `400` | `MethodArgumentNotValidException` — validation Bean Validation | afficher chaque entrée de `validationErrors` sous son champ ; pas de bandeau global |
| `400` | `HttpMessageNotReadableException`, `MethodArgumentTypeMismatchException` | erreur de programmation côté frontend : journaliser, message de repli générique |
| `401` | `BadCredentialsException` | « Email ou mot de passe incorrect » (message fourni par le backend) |
| `401` | `InvalidTokenException` — refresh, réinitialisation de mot de passe | déclencher le refresh single-flight ; à son échec, déconnecter avec `returnUrl` |
| `403` | `AccessDeniedException`, ou jeton absent / invalide | même traitement que `401` sur une ressource ; si le refresh réussit, rejouer la requête |
| `404` | `EntityNotFoundException` | « Cet élément n'existe plus ou n'est pas accessible » + retour à la liste |
| `409` | `DuplicateCodeException` | pointer le champ `code` du formulaire avec le `message` du backend |
| `409` | `DuplicateEmailException` | pointer le champ `email` |
| `409` | `InvalidStateTransitionException` | recharger la commande : son état a changé entre-temps ; réafficher les transitions légales |
| `409` | `StockInsuffisantException` | afficher le `message` sur la ligne de commande concernée |
| `409` | `InvalidOperationException`, `DataIntegrityViolationException` | afficher le `message` tel quel, il est rédigé en français |
| `500` | `FileStorageException` | « Le fichier n'a pas pu être enregistré. Réessayer, ou choisir un autre fichier. » |
| `503` | `EmailDeliveryException` | « L'email n'a pas pu être envoyé. Le compte est créé, réessayer l'envoi plus tard. » |
| `5xx` / réseau | indisponibilité | « Le serveur n'a pas répondu. Réessayer dans un instant. » + action de relance |

Les `message` renvoyés par le backend sont **déjà rédigés en français**. L'interface les
affiche tels quels plutôt que de les réécrire, sauf pour les cas techniques (`400` illisible,
`5xx`) où un message de repli est utilisé.

## Endpoints

### Authentification

| Méthode | Chemin | Rôle |
|---|---|---|
| `POST` | `/auth/authenticate` | S'authentifier |
| `POST` | `/auth/forgot-password` | Mot de passe oublié |
| `POST` | `/auth/refresh-token` | Rafraîchir le token |
| `POST` | `/auth/register` | Inscrire une entreprise |
| `POST` | `/auth/reset-password` | Réinitialiser le mot de passe |

### Tableau de bord

| Méthode | Chemin | Rôle |
|---|---|---|
| `GET` | `/dashboard/statistiques` | Statistiques du tableau de bord |

### Articles

| Méthode | Chemin | Rôle |
|---|---|---|
| `GET` | `/articles` | Lister les articles |
| `POST` | `/articles` | Créer un article |
| `DELETE` | `/articles/{id}` | Supprimer un article |
| `GET` | `/articles/{id}` | Récupérer un article |
| `PUT` | `/articles/{id}` | Modifier un article |
| `POST` | `/articles/{id}/photo` | Uploader la photo d'un article |

### Catégories

| Méthode | Chemin | Rôle |
|---|---|---|
| `GET` | `/categories` | Lister les catégories |
| `POST` | `/categories` | Créer une catégorie |
| `DELETE` | `/categories/{id}` | Supprimer une catégorie |
| `GET` | `/categories/{id}` | Récupérer une catégorie |
| `PUT` | `/categories/{id}` | Modifier une catégorie |

### Clients

| Méthode | Chemin | Rôle |
|---|---|---|
| `GET` | `/clients` | Lister les clients |
| `POST` | `/clients` | Créer un client |
| `DELETE` | `/clients/{id}` | Supprimer un client |
| `GET` | `/clients/{id}` | Récupérer un client |
| `PUT` | `/clients/{id}` | Modifier un client |
| `POST` | `/clients/{id}/photo` | Uploader la photo d'un client |

### Fournisseurs

| Méthode | Chemin | Rôle |
|---|---|---|
| `GET` | `/fournisseurs` | Lister les fournisseurs |
| `POST` | `/fournisseurs` | Créer un fournisseur |
| `DELETE` | `/fournisseurs/{id}` | Supprimer un fournisseur |
| `GET` | `/fournisseurs/{id}` | Récupérer un fournisseur |
| `PUT` | `/fournisseurs/{id}` | Modifier un fournisseur |
| `POST` | `/fournisseurs/{id}/photo` | Uploader la photo d'un fournisseur |

### Commandes Client

| Méthode | Chemin | Rôle |
|---|---|---|
| `GET` | `/commandes-client` | Lister les commandes client |
| `POST` | `/commandes-client` | Créer une commande client |
| `GET` | `/commandes-client/client/{idClient}` | Historique des commandes d'un client |
| `DELETE` | `/commandes-client/{id}` | Supprimer une commande client |
| `GET` | `/commandes-client/{id}` | Récupérer une commande client |
| `PUT` | `/commandes-client/{id}` | Modifier une commande client |
| `PATCH` | `/commandes-client/{id}/etat` | Changer l'état d'une commande client |

### Commandes Fournisseur

| Méthode | Chemin | Rôle |
|---|---|---|
| `GET` | `/commandes-fournisseur` | Lister les commandes fournisseur |
| `POST` | `/commandes-fournisseur` | Créer une commande fournisseur |
| `GET` | `/commandes-fournisseur/fournisseur/{idFournisseur}` | Historique des commandes d'un fournisseur |
| `DELETE` | `/commandes-fournisseur/{id}` | Supprimer une commande fournisseur |
| `GET` | `/commandes-fournisseur/{id}` | Récupérer une commande fournisseur |
| `PUT` | `/commandes-fournisseur/{id}` | Modifier une commande fournisseur |
| `PATCH` | `/commandes-fournisseur/{id}/etat` | Changer l'état d'une commande fournisseur |

### Ventes

| Méthode | Chemin | Rôle |
|---|---|---|
| `GET` | `/ventes` | Lister les ventes |
| `POST` | `/ventes` | Créer une vente |
| `GET` | `/ventes/code/{code}` | Récupérer une vente par code |
| `DELETE` | `/ventes/{id}` | Supprimer une vente |
| `GET` | `/ventes/{id}` | Récupérer une vente |

### Utilisateurs

| Méthode | Chemin | Rôle |
|---|---|---|
| `GET` | `/utilisateurs` | Lister les utilisateurs |
| `POST` | `/utilisateurs` | Créer un utilisateur |
| `POST` | `/utilisateurs/change-password` | Changer son mot de passe |
| `GET` | `/utilisateurs/me` | Récupérer mon profil |
| `PUT` | `/utilisateurs/me` | Modifier mon profil |
| `DELETE` | `/utilisateurs/{id}` | Supprimer un utilisateur |
| `GET` | `/utilisateurs/{id}` | Récupérer un utilisateur |
| `PUT` | `/utilisateurs/{id}` | Modifier un utilisateur |
| `POST` | `/utilisateurs/{id}/photo` | Uploader la photo d'un utilisateur |

### Entreprise

| Méthode | Chemin | Rôle |
|---|---|---|
| `GET` | `/entreprises/me` | Récupérer mon entreprise |
| `PUT` | `/entreprises/me` | Modifier mon entreprise |

### Mouvements de stock

| Méthode | Chemin | Rôle |
|---|---|---|
| `GET` | `/mouvements-stock/alertes-stock` | Articles en alerte de stock |
| `GET` | `/mouvements-stock/article/{idArticle}` | Historique des mouvements d'un article |
| `GET` | `/mouvements-stock/article/{idArticle}/stock-reel` | Stock réel d'un article |
| `POST` | `/mouvements-stock/correction-negative` | Enregistrer une correction négative de stock |
| `POST` | `/mouvements-stock/correction-positive` | Enregistrer une correction positive de stock |
| `POST` | `/mouvements-stock/entree` | Enregistrer une entrée de stock |
| `POST` | `/mouvements-stock/sortie` | Enregistrer une sortie de stock |

## Écarts constatés dans la spécification

À signaler au mainteneur du backend. Aucun contournement côté frontend.

1. **Aucun schéma d'erreur n'est publié.** Les réponses `400` / `401` / `403` / `404` sont
   typées avec le schéma de succès de l'opération (`PageResponseArticleResponse` pour un
   `401` sur `GET /articles`, par exemple). La forme réelle documentée plus haut a été
   relevée en interrogeant le backend, pas lue dans la spécification. Conséquence : les types
   générés par `openapi-typescript` sont inutilisables pour les erreurs ; le type de la
   réponse d'erreur est déclaré à la main dans `core/http`, ce qui constitue l'unique
   exception documentée à l'interdiction d'écrire un DTO à la main.

2. **`POST /auth/refresh-token` ne déclare ni corps ni paramètre.** L'implémentation lit
   `Authorization: Bearer <refreshToken>`. Impossible à deviner depuis la seule spécification.

3. **Absence de jeton en réponse de `403`.** Une requête sans `Authorization` sur
   `GET /articles` renvoie `403`, pas `401`. L'interceptor de refresh doit donc se déclencher
   sur `403` autant que sur `401`, ce qui est contre-intuitif et mérite d'être confirmé.

4. **`Pageable` est déclaré `required: true`** en paramètre de requête sur les listes, alors
   que Spring applique des valeurs par défaut si le paramètre est absent. Le frontend envoie
   toujours `page` et `size` explicitement, ce qui évite la question.
