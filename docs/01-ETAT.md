# État courant

- Dernière mise à jour : 2026-08-19 — session 1
- Phase en cours : 4 · Shell — terminée
- Branche de travail : feat/layout-shell
- Dernier commit : ca29238 — feat(layout): add the application shell, 404 and 403 pages
- Backend requis démarré : oui — `http://localhost:8080/api/v1`
- Prochaine action précise : relecture d'ensemble des phases 2 à 4, puis ouvrir la phase 5 (authentification).

## Fait dans cette phase

- Coquille applicative : `Topbar`, `Sidebar`, `FilAriane`, zone de contenu. Toutes les routes
  en sont enfants.
- Structure de navigation déclarée une seule fois, alignée sur les modules du backend.
  Les entrées sans écran restent visibles mais inertes ; celles réservées à un rôle
  disparaissent pour qui ne l'a pas.
- Fil d'Ariane construit depuis l'URL, avec les libellés métier.
- Page 404 et page 403. La 403 est celle vers laquelle `gardeRole` redirigeait déjà.
- Transitions de route via l'API View Transitions, réduites à un fondu court, plus
  restauration de la position de défilement.
- Navigation en tiroir sous 48 rem, avec voile de fermeture.
- Indicateur d'activité dans le bandeau, alimenté par `ServiceChargement` : pas de spinner
  plein écran qui masquerait le contenu déjà affiché.
- 80 tests.

## Reste à faire dans cette phase

- Rien.

## Points bloquants / en attente de ma validation

1. **Relecture d'ensemble** — les phases 2, 3 et 4 ont été enchaînées sans validation
   intermédiaire, sur consigne de continuer en autonomie. À relire d'un bloc.
2. **Visibilité du dépôt** — passage en public refusé : compte Maintainer (40), GitLab exige
   Owner (50). À faire via `Settings → General → Visibility`.
3. **`@types/node` ajouté sans validation** (ADR-010). Aucun code embarqué. À confirmer.
4. **Route `/connexion`** encore inexistante : l'intercepteur de rafraîchissement et
   `gardeAuthentification` y redirigent. Elle arrive en phase 5.

## Écarts backend signalés, sans contournement

- Aucun schéma d'erreur publié dans `openapi.json` (ADR-004).
- `POST /auth/refresh-token` ne déclare ni corps ni paramètre alors qu'il lit
  `Authorization: Bearer <refreshToken>`.
- Une requête sans jeton renvoie `403`, pas `401` (ADR-005).

Détail dans `06-API-CONTRAT.md`, section « Écarts constatés ».
