# État courant

- Dernière mise à jour : 2026-08-19 — session 1
- Phase en cours : 10 · Administration — terminée, en attente de vérification visuelle
- Branche de travail : feat/administration
- Dernier commit : voir `git log -1` — tests et documentation de la phase 10
- Backend requis démarré : oui — `http://localhost:8080/api/v1`
- Prochaine action précise : vérifier les écrans d'administration à la main (voir
  « À vérifier »), puis fusionner dans `develop` et ouvrir la phase 11 · Tableau de bord.

## Fait dans cette phase

- `/entreprise` — fiche de l'entreprise courante, réservée aux administrateurs. Pas de logo :
  aucun endpoint ne l'envoie.
- `/utilisateurs` — liste paginée, création, modification, suppression. Aucun mot de passe
  n'est saisi : le serveur en génère un temporaire et l'envoie par email. Les comptes encore
  porteurs de ce mot de passe sont signalés.
- `/profil` — « Mon profil » : identité, adresse, envoi de photo. Email et rôles en lecture
  seule. Le nom dans le bandeau y mène désormais.
- Deux garde-fous d'interface : pas de suppression de son propre compte, photo limitée au
  sien (ADR-020).
- 225 tests.

## Reste à faire dans cette phase

- Rien de code. La vérification visuelle appartient au mainteneur.

## À vérifier à la main

    nvm use && npm start

Connecté avec un compte administrateur :

1. `/entreprise` → la fiche est pré-remplie ; modifier la ville, enregistrer, recharger la
   page : la valeur tient. Un code fiscal déjà pris affiche le message du backend sous le champ.
2. `/utilisateurs` → créer un compte : aucun champ mot de passe, et le message l'explique.
   Après création, l'email de mot de passe temporaire arrive dans Mailpit
   (`http://localhost:8025`).
3. Le nouveau compte apparaît avec la pastille « Temporaire ».
4. Se déconnecter, se connecter avec ce compte → l'application impose le changement de mot
   de passe, puis s'ouvre. Sa ligne passe à « Choisi ».
5. Avec ce compte non administrateur : `/utilisateurs` et `/entreprise` renvoient vers
   `/acces-refuse`, et les entrées correspondantes n'apparaissent pas dans la navigation.
6. `/profil` → modifier le prénom, enregistrer : le bandeau applicatif se met à jour aussitôt.
7. Envoyer une photo depuis le profil → « Photo enregistrée ». L'image ne peut pas être
   affichée (écart backend nº 6).
8. Sur `/utilisateurs`, la ligne du compte courant ne propose pas « Supprimer ».

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
