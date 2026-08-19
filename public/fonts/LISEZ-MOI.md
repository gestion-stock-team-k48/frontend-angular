# Polices auto-hébergées

Ces fichiers sont servis par l'application, jamais chargés depuis un CDN : l'interface doit
s'afficher correctement sans accès Internet.

| Famille       | Graisses      | Rôle                               | Licence                   |
| ------------- | ------------- | ---------------------------------- | ------------------------- |
| Space Grotesk | 500, 700      | titres de page, chiffres clés      | SIL Open Font License 1.1 |
| IBM Plex Sans | 400, 500, 600 | interface                          | SIL Open Font License 1.1 |
| IBM Plex Mono | 400, 500      | codes article, quantités, montants | SIL Open Font License 1.1 |

Sous-ensemble latin uniquement, format `woff2`, récupérés depuis les paquets `@fontsource`.
Total : environ 140 ko.

Pour ajouter une graisse, récupérer le fichier correspondant puis déclarer le `@font-face`
dans `src/styles/_polices.scss`. Toute graisse non déclarée est synthétisée par le
navigateur, ce qui abîme l'alignement des chiffres : mieux vaut ajouter le fichier.
