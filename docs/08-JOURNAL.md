# Journal

Une entrée par session, datée, ajoutée en fin de fichier. Jamais de réécriture d'une entrée
passée.

---

## 2026-08-19 — session 1 — Phase 0 · Fondations

**Branche** : `chore/core-foundations` (depuis `develop`, depuis `main`)

**Contexte de départ.** Le backend était encore un squelette en début de session : douze
contrôleurs vides, aucun endpoint, `SecurityConfig` et `JwtAuthenticationFilter` sans corps.
Il a été implémenté en cours de session par l'équipe backend et est devenu interrogeable :
41 chemins, 66 opérations, 47 schémas. Le port 8080 était par ailleurs occupé par un projet
sans rapport, ce qui a d'abord donné un `401` trompeur.

**Fait.**

- Environnement : Node 24.14.1 refusé par Angular CLI 22 (`^22.22.3 || ^24.15.0 || >=26`).
  Installation de 24.19.0 via nvm, épinglée dans `.nvmrc` (ADR-001).
- Espace de travail Angular 22.1.4 créé en standalone, zoneless, SCSS, Vitest, sans SSR.
- Neuf documents de pilotage, huit ADR.
- Verrou anti-mentions d'IA : `.gitignore` plus hook `commit-msg`, testé sur 13 cas.
- Quatre scripts de pilotage, tous exécutés au moins une fois de bout en bout.
- Chaîne de qualité : ESLint, Stylelint, Prettier, commitlint, lint-staged.
- Contrat API et correspondance des erreurs relevés sur le backend et sur son
  `GlobalExceptionHandler`, pas déduits.

**Découvert en route.**

- TypeScript 6 est strict par défaut, ce qui explique l'absence de `"strict": true` dans le
  `tsconfig.json` généré. Vérifié empiriquement plutôt que supposé (ADR-002).
- `openapi-typescript` exige encore `typescript@^5.x` : exécuté en isolation via `npx`,
  jamais installé (ADR-007).
- husky et `.githooks` se disputent `core.hooksPath` : husky retiré (ADR-008).
- `tsc -b` émettait des `.js` à côté des sources ; le script `typecheck` vérifie désormais
  les deux tsconfig sans émettre.
- La spécification ne publie aucun schéma d'erreur, et une requête sans jeton renvoie `403`
  au lieu de `401`. Les deux écarts sont documentés et signalés, sans contournement.

**Vérifications finales.** Lint 0 erreur / 0 avertissement, typecheck OK, 2 tests passés,
build de production 216,20 ko, bootstrap 7/7, check 5/5.

**En attente.** Typographie, couleur d'amorce, devise, dépôt distant, arbitrage husky.
Détail dans `01-ETAT.md`.

---

## 2026-08-19 — session 1 (suite) — Phase 1 · Noyau

**Branche** : `feat/core-noyau` (depuis `develop`)

**Arbitrages rendus avant d'ouvrir la phase.** Typographie Space Grotesk + IBM Plex Sans +
IBM Plex Mono, amorce `oklch(0.55 0.13 250)`, devise `XAF` sans décimale, `.githooks`
confirmé sans husky, dépôt GitLab. Consignés en ADR-009.

**Dépôt distant.** `gestion-stock-team/frontend-angular` créé en privé via `glab`, `main`,
`develop` et le tag `v0.1.0` poussés. Le projet `gestion-de-stock-frontend`, déjà présent
dans le même groupe et actif, appartient à un autre membre de l'équipe : laissé intact.

**Fait.**

- Types API générés et versionnés ; alias de lecture dans `core/api/api-types.ts`.
- Tokens de configuration, environnements de développement et de production.
- Contrat d'erreur, traduction en messages utilisateur, file de notifications.
- Quatre intercepteurs et leur ordre d'inversion, service d'authentification, gardes.
- 25 tests unitaires.

**Découvert en route.**

- L'ordre des intercepteurs s'inverse au retour : posé à l'envers au premier jet, ce qui
  aurait notifié une erreur avant même la tentative de rafraîchissement. Corrigé et
  documenté dans `04-ARCHITECTURE.md`.
- `GET /utilisateurs/me` expose `roles`, `entrepriseId` et `entrepriseNom` : inutile de
  décoder le jeton côté client pour connaître les droits.
- `lint-staged` faisait échouer tout commit contenant les types générés : ESLint avertit
  quand on lui présente un fichier qu'il ignore, et `--max-warnings 0` en faisait une
  erreur. Résolu par `--no-warn-ignored`.
