#!/usr/bin/env bash
# Installation et vérification de l'environnement de développement.
# Usage : ./scripts/bootstrap.sh

. "$(dirname "${BASH_SOURCE[0]}")/_commun.sh"
cd "$RACINE" || exit 1

ETAPES_TOTAL=7
titre "BOOTSTRAP — frontend-angular"

# ── 1. Node ────────────────────────────────────────────────────────────────────
etape "Vérification de la version de Node"
if verifier_node; then
  consigner "Node" "$(node --version)" "OK"
else
  consigner "Node" "$(node --version 2>/dev/null || echo 'absent')" "ÉCHEC"
fi

# ── 2. npm ─────────────────────────────────────────────────────────────────────
etape "Vérification de npm"
if VERSION_NPM="$(npm --version 2>/dev/null)"; then
  consigner "npm" "$VERSION_NPM" "OK"
else
  consigner "npm" "absent" "ÉCHEC"
fi

# ── 3. Dépendances ─────────────────────────────────────────────────────────────
etape "Installation des dépendances"
if [ -f package-lock.json ]; then
  detail "package-lock.json présent : installation reproductible (npm ci)."
  COMMANDE_INSTALL=(npm ci --no-fund --no-audit)
else
  detail "Pas de package-lock.json : installation classique (npm install)."
  COMMANDE_INSTALL=(npm install --no-fund --no-audit)
fi
if "${COMMANDE_INSTALL[@]}" 2>&1 | sed 's/^/      /'; then
  NB_PAQUETS="$(ls node_modules 2>/dev/null | wc -l | tr -d ' ')"
  consigner "Dépendances" "$NB_PAQUETS paquets" "OK"
else
  consigner "Dépendances" "installation en échec" "ÉCHEC"
fi

# ── 4. Angular CLI ─────────────────────────────────────────────────────────────
etape "Vérification de l'Angular CLI local"
if VERSION_NG="$(node -p "require('./node_modules/@angular/cli/package.json').version" 2>/dev/null)"; then
  consigner "Angular CLI" "$VERSION_NG" "OK"
else
  consigner "Angular CLI" "introuvable" "ÉCHEC"
fi

# ── 5. Hooks git ───────────────────────────────────────────────────────────────
etape "Activation des hooks git versionnés"
if git rev-parse --git-dir >/dev/null 2>&1; then
  git config core.hooksPath .githooks
  chmod +x .githooks/* 2>/dev/null
  detail "core.hooksPath = $(git config --get core.hooksPath)"
  consigner "Hooks git" "actifs" "OK"
else
  detail "Ce dossier n'est pas un dépôt git."
  consigner "Hooks git" "hors dépôt git" "IGNORÉ"
fi

# ── 6. Fichier d'agent IA local ────────────────────────────────────────────────
etape "Régénération du pense-bête local (non versionné)"
if [ -f CLAUDE.md ]; then
  detail "CLAUDE.md déjà présent, laissé tel quel."
  consigner "Pense-bête local" "déjà présent" "IGNORÉ"
else
  cat > CLAUDE.md <<'PENSE_BETE'
Avant toute action, lis dans l'ordre :
1. docs/01-ETAT.md
2. docs/03-INTERDITS.md
3. docs/02-CONVENTIONS.md
Puis résume l'état en 5 lignes et attends le feu vert.
PENSE_BETE
  detail "CLAUDE.md régénéré depuis docs/00-BRIEF.md."
  consigner "Pense-bête local" "régénéré" "OK"
fi

# ── 7. Backend et spécification OpenAPI ────────────────────────────────────────
etape "Vérification du backend et récupération de la spécification"
URL_API="${API_BASE_URL:-http://localhost:8080/api/v1}"
detail "Cible : $URL_API/v3/api-docs"
CODE_HTTP="$(curl -s -o openapi.json -w '%{http_code}' --max-time 5 "$URL_API/v3/api-docs" 2>/dev/null || echo '000')"
if [ "$CODE_HTTP" = "200" ]; then
  TAILLE="$(wc -c < openapi.json | tr -d ' ')"
  detail "openapi.json récupéré ($TAILLE octets)."
  consigner "Spec OpenAPI" "$TAILLE o" "OK"
else
  rm -f openapi.json
  detail "Backend injoignable ou réponse inattendue (HTTP $CODE_HTTP)."
  detail "Démarrer l'infrastructure : cd ../gestion-stock-backend && docker compose up -d"
  detail "Puis le backend : ./mvnw spring-boot:run"
  consigner "Spec OpenAPI" "HTTP $CODE_HTTP" "IGNORÉ"
fi

rapport "RAPPORT DE BOOTSTRAP — frontend-angular"
