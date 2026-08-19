# État courant

- Dernière mise à jour : 2026-08-19 — session 1
- Phase en cours : aucune. Les onze phases du plan déduit (ADR-015) et l'affinage — visuel,
  alignement des tableaux, jeu de démonstration — sont fusionnés dans `develop`.
- Branche de travail : `develop`, à jour
- Dernier commit : voir `git log -1` — tableau de bord et documentation
- Backend requis démarré : oui — `http://localhost:8080/api/v1`
- Prochaine action précise : regarder l'application à l'écran, avec le jeu de démonstration
  en place (voir « À vérifier »). Ensuite, au choix : relecture d'ensemble des phases 2 à 11,
  fusion dans `main` et tag `v1.0.0`, ou remontée des seize écarts backend à l'équipe
  concernée — l'écart nº 16 bloque les ventes hors de la première entreprise.

## Fait depuis la dernière entrée

**Affinage visuel** — couleur, relief et mouvement, détaillés dans `08-JOURNAL.md` et
`05-DESIGN-SYSTEM.md`.

**Alignement des tableaux corrigé.** Le remplissage et l'alignement des cellules vivaient
dans le composant `app-tableau`, hors de portée des lignes projetées : l'entête recevait sa
mise en forme, le corps n'en recevait aucune. Une colonne annoncée à droite s'affichait à
gauche. Les règles rejoignent la feuille globale, à côté de celles des lignes, qui souffraient
du même mal.

**Codes attribués par le serveur retirés de l'interface.** Le code d'une commande et celui
d'une vente sont générés par le backend, seul à savoir ce qui est déjà pris dans l'entreprise.
Les deux champs disparaissent des formulaires, et les requêtes ne les portent plus.

**Jeu de démonstration** — `npm run seed`. Il passe par l'API publique, jamais par la base :
les règles métier sont donc appliquées par le serveur, et le jeu est cohérent par
construction. Douze entreprises, chacune avec 12 catégories, 150 articles, 24 clients,
10 fournisseurs, 5 comptes, son stock initial, ses corrections, ses commandes des deux côtés
et ses ventes. Tous les comptes partagent `GestionStock2026!` — y compris ceux à qui le
serveur avait envoyé un mot de passe temporaire, que le script récupère dans Mailpit et
remplace comme le ferait la personne à sa première connexion.

## Deux défauts backend trouvés en construisant le jeu

1. **Le code d'une vente est unique globalement, mais généré par entreprise** — voir l'écart
   nº 16 de `06-API-CONTRAT.md`. **C'est bloquant en multi-tenant** : passé la première
   entreprise inscrite, plus aucune vente ne peut être enregistrée. Le seed fournit un code
   explicite pour contourner ; l'interface, elle, ne le fait pas.
2. Rien d'autre : les transitions d'état, les mouvements de stock déclenchés par une
   livraison et les refus de stock insuffisant se sont comportés exactement comme documenté.

## Base de développement

Les essais du seed ont laissé quelques entreprises partielles (`…x1`, `…x2`, `…x3`) et le jeu
complet est posé sous l'étiquette `demo`. Aucun endpoint ne supprime une entreprise : pour
repartir propre, c'est côté backend, et cela t'appartient —

    cd ../gestion-stock-backend && docker compose down -v && docker compose up -d
    ./mvnw spring-boot:run
    cd ../frontend-angular && npm run seed

## Points bloquants / en attente de ma validation

1. **Découpage des phases 6 à 11 déduit, pas donné** (ADR-015). À confirmer ou corriger.
2. **Push impossible** — jeton GitLab invalide (`glab auth status` : « Invalid token
   provided »). Les phases 5 à 9 sont commitées en local seulement. Créer un jeton avec les
   portées `api` et `write_repository`, puis `glab auth login` depuis un terminal, et
   `git push origin main develop`.
3. **Relecture d'ensemble** — les phases 2 à 9 ont été enchaînées sans validation
   intermédiaire.
4. **Écrans partagés** (ADR-018, ADR-019) — tiers et commandes mis en commun parce que leurs
   DTO ne diffèrent que par un nom. À confirmer, ou à défaire si les modules doivent diverger.
5. **Restrictions d'interface faute de contrôle serveur** — modification d'une commande
   bornée à `EN_PREPARATION` (ADR-019), suppression de son propre compte refusée (ADR-020).
   À faire remonter à l'équipe backend : le second cas laisse aussi supprimer le dernier
   administrateur de l'entreprise, ce que l'interface ne peut pas empêcher.
6. **Visibilité du dépôt** — passage en public refusé : rôle Maintainer, GitLab exige Owner.
7. **`@types/node` ajouté sans validation** (ADR-010).

## Écarts backend signalés, sans contournement

- Aucun schéma d'erreur publié dans `openapi.json` (ADR-004).
- `POST /auth/refresh-token` ne déclare ni corps ni paramètre alors qu'il lit
  `Authorization: Bearer <refreshToken>`.
- Une requête sans jeton renvoie `403`, pas `401` (ADR-005).
- `POST /utilisateurs/change-password` répond `401` sur un mauvais ancien mot de passe (ADR-013).
- Aucune recherche ni filtre sur les listes : articles, tiers, commandes, ventes.
- `GET /categories` n'est pas paginé.
- Les photos s'envoient mais aucun endpoint ne permet de les relire.
- Aucune liste globale des mouvements de stock (ADR-017) ; l'historique ignore le tri demandé ;
  les alertes recalculent tout le catalogue à chaque appel.
- `PUT` sur une commande ne vérifie pas son état (ADR-019).
- `DELETE /ventes/{id}` échoue toujours : l'endpoint est publié mais ne peut pas aboutir.
- `VenteResponse` ne porte aucun total, contrairement aux commandes.
- `DELETE /utilisateurs/{id}` ne protège ni le compte courant ni le dernier administrateur.
- Aucun endpoint n'envoie de logo d'entreprise, alors que le DTO porte un champ `photo`.

Détail dans `06-API-CONTRAT.md`, section « Écarts constatés ».
