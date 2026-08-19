# Design system

Ce document fixe l'architecture visuelle. Phases 2 et 3 faites : polices, tokens,
`ServiceTheme`, mouvement, primitives UI et écran « Apparence ».
Les arbitrages typographie et couleur d'amorce sont rendus (session 1, 2026-08-19) et
consignés en ADR-009.

## Où vivent les tokens

| Fichier                               | Contenu                                                 |
| ------------------------------------- | ------------------------------------------------------- |
| `src/styles/_polices.scss`            | déclarations `@font-face`                               |
| `src/styles/tokens/_primitifs.scss`   | rampes de marque, neutre et couleurs d'état             |
| `src/styles/tokens/_semantiques.scss` | tokens consommés par les composants, thème sombre       |
| `src/styles/tokens/_systeme.scss`     | espacement, rayons, ombres, plans, typographie, densité |
| `src/styles/tokens/_mouvement.scss`   | durées, courbes, `prefers-reduced-motion`               |
| `src/styles/_base.scss`               | modèle de boîte, typographie de base, focus             |
| `src/app/core/theme/couleur-oklch.ts` | génération de rampe, conversion, contraste              |
| `src/app/core/theme/theme.ts`         | `ServiceTheme`                                          |

La rampe de marque existe en deux endroits : en dur dans `_primitifs.scss`, pour que le
premier rendu soit juste avant l'exécution du script, et calculée par `ServiceTheme` pour
l'amorce réelle de l'entreprise. Un test verrouille l'accord entre les deux
(`tokens-statiques.spec.ts`).

## Parti pris

Outil de travail quotidien : tableaux denses, chiffres, saisies répétitives, écrans moyens,
parfois mobile en entrepôt. La qualité perçue vient de la lisibilité des chiffres, de la
vitesse de saisie et de la clarté des états — pas d'effets décoratifs.

Écartés d'office parce que ce sont des réflexes, pas des choix : fond crème + serif contrasté

- accent terracotta ; noir profond + accent vert acide ; dégradés violet-bleu ; cartes KPI
  identiques avec une grosse flèche colorée.

## Élément signature — la jauge de seuil

Micro-représentation du rapport `stock réel / seuil minimum`, déclinée à trois tailles :

| Taille    | Emploi                                           |
| --------- | ------------------------------------------------ |
| `inline`  | dans une ligne de tableau, à côté de la quantité |
| `moyenne` | sur une fiche article                            |
| `grande`  | sur le tableau de bord, bloc des alertes         |

Même grammaire visuelle aux trois tailles. C'est le seul motif fort de l'application ; tout
le reste autour reste sobre.

## Typographie

Trois rôles, polices auto-hébergées dans `public/fonts/`, jamais de CDN externe :
l'application doit se charger sans accès Internet.

- **display** — titres de page et chiffres clés, employée avec parcimonie.
- **texte** — neutre, très lisible, toute l'interface.
- **monospace à chiffres tabulaires** — codes article, quantités, montants, colonnes
  numériques. `font-variant-numeric: tabular-nums` obligatoire : les chiffres d'un tableau
  s'alignent verticalement.

**Choix retenu :**

| Rôle      | Famille           | Emploi                                                  |
| --------- | ----------------- | ------------------------------------------------------- |
| display   | **Space Grotesk** | titres de page, chiffres clés des KPI                   |
| texte     | **IBM Plex Sans** | toute l'interface                                       |
| monospace | **IBM Plex Mono** | codes article, quantités, montants, colonnes numériques |

Motif du choix : Plex Sans et Plex Mono sont dessinées ensemble, avec la même hauteur d'x et
des chasses cohérentes. Un libellé en Plex Sans et une colonne chiffrée en Plex Mono
s'alignent sans réglage optique, ce qui est exactement le problème d'un écran de stock.
Space Grotesk apporte des chiffres géométriques marquants là où il en faut, et nulle part
ailleurs.

