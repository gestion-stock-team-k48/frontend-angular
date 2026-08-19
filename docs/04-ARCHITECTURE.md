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
│   ├── formulaires/      # répartition des erreurs serveur entre champs et bandeau
│   ├── commerce/         # états, lignes, liste et écran communs aux deux types de commandes
│   ├── tiers/            # liste et formulaire communs aux clients et aux fournisseurs
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

## Listes et pagination

`core/api/pagination.ts` porte la conversion entre l'enveloppe du backend et ce qu'un écran
affiche : `page` et `size` toujours envoyés explicitement, `sort` au format `champ,sens`,
`premiere` et `nombreElements` dérivés — le backend ne les renvoie pas. Le type de
l'enveloppe est déduit du schéma généré, jamais réécrit à la main.

`shared/ui/tableau` tient la structure et l'accessibilité d'un tableau : en-têtes, état de
tri annoncé par `aria-sort`, lignes de chargement, place réservée à l'état vide. Il ne
connaît ni les données ni l'API — les lignes sont projetées par l'écran, seul à savoir ce
qu'une ligne contient. `shared/ui/pagination` compte les pages à partir de 1 pour le lecteur,
là où le backend compte à partir de 0.

Une notification globale est supprimée par le marqueur `SANS_NOTIFICATION_ERREUR` sur les
requêtes dont l'écran affiche déjà l'erreur — un formulaire n'a pas besoin d'écrire deux fois
le même refus.

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

## Stock

Le stock réel est calculé par le backend à partir des mouvements. L'interface ne le recalcule
jamais : elle l'affiche, et le redemande après chaque écriture. La jauge de seuil compare ce
stock au seuil de l'article, chaque ligne étant mesurée par rapport à son propre seuil.

Les quatre opérations — entrée, sortie, correction positive, correction négative — sont
quatre endpoints distincts. Le sens vit dans l'URL appelée, jamais dans le signe de la
quantité, qui reste toujours positive. La source accompagne une entrée ou une sortie ; le
motif, obligatoire côté serveur, accompagne une correction.

Faute de liste globale des mouvements côté backend, la section s'ouvre sur le choix d'un
article (ADR-017).

## Tiers

Clients et fournisseurs se décrivent avec les mêmes champs et les mêmes contraintes. Leur
liste et leur formulaire sont donc écrits une fois, dans `shared/tiers`, et reçoivent ce qui
les distingue : libellés, chemin, endpoint, et la fonction à appeler pour enregistrer ou
supprimer. Aucune URL n'y est construite (ADR-018).

Les champs facultatifs laissés vides sont omis de la requête plutôt qu'envoyés en chaîne
vide : une adresse absente n'est pas une adresse vide.

## Commerce

Les transitions d'état d'une commande sont déclarées une fois, dans `shared/commerce` :
`EN_PREPARATION → VALIDEE | ANNULEE`, `VALIDEE → LIVREE | ANNULEE`, et rien après. L'écran ne
propose que ces transitions ; le serveur refuse les autres.

Marquer une commande livrée déclenche ses mouvements de stock côté serveur — une sortie pour
une commande client, une entrée pour une commande fournisseur. Un refus, stock insuffisant
compris, recharge l'écran sur l'état réel plutôt que de laisser une vue périmée.

Commandes client et commandes fournisseur partagent leur liste et leur écran ; chaque module
traduit son DTO vers `CommandeVue` et retour (ADR-019). Une commande ne se modifie que tant
qu'elle est en préparation.

Une vente, elle, s'écrit une fois pour toutes : le serveur sort aussitôt les articles du
stock, n'expose aucune modification et refuse toute suppression. L'écran l'annonce avant la
saisie, et ne propose ensuite ni l'une ni l'autre.

## Comptes et entreprise

Créer un compte ne demande aucun mot de passe : le serveur en génère un temporaire, l'envoie
par email et exige son remplacement à la première connexion — `gardeMotDePasse` s'en charge
côté navigation. La liste des utilisateurs signale les comptes encore dans cet état.

« Mon profil » (`/profil`) est ouvert à tous ; l'email et les rôles y sont en lecture seule,
`PUT /utilisateurs/me` ne les acceptant pas. C'est aussi le seul endroit où une photo
s'envoie, le backend refusant celle d'autrui (ADR-020).

L'entreprise n'existe qu'au singulier : `GET` et `PUT /entreprises/me`, sans liste ni
création — une entreprise naît de l'inscription.

## Tableau de bord

`GET /dashboard/statistiques` porte les chiffres — chiffre d'affaires, commandes par état,
articles les plus vendus. Rien n'y est recalculé côté navigateur : la seule opération faite
sur place est la mise à l'échelle des barres du classement, qui est de l'affichage.

Les alertes de seuil y sont reprises parce que ce sont les seules données auxquelles il faut
réagir le jour même. Cinq articles sont détaillés, le reste est compté et renvoie à l'écran
des alertes.

La racine de l'application mène à cet écran.

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
