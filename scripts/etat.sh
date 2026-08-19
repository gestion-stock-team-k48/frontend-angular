#!/usr/bin/env bash
# Affiche l'état courant du dépôt en un coup d'œil.
# Usage : ./scripts/etat.sh

. "$(dirname "${BASH_SOURCE[0]}")/_commun.sh"
cd "$RACINE" || exit 1

extraire() { grep -m1 "^- $1" docs/01-ETAT.md 2>/dev/null | sed "s/^- $1[[:space:]]*:[[:space:]]*//"; }

titre "ÉTAT COURANT — frontend-angular"

printf ' %-22s : %s\n' "Branche"        "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '—')"
printf ' %-22s : %s\n' "Phase"          "$(extraire 'Phase en cours')"
printf ' %-22s : %s\n' "Mise à jour"    "$(extraire 'Dernière mise à jour')"
printf ' %-22s : %s\n' "Prochaine action" "$(extraire 'Prochaine action précise')"

MODIFIES="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
if [ "$MODIFIES" -eq 0 ]; then
  printf ' %-22s : %spropre%s\n' "Copie de travail" "$C_OK" "$C_RAZ"
else
  printf ' %-22s : %s%s fichier(s) non commité(s)%s\n' "Copie de travail" "$C_SKIP" "$MODIFIES" "$C_RAZ"
fi

URL_API="${API_BASE_URL:-http://localhost:8080/api/v1}"
CODE_HTTP="$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "$URL_API/v3/api-docs" 2>/dev/null || echo '000')"
if [ "$CODE_HTTP" = "200" ]; then
  printf ' %-22s : %sjoignable%s (%s)\n' "Backend" "$C_OK" "$C_RAZ" "$URL_API"
else
  printf ' %-22s : %sinjoignable%s (HTTP %s sur %s)\n' "Backend" "$C_KO" "$C_RAZ" "$CODE_HTTP" "$URL_API"
fi

titre "5 DERNIERS COMMITS"
git --no-pager log --oneline --decorate -5 2>/dev/null || printf ' (aucun commit)\n'

titre "POINTS EN ATTENTE"
sed -n '/^## Points bloquants/,$p' docs/01-ETAT.md 2>/dev/null | tail -n +2 | sed '/^$/d' || true
printf '\n'