- Un commit fourre-tout de douze fichiers s'est formé après quatre commits refusés d'affilée
  — l'index conservait les fichiers des tentatives précédentes. Défait par `reset --mixed`,
  puis refait en huit commits atomiques.

**Vérifications finales.** Lint 0 erreur / 0 avertissement, typecheck OK, 25 tests passés,
build de production 246,68 ko.

**En attente.** Validation de la phase 1. Les routes `/connexion` et `/acces-refuse`,
référencées par les gardes, n'existent pas avant les phases 4 et 5.

---

## 2026-08-19 — session 1 (suite) — Phase 2 · Thème

**Branche** : `feat/theme-tokens` (depuis `develop`)

**Contexte.** Phase 1 validée, fusionnée dans `main`, taguée `v0.2.0`. Consigne de
travailler en autonomie : les commits sont posés au fil de l'eau et `01-ETAT.md` est tenu à
jour à chaque étape, pour qu'une interruption ne laisse jamais un état illisible.

**Fait.**

- Polices auto-hébergées, générateur de rampe OKLCH, trois couches de tokens, tokens de
  mouvement, `ServiceTheme`, page d'attente pour vérifier le thème à la main.
- 57 tests, dont la garantie de contraste sur les 24 teintes du cercle.

**Découvert en route.**

- Un `cd public/fonts` d'un bloc précédent a persisté et fait atterrir un fichier source
  dans `public/`. Déplacé et nettoyé avant tout commit.
- `stylelint-config-standard-scss` impose une notation OKLCH incompatible avec celle que le
  service écrit à l'exécution, et interdit de regrouper les tokens par familles. Deux règles
  ajustées, une désactivée (ADR-010).
- `stylelint --fix` supprime les zéros terminaux : le test qui verrouille l'accord entre la
  rampe statique et le générateur comparait du texte, il compare désormais des nombres.
- L'import `?raw` de Vite n'est pas géré par le builder de tests d'Angular. `@types/node` a
  été ajouté pour lire la feuille de styles — seule dépendance posée sans validation, notée
  comme telle.
- Le passage du dépôt en public est refusé : rôle Maintainer, alors que GitLab exige Owner.

**Vérifications finales.** Lint 0 erreur / 0 avertissement, stylelint 0 erreur, typecheck OK,
57 tests passés, build de production 252,36 ko.

**En attente.** Visibilité du dépôt, confirmation de `@types/node`.

---

## 2026-08-19 — session 1 (suite) — Phase 3 · Design system

**Branche** : `feat/ui-design-system` (depuis `develop`)

**Fait.**

- Huit primitives dans `shared/ui`, dont la jauge de seuil, élément signature de
  l'application.
- Écran « Apparence » sur les onglets d'Angular Aria, servant aussi de page de démonstration.
- 73 tests.

**Découvert en route.**

- `@angular/aria@22.1.2` n'expose ni bouton, ni champ, ni boîte de dialogue, contrairement à
  ce que laissait entendre le brief. Ce qu'il couvre est utilisé ; le reste s'appuie sur la
  plateforme, `<dialog>` compris (ADR-011).
- La règle `click-events-have-key-events` signalait le clic sur le voile du `<dialog>`.
  L'écouteur est passé en code : ce n'est pas un élément interactif à rendre focusable, et
  Échap ferme déjà la modale.
- `::ng-deep` était nécessaire pour styler un contrôle projeté. Le style des champs a été
  déplacé dans la feuille de base, où il a naturellement sa place : plus aucun `::ng-deep`
  dans le projet.
- La page d'attente de la phase 2 a été retirée, remplacée par l'écran « Apparence ».

**Vérifications finales.** Lint 0 erreur / 0 avertissement, stylelint 0 erreur, typecheck OK,
73 tests passés, build de production 270,23 ko.

**En attente.** Visibilité du dépôt, confirmation de `@types/node`, relecture d'ensemble des
phases enchaînées en autonomie.

---

## 2026-08-19 — session 1 (suite) — Phase 4 · Shell

**Branche** : `feat/layout-shell` (depuis `develop`)

**Fait.**

- Coquille applicative complète, navigation déclarative, fil d'Ariane, pages 403 et 404,
  transitions de route, tiroir de navigation sous 48 rem.
- 80 tests.

**Choix de conception.**

- Les entrées de navigation dont l'écran n'existe pas restent visibles, marquées « à venir ».
  Le menu montre ainsi le périmètre réel de l'application, plutôt que de grandir écran après
  écran sans qu'on sache où l'on va.
