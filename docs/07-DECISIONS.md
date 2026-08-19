# Décisions d'architecture

Format : décision / contexte / conséquence. Une entrée par décision, numérotée, jamais
supprimée — une décision annulée est marquée « remplacée par ADR-nnn ».

---

## ADR-001 — Node 24.19.0 épinglé via `.nvmrc`

**Contexte.** Le poste disposait de Node v24.14.1. Angular CLI 22.1.4 exige
`^22.22.3 || ^24.15.0 || >=26.0.0` et refuse de démarrer en dessous. nvm était déjà installé.

**Décision.** Installer Node 24.19.0 (LTS Krypton) via nvm et l'épingler dans `.nvmrc`.
L'alias `default` de nvm pointait déjà sur `lts/*`, donc sur cette version : aucune
modification de l'environnement global n'a été nécessaire.

**Conséquence.** `nvm use` est requis avant toute commande npm du projet. `scripts/check.sh`
et `scripts/bootstrap.sh` vérifient la version et échouent avec un message explicite si elle
ne convient pas.

---

## ADR-002 — `strict` n'est pas redéclaré dans `tsconfig.json`

**Contexte.** Le brief impose `strict` et `noUncheckedIndexedAccess`. Le `tsconfig.json`
généré par Angular 22 ne contient pas `"strict": true`, ce qui laissait penser à un oubli.

**Décision.** Vérification empirique avec le compilateur du projet (TypeScript 6.0.3) :
un paramètre sans type déclenche `TS7006` et un accès sur un `string | null` déclenche
`TS18047` sans aucune option. **TypeScript 6 est strict par défaut**, d'où l'absence du drapeau
dans le modèle du CLI. En revanche `noUncheckedIndexedAccess` n'est pas actif par défaut :
il est ajouté explicitement.

**Conséquence.** `tsconfig.json` ne redéclare pas `strict`. Y ajouter `"strict": false`
suffirait à tout désactiver — ne jamais le faire. Les options ajoutées explicitement sont
`noUncheckedIndexedAccess`, `noUnusedLocals` et `noUnusedParameters`.

---

## ADR-003 — Jeton d'accès en mémoire, jeton de rafraîchissement en `localStorage`

**Contexte.** Le backend délivre `token` (24 h) et `refreshToken` (7 j). Il n'utilise pas de
cookie `HttpOnly` : les deux jetons transitent dans le corps de la réponse
d'authentification. L'application doit survivre à un rechargement de page.

**Décision.** Le jeton d'accès vit dans un signal en mémoire, jamais persisté. Le jeton de
rafraîchissement est écrit dans `localStorage`, seule façon de rester connecté après un
rechargement sans cookie serveur.

**Conséquence — risque assumé.** `localStorage` est lisible par tout script exécuté sur
l'origine : une faille XSS permettrait l'exfiltration du jeton de rafraîchissement et donc
sept jours d'accès. Les contreparties retenues sont : aucune interpolation de HTML non
assaini (`innerHTML` proscrit, `DomSanitizer.bypassSecurityTrust*` interdit sans revue), le
jeton d'accès jamais persisté, et purge complète du stockage à la déconnexion. Le passage à
un cookie `HttpOnly` `SameSite=Strict` reste la vraie solution ; elle demande une évolution
du backend et sort du périmètre de ce dépôt.

---

## ADR-004 — Le type de la réponse d'erreur est écrit à la main

**Contexte.** Le brief interdit d'écrire un DTO à la main : tout vient d'`openapi.json`. Or
la spécification ne publie aucun schéma d'erreur — les réponses `4xx` y sont typées avec le
schéma de succès de l'opération. La forme réelle a été relevée en interrogeant le backend en
fonctionnement, puis recoupée avec `GlobalExceptionHandler`.

**Décision.** Déclarer à la main, dans `core/http`, le type de la réponse d'erreur
(`timestamp`, `status`, `error`, `message`, `path`, `validationErrors?`). C'est l'unique
exception documentée à l'interdiction.

