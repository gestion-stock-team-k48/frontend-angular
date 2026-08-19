# État courant

- Dernière mise à jour : 2026-08-19 — session 1
- Phase en cours : 3 · Design system — terminée
- Branche de travail : feat/ui-design-system
- Dernier commit : 3627c43 — feat(parametres): add the appearance screen
- Backend requis démarré : oui — `http://localhost:8080/api/v1`
- Prochaine action précise : ouvrir la phase 4 (shell applicatif, sidebar, topbar, fil d'Ariane, 404 et 403).

## Fait dans cette phase

- Huit primitives dans `shared/ui` : jauge de seuil, bouton, champ, pastille, squelette,
  état vide, modale, pile de notifications.
- Jauge de seuil, élément signature : échelle plafonnée à deux fois le seuil, repère toujours
  au même endroit, trois tailles, `role="meter"` et libellé parlant.
- Modale sur l'élément natif `<dialog>` : piège de focus, Échap, voile et inertie fournis par
  le navigateur.
- Écran `/parametres/apparence`, lazy-loadé, sur les directives d'onglets d'Angular Aria.
  Il sert à la fois de réglage du thème et de démonstration du design system.
- Style des contrôles de saisie déplacé dans la feuille de base : plus aucun `::ng-deep`.
- 73 tests.

## Reste à faire dans cette phase

- Rien.

## Points bloquants / en attente de ma validation

1. **Visibilité du dépôt** — passage en public refusé : le compte est Maintainer (40) sur le
   groupe, GitLab réserve ce changement au rôle Owner (50). À faire par un Owner, ou via
   `Settings → General → Visibility`.
2. **`@types/node` ajouté sans validation** (ADR-010). Aucun code embarqué. À confirmer.
3. **Trois phases enchaînées sans validation intermédiaire** (2, 3 et bientôt 4), sur consigne
   de continuer en autonomie. À relire d'un bloc.
4. **Routes `/connexion` et `/acces-refuse`** référencées par les gardes, encore inexistantes.
   Elles arrivent en phases 4 et 5.

## Écarts backend signalés, sans contournement

- Aucun schéma d'erreur publié dans `openapi.json` (ADR-004).
- `POST /auth/refresh-token` ne déclare ni corps ni paramètre alors qu'il lit
  `Authorization: Bearer <refreshToken>`.
- Une requête sans jeton renvoie `403`, pas `401` (ADR-005).

Détail dans `06-API-CONTRAT.md`, section « Écarts constatés ».
