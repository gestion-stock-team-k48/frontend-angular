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