- L'état d'ouverture de la navigation n'est pas persisté : sur un poste d'entrepôt partagé,
  une préférence gardée d'une session à l'autre surprendrait plus qu'elle n'aiderait.
- L'activité réseau est signalée par une fine barre dans le bandeau, jamais par un voile
  plein écran qui masquerait le contenu déjà lisible.

**Vérifications finales.** Lint 0 erreur / 0 avertissement, stylelint 0 erreur, typecheck OK,
80 tests passés, build de production 290,47 ko.

**En attente.** Relecture d'ensemble des phases 2 à 4, visibilité du dépôt, confirmation de
`@types/node`.

---

## 2026-08-19 — session 1 (suite) — Phase 5 · Authentification

**Branche** : `feat/auth-connexion` (depuis `develop`)

**Périmètre arbitré à l'ouverture.** Authentification complète : les cinq endpoints
`/auth/*` plus `/utilisateurs/change-password`. L'inscription d'entreprise entre donc dans
la phase — sans elle, aucun tenant ne peut être créé depuis l'interface.

**Fait.**

- Coquille d'authentification et cinq écrans : connexion, inscription, mot de passe oublié,
  réinitialisation, changement de mot de passe.
- Formulaires en Signal Forms, avec répartition des erreurs serveur entre les champs et un
  bandeau d'ensemble.
- `ServiceAuthentification` complété ; restauration de session au démarrage ;
  `gardeMotDePasse` ; déconnexion et lien de compte dans le bandeau.
- 105 tests.

**Découvert en route.**

- `POST /utilisateurs/change-password` répond `401` quand l'ancien mot de passe est faux.
  L'intercepteur de rafraîchissement l'aurait pris pour une session expirée et aurait
  déconnecté l'utilisateur pour une faute de frappe. Appel exclu du rafraîchissement
  (ADR-013).
- Un `loadChildren` posé sur un chemin vide oblige le routeur à charger le fichier de routes
  même pour l'URL `/`. Les routes d'authentification sont donc importées statiquement ; les
  écrans, eux, restent des morceaux séparés (ADR-014).
- Signal Forms refuse l'attribut `name` sur un contrôle porteur de `[formField]` — la
  directive le pose elle-même — et les entrées booléennes d'un composant ne se règlent pas
  par un attribut nu (`requis` devient `[requis]="true"`).
- L'email de réinitialisation transporte un code à recopier, pas un lien de retour :
  l'écran de réinitialisation demande donc le code, sans lire de paramètre d'URL.
- Le backend ne dit pas lequel des deux emails est en cause sur un `409` à l'inscription.
  Le message part en bandeau plutôt que sous un champ choisi au hasard.

**Choix de conception.**

- Le formulaire d'inscription ne demande que ce que le backend exige. Adresse, téléphone,
  site web et description sont facultatifs côté serveur : ils appartiennent à l'écran
  Entreprise, pas à la première page vue par un nouveau client.
- Quand toutes les erreurs de validation ont trouvé leur champ, aucun bandeau ne s'affiche :
  répéter en haut d'écran ce qui est écrit sous chaque champ double le bruit.
- `returnUrl` est filtré aux chemins internes. Une adresse absolue renverrait l'utilisateur
  vers un site tiers juste après la saisie de son mot de passe.
- Pas de menu de compte dans le bandeau : deux actions ne justifient pas un menu déroulant.
  Il viendra avec l'écran de profil, quand il y aura plus à y mettre.

**Vérifications finales.** Lint 0 erreur / 0 avertissement, stylelint 0 erreur, typecheck OK,
105 tests passés, build de production 297,61 ko.

**En attente.** Vérification visuelle des cinq écrans par le mainteneur — la liste des points
à parcourir est dans `01-ETAT.md`. Puis relecture d'ensemble des phases 2 à 5, visibilité du
dépôt, confirmation de `@types/node`.

---

## 2026-08-19 — session 1 (suite) — Phase 6 · Catalogue

**Branche** : `feat/articles-catalogue` (depuis `develop`)

**Contexte.** Phase 5 fusionnée dans `develop` sans vérification visuelle préalable, sur
consigne de continuer en autonomie. Le plan de livraison n'étant pas versionné, le découpage
des phases 6 à 11 a été déduit des groupes de navigation et consigné en ADR-015.

**Fait.**