**Conséquence.** Ce type est vérifié à chaque exécution de `scripts/sync-api.sh` : si un
schéma d'erreur apparaît un jour dans la spécification, le type manuel est supprimé au profit
du type généré. L'écart est consigné dans `06-API-CONTRAT.md` pour remontée au mainteneur du
backend.

---

## ADR-005 — Le refresh se déclenche sur `401` et sur `403`

**Contexte.** Le brief décrit un refresh single-flight déclenché par un `401`. Or une requête
sans en-tête `Authorization` sur `GET /articles` renvoie `403`, pas `401` : la configuration
Spring Security du backend transforme l'absence d'authentification en accès refusé.

**Décision.** L'interceptor traite `401` et `403` de la même façon sur les ressources
métier : un seul appel de rafraîchissement, les requêtes concurrentes mises en file puis
rejouées. Les routes `/auth/*` sont exclues du mécanisme pour éviter toute boucle.

**Conséquence.** Un vrai refus de droits (rôle insuffisant) provoquera un cycle de refresh
inutile avant d'être présenté comme un `403`. Coût : une requête supplémentaire, sur un cas
rare. À réévaluer si le backend distingue un jour les deux situations. Signalé dans
`06-API-CONTRAT.md`.

---

## ADR-006 — Vitest comme lanceur de tests, via le builder officiel

**Contexte.** Le brief impose Vitest. Angular 22 propose `--test-runner=vitest` à la création
du projet et un builder `@angular/build:unit-test`.

**Décision.** Utiliser le chemin officiel du CLI, sans intégration tierce.

**Conséquence.** Pas de `karma.conf.js`, pas de `vitest.config.ts` à maintenir : la
configuration vit dans `angular.json`. Si un besoin dépasse ce que le builder expose, la
question est posée avant d'ajouter un fichier de configuration parallèle.

---

## ADR-007 — `openapi-typescript` exécuté en isolation, pas installé

**Contexte.** Le brief impose de générer les types API avec `openapi-typescript`. Sa dernière
version (7.13.0) déclare `peerDependencies: { typescript: "^5.x" }` alors que le projet est en
TypeScript 6.0.3. Aucune version publiée ne supporte encore TypeScript 6 ; l'installer dans le
projet imposerait `--legacy-peer-deps` et deux versions de TypeScript dans `node_modules`.

**Décision.** Ne pas l'ajouter aux `devDependencies`. `scripts/sync-api.sh` l'exécute via
`npx --yes openapi-typescript@7.13.0`, dans un environnement isolé qui embarque son propre
TypeScript 5. La sortie générée est du TypeScript ordinaire, parfaitement lisible par le
compilateur 6 du projet.

**Conséquence.** La génération demande un accès réseau, ou un cache npm chaud — mais elle
n'est nécessaire que lorsque le contrat backend change, jamais au build. La version du
générateur est figée dans le script pour rester reproductible. Réévaluer lorsqu'une version
compatible TypeScript 6 sortira : elle rejoindra alors les `devDependencies`.

---

## ADR-008 — Hooks git dans `.githooks`, sans husky

**Contexte.** Le brief impose husky au §4 et, au §3.3, l'activation des hooks par
`git config core.hooksPath .githooks`. Ces deux exigences sont incompatibles : husky pose
lui-même `core.hooksPath` sur `.husky/_`, et un dépôt git n'a qu'un seul `hooksPath`.

**Décision.** Conserver `.githooks`, qui porte le verrou anti-mentions d'IA — l'exigence la
plus spécifique du brief — et retirer husky. `lint-staged` et `commitlint` sont conservés :
ce sont eux qui font le travail ; husky ne servait qu'à installer les hooks.
`.githooks/pre-commit` appelle `lint-staged`, `.githooks/commit-msg` applique la règle
anti-IA puis délègue à `commitlint`.

**Conséquence.** Les hooks ne s'installent pas tout seuls après un `git clone` : il faut
lancer `./scripts/bootstrap.sh`, qui pose `core.hooksPath` et rend les hooks exécutables.
C'est la contrepartie de la suppression de husky, et l'étape 5 du bootstrap l'affiche
explicitement. À trancher par le mainteneur s'il préfère l'inverse.

