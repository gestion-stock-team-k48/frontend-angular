# Design system

Ce document fixe l'architecture visuelle. La phase 2 est faite : polices, tokens,
`ServiceTheme`, mouvement. Les primitives UI et l'écran « Apparence » arrivent en phase 3.
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

## Écran « Apparence »

`/parametres/apparence` : sélecteur d'amorce, presets, mode clair/sombre, densité, aperçu en
direct. C'est aussi la page de démonstration du design system.

## Mouvement

Objectif : que l'interface paraisse **réactive**, pas animée.

```
--dur-instant: 90ms   --dur-fast: 140ms   --dur-base: 220ms   --dur-slow: 340ms
--ease-out            --ease-in-out       --ease-spring
```

Aucune durée en dur dans un composant.

Micro-interactions attendues : états de boutons (hover / active / chargement à largeur
stable) ; ouverture de modale et de tiroir (fondu + translation courte) ; toasts empilés ;
skeletons pendant le chargement, jamais de spinner plein écran après le premier rendu ;
apparition en cascade très légère des lignes de tableau, au premier chargement uniquement ;
compteur animé sur les KPI du tableau de bord ; pulsation sobre sur les alertes de stock sous
seuil ; transition de la sidebar repliable.

Transitions de route via `withViewTransitions()`, avec un `view-transition-name` sur les
éléments qui persistent d'un écran à l'autre.

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
