# État courant

- Dernière mise à jour : 2026-08-19 — session 1
- Phase en cours : 2 · Thème — terminée
- Branche de travail : feat/theme-tokens
- Dernier commit : 7c5ac77 — feat(theme): add a temporary preview page for the tokens
- Backend requis démarré : oui — `http://localhost:8080/api/v1`
- Prochaine action précise : ouvrir la phase 3 (primitives UI sur Angular Aria et écran « Apparence »).

## Fait dans cette phase

- Polices Space Grotesk, IBM Plex Sans et IBM Plex Mono auto-hébergées dans `public/fonts/`
  (sous-ensemble latin, woff2, environ 140 ko), déclarées avec `font-display: swap` et
  préchargées pour les deux graisses du premier écran.
- Générateur de rampe OKLCH : clartés perceptuellement régulières, chroma culminant au
  milieu, conversion vers sRGB et calcul de contraste WCAG.
- `--brand-contrast` choisi automatiquement pour rester au-dessus de 4,5:1. Vérifié sur
  les 24 teintes du cercle et sur trois amorces extrêmes.
- Trois couches de tokens : primitifs, sémantiques (avec thème sombre), système
  (espacement, rayons, ombres, plans, typographie, densité).
- Tokens de mouvement et `prefers-reduced-motion` : une seule surcharge ramène toutes les
  durées à 1 ms, puisque aucun composant ne porte de durée propre.
- `ServiceTheme` : mode clair / sombre / système, amorce, densité, rayon ; application sur
  l'élément racine, persistance dans `localStorage`, suivi de `prefers-color-scheme`,
  `color-scheme` et `<meta name="theme-color">` synchronisés.
- Page d'attente temporaire rendant le thème vérifiable à la main. Elle disparaît en phase 4.
- 57 tests.

## Reste à faire dans cette phase

- Rien. L'écran « Apparence » complet appartient à la phase 3, dont il est aussi la page de
  démonstration du design system.

## Points bloquants / en attente de ma validation

1. **Visibilité du dépôt** — le passage en public a été refusé : le compte est Maintainer (40)
   sur le groupe, or GitLab réserve ce changement au rôle Owner (50). À faire par un Owner,
   ou via `Settings → General → Visibility`.
2. **`@types/node` ajouté sans validation** (ADR-010), seule dépendance dans ce cas. Elle
   n'embarque aucun code. À confirmer ou à retirer.
3. **Routes `/connexion` et `/acces-refuse`** référencées par les gardes mais inexistantes
   jusqu'aux phases 4 et 5.

## Écarts backend signalés, sans contournement

- Aucun schéma d'erreur publié dans `openapi.json` (ADR-004).
- `POST /auth/refresh-token` ne déclare ni corps ni paramètre alors qu'il lit
  `Authorization: Bearer <refreshToken>`.
- Une requête sans jeton renvoie `403`, pas `401` (ADR-005).

Détail dans `06-API-CONTRAT.md`, section « Écarts constatés ».
