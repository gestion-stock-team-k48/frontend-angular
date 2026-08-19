#!/usr/bin/env bash
# Récupère la spécification OpenAPI du backend et régénère les types TypeScript.
# Usage : ./scripts/sync-api.sh
# Variable d'environnement : API_BASE_URL (défaut http://localhost:8080/api/v1)

. "$(dirname "${BASH_SOURCE[0]}")/_commun.sh"
cd "$RACINE" || exit 1

ETAPES_TOTAL=4
URL_API="${API_BASE_URL:-http://localhost:8080/api/v1}"
CIBLE="src/app/core/api/generated/api.ts"

titre "SYNCHRONISATION DU CONTRAT API"
detail "Backend : $URL_API"

# ── 1. Récupération de la spécification ────────────────────────────────────────
etape "Récupération de $URL_API/v3/api-docs"
CODE_HTTP="$(curl -s -o openapi.json -w '%{http_code}' --max-time 10 "$URL_API/v3/api-docs" 2>/dev/null || echo '000')"
if [ "$CODE_HTTP" != "200" ]; then
  rm -f openapi.json
  detail "Réponse inattendue : HTTP $CODE_HTTP."
  detail "Démarrer l'infrastructure : cd ../gestion-stock-backend && docker compose up -d"
  detail "Puis le backend : ./mvnw spring-boot:run"
  consigner "Spec OpenAPI" "HTTP $CODE_HTTP" "ÉCHEC"
  rapport "RAPPORT DE SYNCHRONISATION API"
  exit 1
fi
consigner "Spec OpenAPI" "$(wc -c < openapi.json | tr -d ' ') o" "OK"

# ── 2. Inventaire ──────────────────────────────────────────────────────────────
etape "Inventaire du contrat"
if INVENTAIRE="$(node -e '
  const s = require("./openapi.json");
  const chemins = Object.keys(s.paths ?? {}).length;
  const ops = Object.values(s.paths ?? {}).reduce((n, c) => n + Object.keys(c).length, 0);
  const schemas = Object.keys(s.components?.schemas ?? {}).length;
  console.log(`${chemins} chemins, ${ops} opérations, ${schemas} schémas`);
' 2>/dev/null)"; then
  detail "$INVENTAIRE"
  consigner "Contrat" "$INVENTAIRE" "OK"
else
  consigner "Contrat" "spécification illisible" "ÉCHEC"
fi

# ── 3. Génération des types ────────────────────────────────────────────────────
etape "Génération des types TypeScript"
mkdir -p "$(dirname "$CIBLE")"
if npx --yes openapi-typescript openapi.json --output "$CIBLE" 2>&1 | sed 's/^/      /'; then
  NB_LIGNES="$(wc -l < "$CIBLE" | tr -d ' ')"
  consigner "Types générés" "$NB_LIGNES lignes" "OK"
else
  consigner "Types générés" "génération en échec" "ÉCHEC"
fi

# ── 4. Détection d'un schéma d'erreur ──────────────────────────────────────────
# Voir ADR-004 : tant que le backend ne publie pas de schéma d'erreur, le type de la
# réponse d'erreur est déclaré à la main dans core/http. Ce contrôle signale le jour où
# ce contournement devient inutile.
etape "Contrôle de la publication d'un schéma d'erreur"
if node -e '
  const s = require("./openapi.json");
  const noms = Object.keys(s.components?.schemas ?? {});
  const trouve = noms.filter((n) => /error|probleme|problem/i.test(n));
  if (trouve.length) { console.log(trouve.join(", ")); process.exit(0); }
  process.exit(1);
' > "$RACINE/.schema-erreur" 2>/dev/null; then
  detail "Schéma(s) d'erreur publié(s) : $(cat "$RACINE/.schema-erreur")"
  detail "ADR-004 peut être clos : remplacer le type manuel de core/http par le type généré."
  consigner "Schéma d'erreur" "publié" "OK"
else
  detail "Aucun schéma d'erreur dans la spécification — le type manuel reste nécessaire (ADR-004)."
  consigner "Schéma d'erreur" "toujours absent" "IGNORÉ"
fi
rm -f "$RACINE/.schema-erreur"

rapport "RAPPORT DE SYNCHRONISATION API"