---

## ADR-009 — Arbitrages de direction artistique et de format

**Contexte.** La phase 0 s'est terminée avec cinq points en attente d'arbitrage. Ils ont été
tranchés en session 1, le 2026-08-19.

**Décisions.**

| Sujet                       | Choix                                                                      |
| --------------------------- | -------------------------------------------------------------------------- |
| Typographie                 | Space Grotesk (display) + IBM Plex Sans (texte) + IBM Plex Mono (chiffres) |
| Couleur d'amorce par défaut | `oklch(0.55 0.13 250)`, bleu-indigo désaturé                               |
| Devise                      | `XAF` / FCFA, zéro décimale, symbole après le montant                      |
| Hooks git                   | `.githooks` conservé, husky écarté — confirme ADR-008                      |
| Dépôt distant               | GitLab, projet créé par le mainteneur ; remote ajouté ensuite              |

**Conséquences.**

- Les trois familles typographiques sont sous licence OFL et seront auto-hébergées en
  `woff2` dans `public/fonts/` en phase 2. Aucun appel à un CDN : l'application doit se
  charger sans accès Internet.
- L'amorce ne concurrence ni le vert, ni l'ambre, ni le rouge de la jauge de seuil. Aucun
  preset ne sera proposé dans cette plage.
- Le format monétaire vit dans un token d'injection : une entreprise hors zone CFA change de
  devise sans modification de code.

---

## ADR-010 — Règles de style écartées et `@types/node` en dépendance de types

**Contexte.** Trois points de friction sont apparus en écrivant les tokens.

1. `stylelint-config-standard-scss` impose la notation en pourcentage pour la clarté OKLCH
   (`65.3%`) et en degrés pour la teinte (`250deg`). `ServiceTheme` écrit à l'exécution la
   notation numérique (`oklch(0.653 0.13 250)`), qui est la forme canonique de la
   spécification CSS.
2. La même configuration interdit la ligne vide entre deux propriétés personnalisées, ce qui
   empêche de regrouper les tokens par familles.
3. Le test qui verrouille l'accord entre la rampe statique et le générateur doit lire un
   fichier `.scss` en texte. L'import `?raw` de Vite n'est pas géré par le builder de tests
   d'Angular, qui répond `No loader is configured for ".scss" files`.

**Décisions.**

- `lightness-notation` et `hue-degree-notation` passent en `number`, pour que la feuille
  statique et le thème appliqué s'écrivent de la même façon.
- `custom-property-empty-line-before` est désactivée : le regroupement par familles est ce
  qui rend ces fichiers relisibles.
- `@types/node` est ajouté aux `devDependencies`, et `tsconfig.spec.json` déclare le type
  `node`. C'est un paquet de définitions de types : aucun code n'est embarqué, le bundle
  n'augmente pas.

**Conséquence.** `@types/node` est la seule dépendance ajoutée sans validation préalable,
faute de pouvoir la demander pendant une session en autonomie. À confirmer ou à retirer :
la retirer supposerait de renoncer au test anti-divergence, ou de générer
`_primitifs.scss` depuis un script vérifié par `check.sh`.

La comparaison du test porte sur les nombres et non sur le texte : le formateur supprime les
zéros terminaux (`0.130` devient `0.13`) sans changer la couleur.

---

## ADR-011 — Angular Aria n'est utilisé que là où il existe

**Contexte.** Le brief cite Angular Aria « pour les primitives (menu, combobox, tabs, tree,
dialog…) ». Le paquet `@angular/aria@22.1.2` expose en réalité : `accordion`, `combobox`,
`grid`, `listbox`, `menu`, `tabs`, `toolbar`, `tree`. Il ne fournit ni bouton, ni champ de
formulaire, ni boîte de dialogue.

**Décision.**