Les trois familles sont sous licence OFL et seront auto-hébergées en `woff2` dans
`public/fonts/`, avec `font-display: swap` et une pile de repli système déclarée.

## Tokens

Trois niveaux, dans cet ordre strict.

### 1. Primitifs

Une seule couleur d'amorce (`seed`) par entreprise, d'où est générée une rampe complète
50 → 950 en **OKLCH** : les écarts de luminosité restent perceptuellement réguliers quelle
que soit la teinte choisie.

Amorce par défaut retenue : **`oklch(0.55 0.13 250)`**, bleu-indigo désaturé.
La jauge de seuil monopolise le vert, l'ambre et le rouge pour le signal métier ; une marque
froide et moyennement saturée ne les concurrence jamais et reste supportable huit heures par
jour. Presets prévus : ardoise, indigo, teal, prune, brique — aucun dans la plage
vert-orange-rouge.

### 2. Sémantiques

**Le code applicatif n'utilise jamais un token primitif.** Uniquement :

```
--surface-0  --surface-1  --surface-2  --surface-3
--text-strong  --text-base  --text-muted  --text-inverse
--border-subtle  --border-base  --border-strong
--brand  --brand-hover  --brand-contrast  --focus-ring
--state-success  --state-warning  --state-danger  --state-info
  (+ variantes -surface et -text pour chacun)
--stock-ok  --stock-low  --stock-out
```

### 3. Système

Échelle d'espacement, rayons, ombres, épaisseurs de bordure, `z-index`, et tokens de
mouvement.

## ThemeService

Service à base de signaux, exposant :

| Réglage          | Valeurs                                    |
| ---------------- | ------------------------------------------ |
| mode             | `clair` / `sombre` / `système`             |
| couleur d'amorce | n'importe quelle couleur, plus des presets |
| densité          | `confortable` / `compact` (tableaux longs) |
| rayon global     | `net` / `doux` / `arrondi`                 |

Il applique les variables sur `document.documentElement`, persiste dans `localStorage`, et
respecte `prefers-color-scheme` en mode système. `color-scheme` est déclaré et
`<meta name="theme-color">` reste synchronisé avec le thème.

**Contraste garanti** : à la génération de la palette, le contraste est calculé et
`--brand-contrast` (texte sur fond de marque) est choisi automatiquement pour rester
≥ 4.5:1. Une amorce claire ne doit jamais produire un bouton illisible.

## Format monétaire

Devise par défaut : **`XAF`**, symbole **FCFA**, **zéro décimale** — le franc CFA n'a pas de
subdivision en usage. Séparateur de milliers : espace insécable étroit. Symbole placé après
le montant.

```
Total commande     1 250 000 FCFA
Prix unitaire          4 500 FCFA
```

Ces valeurs sont portées par un token d'injection, jamais codées en dur : une entreprise
déployée hors zone CFA change de devise sans toucher au code.

## Primitives

Dans `src/app/shared/ui/`. Aucune ne consomme de service ni ne porte de logique métier —
sauf `ZoneNotifications`, exception bornée documentée en ADR-012.

| Composant           | Sélecteur                | Rôle                                                  |
| ------------------- | ------------------------ | ----------------------------------------------------- |
| `JaugeSeuil`        | `app-jauge-seuil`        | élément signature, trois tailles, `role="meter"`      |
| `Bouton`            | `app-bouton`             | quatre variantes, état de chargement à largeur stable |
| `Champ`             | `app-champ`              | libellé, aide, erreur ; le contrôle est projeté       |
| `Badge`             | `app-badge`              | pastille d'état, cinq tons                            |
| `Squelette`         | `app-squelette`          | bloc de chargement, trois formes                      |
| `EtatVide`          | `app-etat-vide`          | état vide ou état d'erreur, avec action               |
| `Modale`            | `app-modale`             | `<dialog>` natif                                      |
| `ZoneNotifications` | `app-zone-notifications` | pile de notifications                                 |

Angular Aria n'est employé que là où il existe : il n'expose ni bouton, ni champ, ni boîte
de dialogue. Voir ADR-011.

