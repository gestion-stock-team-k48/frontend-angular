# Livrer une version

Une image n'atteint Docker Hub que sur une étiquette. Un push sur `develop` construit
l'image et la passe au scanner — c'est ce qui prouve que le `Dockerfile` tient et que le
socle reste sain —, mais il ne publie rien. Publier est une décision, pas un effet de bord.

La même procédure vaut pour les deux dépôts, `frontend-angular` et `gestion-stock-backend`.
Ils portent des numéros de version indépendants : rien n'oblige à les livrer ensemble.

## Avant de livrer

Trois conditions, toutes vérifiables sans quitter le terminal :

```bash
git switch develop && git pull
./scripts/check.sh            # frontend ; côté backend : sh mvnw -B verify
gh run list --branch develop --limit 1
```

Le pipeline de `develop` doit être vert, quality gate SonarCloud compris — il fait désormais
échouer le job, un rapport envoyé ne suffit plus.

## Livrer

```bash
git switch main && git pull
git merge --no-ff develop -m "Merge branch 'develop' into main"
git push origin main

git tag -a v1.2.0 -m "v1.2.0 — ce que cette version apporte"
git push origin v1.2.0
```

Le tag part **après** `main`, et il pointe sur le commit de fusion. L'ordre compte : un tag
poussé en premier désigne un commit que la branche stable ne contient pas encore.

Le message d'étiquette n'est pas une formalité. C'est ce que lira quelqu'un qui cherche
pourquoi la version en production se comporte ainsi — dites ce qu'elle apporte, pas
« release ».

## Ce qui part tout seul

Le pipeline se déclenche sur `refs/tags/v*.*.*` et publie cinq étiquettes d’image :

| Étiquette     | Ce qu'elle désigne                        |
| ------------- | ----------------------------------------- |
| `1.2.0`       | cette version exactement                  |
| `1.2`         | la dernière correction de cette mineure   |
| `1`           | la dernière version de cette majeure      |
| `latest`      | la dernière version publiée               |
| `sha-abc1234` | le commit, pour revenir à un point précis |

En `linux/amd64` et `linux/arm64`. L'analyse SonarCloud est sautée sur un tag : le commit a
déjà été analysé sur `develop`, et SonarCloud traite une référence de tag comme une branche
éphémère.

## Numéroter

SemVer, sur le sens que ça a pour qui utilise l'application :

- **majeure** — l'application ne s'utilise plus pareil, ou le contrat d'API change de façon
  incompatible ;
- **mineure** — quelque chose de neuf, sans rien casser ;
- **corrective** — un défaut réparé, rien d'autre.

## Déployer la version livrée

Dans `gestion-stock-deploiement`, nommer la version dans `.env` plutôt que de suivre
`latest` — un déploiement doit pouvoir se rejouer à l'identique :

```bash
TAG_BACKEND=1.2.0
TAG_FRONTEND=1.2.0
```

```bash
docker compose pull && docker compose up -d
```

## Revenir en arrière

Les étiquettes précédentes restent sur Docker Hub. Remettre l'ancienne dans `.env`, puis
`docker compose up -d`. Aucune reconstruction, aucun pipeline à attendre.

Ne jamais déplacer une étiquette de version déjà publiée : quelqu'un l'a peut-être déployée,
et deux images différentes sous un même nom rendent tout diagnostic impossible. Pour corriger
une version livrée, on en publie une nouvelle.