- Primitives de liste : tableau, pagination, pipe `montant`.
- Helper de pagination dans `core/api`, dérivé du schéma généré.
- Écrans Catégories et Articles, création, modification, suppression, envoi de photo.
- Correctif de la phase 5 sur la double notification d'erreur.
- 137 tests.

**Découvert en route.**

- `GET /articles` n'accepte aucun paramètre de recherche, et `GET /categories` n'est pas
  paginé. Les deux écarts sont signalés ; aucun contournement n'a été posé, en particulier
  pas de champ de recherche qui ne filtrerait que la page affichée.
- Les photos s'envoient mais aucun endpoint ne les relit : le backend conserve un nom
  d'objet MinIO. L'écran le dit franchement plutôt que d'afficher une image cassée.
- `tauxTva` n'intervient dans aucun calcul du backend, et `prixUnitaireTtc` est exigé dans la
  requête. Le TTC est donc calculé par l'interface (ADR-016).
- Signal Forms refuse l'attribut `min` sur un contrôle porteur de `[formField]` : la
  contrainte passe par le validateur `min()` du schéma, qui la reflète lui-même dans le DOM.
  Un `select` lié à un champ ne travaille qu'en texte : la catégorie est convertie en
  identifiant à l'envoi.
- `whenStable()` ne rend pas la main tant qu'une requête attend son `flush` : les tests de
  liste avancent par `detectChanges()` et n'attendent la stabilité qu'après la réponse.
- jsdom n'implémente ni `showModal` ni `close` sur `<dialog>`. Comblé une fois pour toutes
  dans `src/test-setup.ts`, plutôt que de tordre la modale pour un environnement de test.
- Le premier `ng` a écrit un identifiant d'analytics dans `angular.json`. Analytics coupé
  pour l'espace de travail.
- `git push` refusé par GitLab (jeton). Les phases 5 et 6 restent locales.

**Choix de conception.**

- Le tableau ne connaît pas les données : les lignes lui sont projetées. Un composant qui
  saurait lire des articles ne servirait plus aux clients ni aux commandes.
- Les catégories se trient dans le navigateur : la réponse est complète, un aller-retour
  n'apporterait rien.
- Supprimer le dernier élément d'une page recule d'une page au lieu d'afficher un vide.

**Vérifications finales.** Lint 0 erreur / 0 avertissement, stylelint 0 erreur, typecheck OK,
137 tests passés, build de production 311,27 ko.

**En attente.** Vérification visuelle du catalogue, confirmation du découpage des phases
(ADR-015), et un jeton GitLab valide pour pousser.

---

## 2026-08-19 — session 1 (suite) — Phase 7 · Stock

**Branche** : `feat/mouvements-stock` (depuis `develop`)

**Contexte.** Phase 6 fusionnée dans `develop` sans vérification visuelle préalable, sur
consigne de continuer en autonomie.

**Fait.**

- Trois écrans : choix de l'article, stock d'un article, alertes de seuil.
- Les quatre opérations de mouvement, dans un formulaire unique porté par une modale.
- Pipe `quantite` ; helper d'erreurs élargi aux champs numériques.
- 157 tests.

**Découvert en route.**

- Aucune liste globale des mouvements n'existe côté backend. La section s'ouvre donc sur le
  choix d'un article (ADR-017) plutôt que sur une liste qui aurait coûté une requête par
  ligne de catalogue.
- L'historique d'un article ignore le paramètre `sort` : l'ordre des dates est forcé par la
  requête du repository. Aucun en-tête cliquable n'est proposé sur ce tableau.
- `GET /mouvements-stock/alertes-stock` dérive le stock réel de chaque article du catalogue à
  chaque appel, sans pagination. Signalé, sans contournement possible côté interface.
- `repartirErreur` n'acceptait que des champs de texte : une quantité est un nombre. Le type
  du paramètre est passé à `ReadonlyFieldTree<unknown>`.
- Quatre commits avaient été posés dans un ordre qui laissait deux d'entre eux référencer un
  écran pas encore ajouté. Défaits par `reset --soft`, refaits dans l'ordre : chaque commit
  de la branche compile seul.

**Choix de conception.**

- La quantité saisie est toujours positive : le sens du mouvement est porté par l'opération
  choisie, comme côté backend. Un signe à saisir aurait doublé la source d'erreur.
- L'écran de stock redemande le stock réel après chaque écriture au lieu de l'ajuster
  lui-même. Le serveur reste seul à savoir ; deux calculs divergeraient un jour.
