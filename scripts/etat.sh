#!/usr/bin/env bash
# Affiche l'état courant du dépôt en un coup d'œil.
# Usage : ./scripts/etat.sh

. "$(dirname "${BASH_SOURCE[0]}")/_commun.sh"
cd "$RACINE" || exit 1

extraire() { grep -m1 "^- $1" docs/01-ETAT.md 2>/dev/null | sed "s/^- $1[[:space:]]*:[[:space:]]*//"; }

titre "ÉTAT COURANT — frontend-angular"

printf ' %s : %s\n' "$(pad 'Branche' 18)"        "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '—')"
printf ' %s : %s\n' "$(pad 'Phase' 18)"          "$(extraire 'Phase en cours')"
printf ' %s : %s\n' "$(pad 'Mise à jour' 18)"    "$(extraire 'Dernière mise à jour')"
printf ' %s : %s\n' "$(pad 'Prochaine action' 18)" "$(extraire 'Prochaine action précise')"

MODIFIES="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
if [ "$MODIFIES" -eq 0 ]; then
  printf ' %s : %spropre%s\n' "$(pad 'Copie de travail' 18)" "$C_OK" "$C_RAZ"
else
  printf ' %s : %s%s fichier(s) non commité(s)%s\n' "$(pad 'Copie de travail' 18)" "$C_SKIP" "$MODIFIES" "$C_RAZ"
fi

URL_API="${API_BASE_URL:-http://localhost:8080/api/v1}"
CODE_HTTP="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "$URL_API/v3/api-docs" 2>/dev/null || echo '000')"
if [ "$CODE_HTTP" = "200" ]; then
  printf ' %s : %sjoignable%s (%s)\n' "$(pad 'Backend' 18)" "$C_OK" "$C_RAZ" "$URL_API"
else
  printf ' %s : %sinjoignable%s (HTTP %s sur %s)\n' "$(pad 'Backend' 18)" "$C_KO" "$C_RAZ" "$CODE_HTTP" "$URL_API"
fi

titre "5 DERNIERS COMMITS"
git --no-pager log --oneline --decorate -5 2>/dev/null || printf ' (aucun commit)\n'

titre "POINTS EN ATTENTE"
sed -n '/^## Points bloquants/,/^## /p' docs/01-ETAT.md 2>/dev/null | tail -n +2 | sed '/^## /d;/^$/d' || true

titre "REPRENDRE LE TRAVAIL"
printf ' 1. nvm use\n'
printf ' 2. ./scripts/bootstrap.sh   (dépendances, hooks, spec OpenAPI)\n'
printf ' 3. lire docs/01-ETAT.md, docs/03-INTERDITS.md, docs/02-CONVENTIONS.md\n'
printf ' 4. repartir de la ligne « Prochaine action précise » ci-dessus\n'
printf '\n'