## Écran « Apparence »

`/parametres/apparence` : mode, presets et curseurs de teinte, saturation et clarté, densité,
rayon, aperçu en direct. Deuxième onglet : toutes les primitives, dans leurs états normaux,
de chargement, d'erreur et vides. C'est la page de démonstration du design system.

## Mouvement

Objectif : que l'interface paraisse **réactive**, pas animée.

```
--dur-instant: 90ms   --dur-fast: 140ms   --dur-base: 220ms   --dur-slow: 340ms
--ease-out            --ease-in-out       --ease-spring
```

Aucune durée en dur dans un composant.

Micro-interactions livrées (session 1, affinage) : états de boutons (hover / active / chargement à largeur
stable) ; ouverture de modale et de tiroir (fondu + translation courte) ; toasts empilés ;
skeletons pendant le chargement, jamais de spinner plein écran après le premier rendu ;
apparition en cascade très légère des lignes de tableau, au premier chargement uniquement ;
compteur animé sur les KPI du tableau de bord ; pulsation sobre sur les alertes de stock sous
seuil ; transition de la sidebar repliable.

Transitions de route via `withViewTransitions()`.

### Où vivent les animations partagées

`src/styles/_animations.scss` porte les images clés communes — `apparition`,
`apparition-echelle`, `glissement-lateral`, `pulsation-douce` — et deux classes utilitaires.
Une même apparition employée sur une carte, une ligne de tableau et un toast doit avoir
exactement la même durée et la même distance, sinon l'interface paraît bricolée.

`src/styles/_tableau.scss` porte le survol et la cascade des lignes de tableau. Ces règles
sont globales par nécessité : les lignes sont projetées dans `app-tableau` par l'écran
appelant, elles portent donc l'attribut d'encapsulation du parent, et une règle écrite dans
`tableau.scss` ne les atteint pas. C'est la même raison qui met le style des contrôles de
saisie dans `_base.scss`.

`shared/animations/nombre-anime.ts` fait courir les mesures du tableau de bord vers leur
valeur. C'est le seul chiffre animé de l'application : ailleurs, un montant qui défile serait
une coquetterie. L'horloge y est relue à chaque image plutôt que prise dans l'argument de
`requestAnimationFrame`, dont l'origine diffère d'un environnement à l'autre.

### Expression de la couleur

Trois tokens sémantiques ajoutés pour donner de la matière sans sortir la couleur pleine :

| Token                                        | Emploi                                              |
| -------------------------------------------- | --------------------------------------------------- |
| `--surface-marque`, `--surface-marque-forte` | survol d'une ligne, entrée de navigation active     |
| `--degrade-marque`                           | boutons primaires, filets de tête, barres de mesure |
| `--degrade-surface`, `--degrade-page`        | entêtes de tableau, halo de fond d'application      |
| `--ombre-marque`, `--ombre-marque-forte`     | relief des actions primaires                        |
| `--flou-calque`                              | bandeau, voile de modale, tiroir de navigation      |

Les mélanges passent par `color-mix(in oklab, …)` sur `--brand` : la couleur d'amorce de
l'entreprise se propage donc à tous ces effets sans qu'aucun d'eux ne soit recalculé.

**`prefers-reduced-motion: reduce` est obligatoire** : toutes les durées tombent à `1ms` via
une surcharge unique des tokens, et aucune animation d'entrée n'est jouée.

Animations en CSS ou via les API natives d'Angular. Aucune bibliothèque d'animation tierce.

## Plancher de qualité

Jamais présenté comme une fonctionnalité, toujours vérifié :

- responsive jusqu'à 360 px ;
- focus clavier toujours visible, navigation complète au clavier ;
- libellés et `aria-*` corrects (Angular Aria couvre l'essentiel) ;
- état vide, état d'erreur et état de chargement conçus pour **chaque** liste et **chaque**
  formulaire ;
- messages d'erreur qui disent ce qui s'est passé et quoi faire — jamais « Une erreur est
  survenue ».