- Les alertes sont triées par manque relatif au seuil : une rupture passe devant un article
  qui frôle son seuil, et deux articles de tailles différentes se comparent quand même.

**Vérifications finales.** Lint 0 erreur / 0 avertissement, stylelint 0 erreur, typecheck OK,
157 tests passés, build de production 322,45 ko.

**En attente.** Vérification visuelle des écrans de stock, confirmation du découpage des
phases (ADR-015), et un jeton GitLab valide pour pousser.

---

## 2026-08-19 — session 1 (suite) — Phase 8 · Tiers

**Branche** : `feat/clients-fournisseurs` (depuis `develop`)

**Contexte.** Phase 7 fusionnée dans `develop` sans vérification visuelle préalable, sur
consigne de continuer en autonomie.

**Fait.**

- `shared/tiers` : liste et formulaire communs, paramétrés par libellés, chemin et actions.
- Modules clients et fournisseurs : service d'accès, routes, deux composants d'assemblage.
- 174 tests.

**Découvert en route.**

- `ClientRequest` et `FournisseurRequest` sont identiques, champ pour champ, contrainte pour
  contrainte. Les écrans sont donc écrits une fois (ADR-018) plutôt que copiés — une copie
  aurait divergé à la première retouche.
- Les listes de tiers n'acceptent pas plus de recherche que celle des articles : même écart,
  même absence de champ de recherche.
- Les tests des écrans qui naviguent après un enregistrement rejetaient silencieusement :
  `provideRouter([])` ne connaît aucune route, et l'échec remontait en rejet non traité dans
  le rapport de Vitest. Une route attrape-tout a été ajoutée à ces cinq tests.
- La génération du module fournisseurs par substitution a renommé `HttpClient` en
  `HttpFournisseur` et laissé une phrase absurde dans un commentaire. Relu et corrigé avant
  le premier commit — une substitution automatique se relit.

**Choix de conception.**

- Les composants partagés ne construisent aucune URL et n'injectent aucun service d'API :
  l'écran hôte leur passe la fonction à appeler. Le partage porte sur la forme, pas sur
  l'accès aux données.
- Un champ facultatif laissé vide est omis de la requête. Envoyer `""` reviendrait à écrire
  en base une adresse vide là où il n'y a pas d'adresse.

**Vérifications finales.** Lint 0 erreur / 0 avertissement, stylelint 0 erreur, typecheck OK,
174 tests passés, build de production 322,70 ko.

**En attente.** Vérification visuelle des écrans de tiers, confirmation d'ADR-015 et
d'ADR-018, et un jeton GitLab valide pour pousser.

---

## 2026-08-19 — session 1 (suite) — Phase 9 · Commerce

**Branche** : `feat/commandes-ventes` (depuis `develop`)

**Contexte.** Phase 8 fusionnée dans `develop` sans vérification visuelle préalable, sur
consigne de continuer en autonomie.

**Fait.**

- `shared/commerce` : états et transitions, éditeur de lignes, liste et écran de commande.
- Modules commandes client et commandes fournisseur, réduits à leur service d'accès, leur
  traduction de DTO et deux composants d'assemblage.
- Module ventes : liste avec recherche par code, enregistrement, fiche en lecture seule.
- 208 tests.

**Découvert en route.**

- `PUT` sur une commande n'effectue aucun contrôle d'état : le serveur accepte de réécrire
  les lignes d'une commande déjà livrée. L'interface s'interdit la modification au-delà de
  `EN_PREPARATION` (ADR-019) et l'écart est signalé — le contrôle a sa place côté serveur.
- `DELETE /ventes/{id}` lève systématiquement une erreur : l'endpoint est publié mais ne
  peut jamais aboutir. Aucun bouton de suppression n'est proposé pour une vente.
- `VenteResponse` ne porte aucun total, là où les deux commandes en portent trois. Le montant
  est dérivé des lignes renvoyées par le serveur.
- Aucune recherche n'existe sur les commandes ni sur les ventes. Les listes déroulantes de
  tiers et d'articles chargent une page large et disent quand il en reste derrière.

**Incident.** Trois commandes ont tourné dans le dépôt backend : le répertoire courant y était
resté après une lecture de ses sources. Un dossier `src/app/` y a été créé et une branche
`feat/commandes-ventes` posée, puis les deux supprimés ; le dépôt est revenu sur `main`, sans
autre trace. La seule modification qui subsiste chez lui — `mvnw` passé en 755 — est
antérieure à cette session. Les chemins absolus sont désormais utilisés pour tout changement
de répertoire.