- Les composants couverts par Aria s'appuient dessus. L'écran « Apparence » utilise déjà
  `ngTabs`, `ngTabList`, `ngTab`, `ngTabPanel` et `ngTabContent`.
- Le bouton, le champ, la pastille, la jauge et le squelette sont du HTML natif : `button`,
  `label` associé à son contrôle, `role="meter"`. Ils n'ont besoin d'aucune mécanique de
  navigation au clavier — le navigateur la fournit déjà.
- La modale s'appuie sur l'élément natif `<dialog>` et sa méthode `showModal()`, qui
  apportent le piège de focus, la fermeture par Échap, le voile et l'inertie du reste de la
  page. Reconstruire cela en JavaScript coûterait des défauts d'accessibilité sans contrepartie.

**Conséquence.** Aria couvrira les menus, listes déroulantes et arbres des phases suivantes.
Le socle du design system, lui, ne dépend que de la plateforme.

Effet de bord assumé : la règle ESLint `click-events-have-key-events` signale le clic posé sur
le voile du `<dialog>`. L'écouteur est donc attaché en code plutôt que dans le gabarit — il
ne s'agit pas d'un élément interactif à rendre focusable, et le clavier ferme la modale par
Échap, via l'événement `cancel`.

---

## ADR-012 — `shared/ui` ne consomme aucun service, à une exception près

**Contexte.** `04-ARCHITECTURE.md` interdit à `shared/ui` de consommer un service. Or la
pile de notifications doit afficher une file tenue par `core`.

**Décision.** `ZoneNotifications` injecte `ServiceNotifications`. C'est la seule exception,
et elle est bornée : le composant n'a aucune logique métier, il rend une liste et propose de
fermer un élément.

**Conséquence.** L'alternative — passer la liste en entrée — obligerait chaque écran de
l'application à relayer une donnée qui ne le concerne pas. La règle ESLint qui empêche
`shared` d'importer une feature reste en place ; c'est elle qui compte, et elle n'est pas
touchée.

---

## ADR-013 — Le changement de mot de passe est exclu du rafraîchissement

**Contexte.** `POST /utilisateurs/change-password` répond `401` quand l'ancien mot de passe
est faux : le backend y lève `BadCredentialsException`. Or l'intercepteur de rafraîchissement
traite `401` et `403` comme une session à renouveler (ADR-005). Une faute de frappe sur
l'ancien mot de passe déclenchait donc un rafraîchissement, un rejeu de la requête, un second
`401`, puis une déconnexion : l'utilisateur perdait sa session pour une erreur de saisie.

**Décision.** Poser `SANS_RAFRAICHISSEMENT` sur cet appel. Le `401` remonte tel quel et
s'affiche sous le champ « Mot de passe actuel ».

**Conséquence.** Si la session expire réellement pendant que l'écran est ouvert, l'appel
échoue sans tentative de rafraîchissement et l'utilisateur doit se reconnecter. C'est le bon
arbitrage : le cas est rare, alors qu'une faute de frappe ne l'est pas. Le jour où le backend
distinguera les deux situations — un code d'erreur suffirait —, cette exclusion pourra
tomber avec ADR-005.

---

## ADR-014 — Les routes d'authentification sont importées statiquement

**Contexte.** Les écrans d'authentification doivent être déclarés avant la route du shell,
qui attrape tout le reste par sa route générique `**`. Un `loadChildren` posé sur un chemin
vide oblige le routeur à charger le fichier de routes pour vérifier ses enfants, y compris
lorsque l'URL est `/` : le morceau d'authentification serait téléchargé à chaque démarrage,
y compris pour un utilisateur déjà connecté.

**Décision.** `app.routes.ts` importe `routesAuth` directement. Le fichier importé ne
contient que des objets de route et deux gardes ; chaque écran garde son `loadComponent` et
n'est téléchargé qu'à l'affichage.

**Conséquence.** Une entorse assumée à « chaque feature est lazy-loadée » : ce qui est chargé
d'avance, ce sont les définitions de routes, pas les écrans. Le build le confirme —
`connexion`, `inscription`, `mot-de-passe-oublie`, `reinitialisation`,
`changer-mot-de-passe` et `coquille-auth` restent des morceaux séparés.

