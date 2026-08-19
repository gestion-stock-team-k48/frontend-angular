# Interdits — garde-fous du projet

Ces règles priment sur toute autre considération. À lire au début de chaque session.

1. **Ne pas modifier le backend**, ni aucun fichier hors du dossier `frontend-angular`.

2. **Ne pas inventer d'endpoint, de champ ou de code d'erreur.** Tout vient d'`openapi.json`.
   Si quelque chose manque côté backend : s'arrêter et le signaler. Ne jamais contourner avec
   des données factices dans du code de production.

3. **Ne pas versionner de fichier d'agent IA** ni faire apparaître un outil IA dans
   l'historique Git. `.gitignore` et `.githooks/commit-msg` verrouillent les deux.

4. **Ne pas commiter** : `.env`, `node_modules/`, `dist/`, `coverage/`, `.angular/`,
   `openapi.json`, secrets, jetons, captures d'écran de test.

5. **Ne pas lancer de serveur bloquant** (`ng serve`, `npm start`). Les tests visuels se font
   sur la machine du mainteneur : donner la commande exacte et ce qu'il faut vérifier, puis
   attendre. Les commandes non bloquantes (`build`, `lint`, `test --run`) sont autorisées.

6. **Ne pas ajouter de dépendance** sans la proposer avec sa justification, son poids et son
   alternative. Zéro bibliothèque de composants clé en main (Material, PrimeNG, Bootstrap) :
   elles cassent la personnalisation des couleurs, qui est l'exigence centrale du produit.

7. **Pas de `any`**, pas de `@ts-ignore`, pas de `!` non-null assertion sans commentaire
   justifiant.

8. **Pas de valeur codée en dur** : couleur, durée, espacement, URL, libellé métier. Tout
   passe par les tokens ou la configuration.

9. **Pas de refonte spontanée** d'un travail déjà validé. Proposer, puis attendre la décision.

10. **Pas de phase sautée**, pas d'anticipation « pendant que j'y suis ».

11. **Ne jamais terminer une session** sans avoir mis à jour `01-ETAT.md` et `08-JOURNAL.md`.

12. **En cas de conflit** entre une instruction du brief et ce que révèle le code ou la
    spécification : s'arrêter et demander. Ne pas trancher seul.