**Choix de conception.**

- Un seul écran pour créer, modifier et lire une commande : les trois montrent la même chose,
  et l'état décide si elle est ouverte à la saisie.
- Le total affiché pendant la saisie est annoncé comme estimé. Le serveur recalcule à partir
  des prix qu'il détient ; présenter le calcul du navigateur comme définitif serait faux.
- L'avertissement d'écriture définitive d'une vente est affiché **avant** la saisie, pas
  après l'envoi.

**Vérifications finales.** Lint 0 erreur / 0 avertissement, stylelint 0 erreur, typecheck OK,
208 tests passés, build de production 323,13 ko.

**En attente.** Vérification visuelle des écrans de commerce, confirmation d'ADR-015, ADR-018
et ADR-019, et un jeton GitLab valide pour pousser.

---

## 2026-08-19 — session 1 (suite) — Phase 10 · Administration

**Branche** : `feat/administration` (depuis `develop`)

**Fait.**

- Écran Entreprise, réservé aux administrateurs.
- Module Utilisateurs : liste, création, modification, suppression, rôles en cases à cocher.
- « Mon profil », ouvert à tous, avec l'envoi de sa propre photo.
- 225 tests.

**Découvert en route.**

- Créer un utilisateur ne prend pas de mot de passe : le serveur en génère un, l'envoie par
  email et lève `mustChangePassword`. La garde écrite en phase 5 prend alors le relais — les
  deux phases se rejoignent sans rien ajouter.
- `DELETE /utilisateurs/{id}` ne protège ni le compte de l'appelant ni le dernier
  administrateur. L'interface pose un garde-fou sur le premier cas (ADR-020) ; le second ne
  peut être traité que côté serveur.
- `POST /utilisateurs/{id}/photo` refuse la photo d'autrui. L'envoi n'apparaît donc que sur
  « Mon profil », et pas sur l'écran d'administration.
- `EntrepriseRequest` porte un champ `photo` qu'aucun endpoint ne remplit : il n'est pas
  proposé à la saisie.
- `PUT /utilisateurs/me` n'accepte ni l'email ni les rôles : ils restent affichés, en lecture.

**Choix de conception.**

- La liste des utilisateurs affiche l'état du mot de passe. C'est la question que se pose un
  administrateur en regardant cet écran : mon collègue s'est-il déjà connecté ?
- Le nom dans le bandeau mène au profil plutôt qu'au changement de mot de passe, qui n'en est
  plus qu'un lien parmi d'autres.

**Vérifications finales.** Lint 0 erreur / 0 avertissement, stylelint 0 erreur, typecheck OK,
225 tests passés, build de production 323,88 ko.

**En attente.** Vérification visuelle des écrans d'administration, et un jeton GitLab valide.

---

## 2026-08-19 — session 1 (suite) — Phase 11 · Tableau de bord

**Branche** : `feat/tableau-de-bord` (depuis `develop`)

**Fait.**

- Écran de pilotage : chiffre d'affaires du mois et total, commandes par état, classement des
  articles les plus vendus, aperçu des cinq alertes de seuil les plus proches.
- Racine de l'application redirigée vers le tableau de bord, comme prévu depuis la phase 4.
- 230 tests.

**Choix de conception.**

- Aucun chiffre n'est recalculé côté navigateur : `GET /dashboard/statistiques` les porte
  tous. La seule opération faite sur place est la mise à l'échelle des barres du classement.
- Les alertes de seuil figurent sur le tableau de bord parce que ce sont les seules données
  auxquelles il faut réagir le jour même. Cinq articles sont détaillés ; au-delà, un compte
  renvoie à l'écran des alertes plutôt que d'allonger la page.
- Le chiffre d'affaires du mois porte la couleur de marque : c'est la mesure qu'on vient
  chercher en ouvrant l'application.
- Le test de la navigation a changé de sens : il vérifiait qu'une entrée annoncée restait
  inerte, il vérifie maintenant qu'il n'en reste aucune.

**Vérifications finales.** Lint 0 erreur / 0 avertissement, stylelint 0 erreur, typecheck OK,
230 tests passés, build de production 323,98 ko.

**En attente.** Vérification visuelle du tableau de bord. Le plan déduit en ADR-015 s'achève
ici : la suite appartient au mainteneur — relecture d'ensemble, fusion dans `main` et tag, ou
reprise des seize écarts backend consignés dans `06-API-CONTRAT.md`.