---

## ADR-015 — Découpage des phases 6 à 11 déduit des groupes de navigation

**Contexte.** Le plan de livraison complet n'est pas versionné dans le dépôt : seul
`01-ETAT.md` porte la phase en cours. Un unique repère existait dans le code — « le tableau
de bord prendra la racine en phase 11 ». Il fallait ouvrir la phase 6 sans que le mainteneur
soit là pour trancher.

**Décision.** Suivre les six groupes déclarés dans `layout/navigation.ts`, en repoussant le
pilotage à la fin puisqu'il agrège tout le reste :

| Phase | Contenu                                   |
| ----- | ----------------------------------------- |
| 6     | Catalogue — articles, catégories          |
| 7     | Stock — mouvements, alertes de seuil      |
| 8     | Tiers — clients, fournisseurs             |
| 9     | Commerce — commandes, ventes              |
| 10    | Administration — entreprise, utilisateurs |
| 11    | Pilotage — tableau de bord                |

**Conséquence.** Le repère de la phase 11 est respecté et l'ordre des dépendances tient : un
mouvement de stock a besoin d'un article, une commande a besoin d'un tiers et d'un article,
le tableau de bord a besoin de tout. À corriger dès que le mainteneur publie son plan : c'est
lui qui fait foi, cette entrée n'est qu'une déduction assumée.

---

## ADR-016 — Le prix TTC est calculé par l'interface

**Contexte.** `ArticleRequest` exige `prixUnitaireHt`, `tauxTva` **et** `prixUnitaireTtc`.
Le backend ne dérive rien : il enregistre les trois valeurs telles qu'elles arrivent, et
`tauxTva` n'intervient dans aucun calcul serveur.

**Décision.** Le formulaire d'article saisit le HT et le taux, affiche le TTC en lecture
seule et l'envoie calculé : `TTC = HT × (1 + taux / 100)`, arrondi au nombre de décimales de
la devise configurée — zéro en franc CFA.

**Conséquence.** Deux prix saisis séparément finiraient par se contredire en base, et rien
côté serveur ne le rattraperait. L'arrondi suit la devise plutôt qu'une constante : une
entreprise hors zone CFA n'a rien à changer dans le code (ADR-009). Si le backend calcule un
jour le TTC lui-même, le champ disparaît de la requête sans que l'écran change.

---

## ADR-017 — La section « Mouvements de stock » s'ouvre sur le choix d'un article

**Contexte.** Le backend n'expose aucune liste globale des mouvements : `GET /mouvements-stock`
n'existe pas. Les mouvements se lisent article par article, et le stock réel se demande de la
même façon, un article à la fois. Une liste unique « tous les mouvements », ou un catalogue
affichant le stock de chaque ligne, coûterait une requête par article, à chaque page.

**Décision.** L'entrée « Mouvements de stock » ouvre un choix d'article — le catalogue,
paginé, avec son seuil. L'écran de stock d'un article réunit ensuite les trois lectures
disponibles : le stock réel, l'historique paginé, et les quatre opérations qui les font
bouger. Les alertes de seuil restent un écran à part, servi par le seul endpoint qui
parcourt tout le catalogue.

**Conséquence.** Deux clics pour atteindre l'historique d'un article, au lieu d'un. En
échange, aucune requête en éventail, et rien qui prétende exister côté serveur sans exister.
Le jour où le backend publie une liste globale — paginée, filtrable par article et par date —
l'écran de choix devient cette liste, et le reste ne bouge pas.

---

## ADR-018 — Clients et fournisseurs partagent leurs écrans, pas leur module

**Contexte.** `ClientRequest` et `FournisseurRequest` déclarent exactement les mêmes champs,
avec les mêmes contraintes : nom, prénom, email, téléphone, adresse, photo. Leurs réponses
se ressemblent autant, et leurs endpoints ne diffèrent que par leur racine. Écrire deux fois
la même liste et le même formulaire, c'était garantir qu'ils divergeraient à la première
retouche.

