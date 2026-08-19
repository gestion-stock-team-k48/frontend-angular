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
- `core/auth` porte l'ensemble des appels qui touchent aux identifiants : authentification,
  inscription, rafraîchissement, mot de passe oublié, réinitialisation et changement de mot
  de passe. Les écrans de `features/auth` n'ont pas de service d'accès API propre — leur
  seul interlocuteur est `ServiceAuthentification`.
- La session est restaurée par un `provideAppInitializer` avant le premier affichage. Sans
  cette étape, les gardes trancheraient sur une session qu'elles croiraient fermée. L'échec
  est absorbé : l'application démarre alors déconnectée, jamais bloquée.
- `POST /utilisateurs/change-password` est exclu du rafraîchissement : un `401` y signifie
  « ancien mot de passe incorrect » (ADR-013).

## Guards

Gardes fonctionnelles : `gardeAuthentification`, `gardeRole('ROLE_ADMIN')`, `gardeInvite`,
`gardeMotDePasse`. Le rôle conditionne aussi l'affichage dans la navigation.

`gardeMotDePasse` retient tout compte dont le profil déclare encore `mustChangePassword` :
l'administrateur qui crée un utilisateur lui attribue un mot de passe généré, transmis par
email. Elle est posée en `canActivateChild` du shell, donc relue à chaque changement d'écran,
et jamais sur `/changer-mot-de-passe`, qui est la sortie.

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

## Écrans d'authentification

Connexion, inscription, mot de passe oublié, réinitialisation et changement de mot de passe
vivent hors du shell, sous une coquille à eux : ni navigation, ni fil d'Ariane. Leurs routes
sont déclarées avant celle du shell — ce dernier attrape tout le reste par sa route
générique — et sont importées statiquement dans `app.routes.ts` (ADR-014).

Les erreurs de validation renvoyées par le backend sont réparties par `erreurs-formulaire.ts`
entre les champs qu'elles nomment et un bandeau d'ensemble. Quand tout a trouvé sa place, il
n'y a pas de bandeau : répéter en haut d'écran ce qui est écrit sous chaque champ double le
bruit sans rien ajouter.

Le `returnUrl` porté par l'URL est filtré : seuls les chemins internes sont suivis. Une
adresse absolue, ou relative au protocole, renverrait l'utilisateur vers un site tiers juste
après la saisie de son mot de passe.

## Shell applicatif

`layout/shell` porte la coquille : `Topbar`, `Sidebar`, `FilAriane`, zone de contenu. Toutes
les routes de l'application sont ses enfants, y compris la page 403 et la page 404 — seuls
les écrans d'authentification vivent en dehors.

La structure de la navigation est déclarée une seule fois, dans `layout/navigation.ts` :
libellé métier, chemin, rôle requis, et un drapeau `disponible`. Une entrée dont l'écran
n'existe pas encore reste affichée mais inerte — masquer la moitié du menu donnerait une
fausse idée du périmètre. Une entrée réservée à un rôle disparaît pour qui ne l'a pas.

Le fil d'Ariane se construit depuis l'URL, en reprenant les libellés de `navigation.ts`
quand ils existent, et en adoucissant les autres segments.

Sur écran étroit, la navigation devient un tiroir posé au-dessus du contenu, avec un voile
qui la referme au clic.

## Rendu

Zoneless, `OnPush` partout. Transitions de route via `withViewTransitions()`, réduites à un
fondu court. `withInMemoryScrolling` remet en haut à chaque changement d'écran et restaure
la position au retour arrière.
