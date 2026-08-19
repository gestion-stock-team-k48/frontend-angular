# Architecture

## Découpage

```
src/app/
├── core/                 # singletons : auth, http, config, thème, notifications
│   ├── api/generated/    # types générés depuis openapi.json — NE PAS ÉDITER À LA MAIN
│   ├── auth/             # AuthService, guards fonctionnels
│   ├── http/             # interceptors : auth, refresh, erreurs, chargement
│   └── config/           # tokens d'injection : apiBaseUrl, locale, devise
├── shared/
│   ├── ui/               # design system : bouton, champ, table, modale, toast, badge, jauge
│   ├── directives/       # permissions, formatage, autofocus
│   └── pipes/            # montant, quantité, date relative, état de commande
├── layout/               # shell : topbar, sidebar, fil d'Ariane, zone de contenu
└── features/             # un dossier par module métier, aligné sur le backend
    ├── auth/  dashboard/  articles/  categories/  clients/  fournisseurs/
    ├── commandes-client/  commandes-fournisseur/  mouvements-stock/
    └── ventes/  entreprise/  utilisateurs/  parametres/
```

## Règles de dépendance

- Chaque feature est lazy-loadée et possède ses routes, ses composants, son store de signaux
  et son service d'accès API.
- **Aucune feature n'importe une autre feature.** Les échanges passent par `core` ou `shared`.
- `shared/ui` ne contient aucune logique métier et ne consomme aucun service API. Ses
  composants reçoivent des entrées et émettent des sorties, rien d'autre.
- `core` ne dépend d'aucune feature.

Sens autorisé des dépendances : `features → shared → core`, et `features → core`.

## Configuration

`apiBaseUrl`, `locale` et le format monétaire viennent de tokens d'injection alimentés par
`environment.ts`. **Aucune URL en dur dans un service.**

En développement, `proxy.conf.json` redirige `/api` vers le backend pour éviter les problèmes
de CORS avec `ng serve`.

## Authentification

- `token` (accès, 24 h) conservé **en mémoire** dans un signal. Jamais en `localStorage`.
- `refreshToken` (7 j) conservé en `localStorage`, seule façon de survivre à un rechargement
  de page. Ce compromis et son risque XSS sont documentés dans `07-DECISIONS.md`.
- Interceptor de refresh **single-flight** : une réponse d'échec d'authentification déclenche
  un seul appel à `POST /auth/refresh-token` ; les requêtes concurrentes sont mises en file
  puis rejouées avec le nouveau jeton. L'échec du refresh provoque une déconnexion propre et
  une redirection vers la connexion avec `returnUrl`.
- `POST /auth/refresh-token` attend le jeton de rafraîchissement dans l'en-tête
  `Authorization` de la requête, pas dans un corps JSON (voir `06-API-CONTRAT.md`).
- Les rôles et l'entreprise courante viennent de `GET /utilisateurs/me`, pas du contenu du
  jeton : le profil est la source de vérité, et le jeton n'est jamais décodé côté client.

## Guards

Guards fonctionnels : `authGuard`, `roleGuard(['ROLE_ADMIN'])`, `guestGuard`.
Le rôle conditionne aussi l'affichage via la directive `*appHasRole`.

**L'interface ne remplace jamais la sécurité serveur.** Masquer un bouton n'est pas protéger
une action.

## Ordre des intercepteurs

Déclarés dans `app.config.ts` dans cet ordre : chargement, erreurs, authentification,
rafraîchissement. **L'ordre s'inverse au retour** — le premier de la liste traite la requête
en premier, mais voit l'erreur en dernier.

```
requête : chargement → erreurs → authentification → rafraîchissement → réseau
erreur  : rafraîchissement (rejoue) → erreurs (traduit) → chargement (referme)
```

Conséquence voulue : une erreur n'est traduite et notifiée qu'après l'échec du
rafraîchissement, et le compteur de chargement ne retombe qu'une fois les tentatives
épuisées.

Une requête s'exclut d'un intercepteur par un marqueur de contexte
(`SANS_JETON`, `SANS_RAFRAICHISSEMENT`, `SANS_INDICATEUR_CHARGEMENT`), jamais par un
filtrage d'URL : explicite à la lecture, et insensible aux changements de chemin.

## Gestion des erreurs

Un interceptor d'erreurs traduit la réponse d'erreur du backend en message utilisateur
français. Le backend ne renvoie **pas** de code d'exception métier exploitable : la
correspondance se fait sur le couple `status` HTTP + `message`, et sur `validationErrors`
pour les erreurs de champ. Tableau de correspondance dans `06-API-CONTRAT.md`.

## Chargement des données

`httpResource` / `resource` pour la lecture, avec états `loading` / `error` natifs exploités
directement par les composants. Les mutations passent par le service API de la feature, qui
invalide ou recharge la ressource concernée.

## Rendu

Zoneless, `OnPush` partout. Transitions de route via `withViewTransitions()`.