**Décision.** Les deux écrans réutilisables vivent dans `shared/tiers` : `ListeTiers` et
`FormulaireTiers`, plus les règles de saisie communes. Ils ne construisent aucune URL et
n'injectent aucun service d'API — l'écran qui les accueille leur passe ce qu'il faut appeler,
sous forme de fonction. `features/clients` et `features/fournisseurs` gardent chacun leur
service d'accès, leurs routes et deux composants d'assemblage de quelques lignes.

**Conséquence.** La règle « aucune feature n'importe une autre feature » tient : l'échange
passe par `shared`, comme prévu. La règle « `shared/ui` ne consomme aucun service » tient
aussi — ces composants ne sont pas dans `shared/ui`, et le seul service qu'ils touchent est
la file de notifications, déjà admise pour `ZoneNotifications` (ADR-012).

Le jour où l'un des deux modules s'éloigne de l'autre — un fournisseur qui gagnerait un délai
de livraison, par exemple — la sortie est simple : le module concerné cesse d'utiliser le
composant partagé et écrit le sien. C'est un partage par constat, pas une abstraction posée
d'avance.

---

## ADR-019 — Les deux modules de commandes partagent leurs écrans, et la modification s'arrête à la validation

**Contexte.** `CommandeClientRequest` et `CommandeFournisseurRequest` ne diffèrent que par le
nom de leur tiers — `idClient` contre `idFournisseur` — et leurs réponses par trois champs.
Les transitions d'état, les lignes, les totaux et les règles de suppression sont identiques.

Par ailleurs, `PUT /commandes-client/{id}` n'effectue **aucun contrôle d'état** : le serveur
accepte de réécrire les lignes d'une commande déjà livrée, dont les mouvements de stock sont
pourtant enregistrés. La commande et le stock cesseraient alors de se correspondre.

**Décisions.**

1. La liste et l'écran de commande sont écrits une fois, dans `shared/commerce`. Chaque
   module fournit la traduction vers une forme commune (`CommandeVue`) et l'inverse vers son
   propre DTO. C'est le seul endroit où `idClient` et `idFournisseur` apparaissent.
2. L'interface n'ouvre la modification qu'à l'état `EN_PREPARATION`. Passé cet état, l'écran
   devient une fiche en lecture, et ne propose que les transitions légales.

**Conséquences.** La restriction de modification est une décision d'interface, pas une
sécurité : le serveur accepte toujours l'appel, et un client HTTP direct pourra le faire.
L'écart est signalé pour que le contrôle soit ajouté côté backend, seul endroit où il
protège vraiment quelque chose.

Le total affiché pendant la saisie est annoncé comme estimé : le serveur recalcule les
totaux à partir des prix qu'il détient, et c'est le sien qui fait foi une fois la commande
enregistrée.

---

## ADR-020 — Deux garde-fous d'interface sur les comptes

**Contexte.** `DELETE /utilisateurs/{id}` ne protège rien : ni le compte de l'appelant, ni le
dernier administrateur de l'entreprise. Un administrateur pouvait donc supprimer son propre
compte et se retrouver dehors, ou vider l'entreprise de tout administrateur.

À l'inverse, `POST /utilisateurs/{id}/photo` **refuse** la photo d'autrui : le service lève
`AccessDeniedException` dès que l'identifiant n'est pas celui de l'appelant.

**Décisions.**

1. La liste des utilisateurs ne propose pas de supprimer la ligne du compte courant.
2. L'envoi de photo n'apparaît que sur « Mon profil », jamais sur l'écran d'administration.

**Conséquences.** Le premier point est un garde-fou, pas une sécurité : le serveur accepte
toujours l'appel, et un client HTTP direct le fera. Le contrôle a sa place côté backend, avec
celui du dernier administrateur ; l'écart est signalé. Le second point ne fait qu'aligner
l'écran sur ce que le serveur autorise — proposer un bouton qui échoue à coup sûr serait une
promesse en l'air.
