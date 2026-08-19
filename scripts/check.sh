#!/usr/bin/env bash
# Vérification complète avant commit : lint, styles, typecheck, tests, build.
# Usage : ./scripts/check.sh
# Aucune étape n'interrompt le script : tout est exécuté, le bilan est rendu à la fin.

. "$(dirname "${BASH_SOURCE[0]}")/_commun.sh"
cd "$RACINE" || exit 1

ETAPES_TOTAL=5
JOURNAL="$RACINE/.check-logs"
rm -rf "$JOURNAL" && mkdir -p "$JOURNAL"

titre "VÉRIFICATION — frontend-angular"
detail "Journaux détaillés conservés dans .check-logs/ (non versionné)"

# ── 1. ESLint ──────────────────────────────────────────────────────────────────
etape "ESLint (TypeScript et gabarits)"
if npm run --silent lint > "$JOURNAL/lint.txt" 2>&1; then
  ERR_LINT=0
  AVERT_LINT="$(grep -cE '  warning  ' "$JOURNAL/lint.txt" || true)"
  consigner "ESLint" "0 erreur / $AVERT_LINT avert." "OK"
else
  ERR_LINT="$(grep -cE '  error  ' "$JOURNAL/lint.txt" || true)"
  AVERT_LINT="$(grep -cE '  warning  ' "$JOURNAL/lint.txt" || true)"
  tail -25 "$JOURNAL/lint.txt" | sed 's/^/      /'
  consigner "ESLint" "$ERR_LINT erreur(s) / $AVERT_LINT avert." "ÉCHEC"
fi

# ── 2. Stylelint ───────────────────────────────────────────────────────────────
etape "Stylelint (SCSS)"
if npm run --silent lint:styles > "$JOURNAL/styles.txt" 2>&1; then
  consigner "Stylelint" "0 erreur" "OK"
else
  ERR_STYLE="$(grep -cE '✖' "$JOURNAL/styles.txt" || true)"
  tail -25 "$JOURNAL/styles.txt" | sed 's/^/      /'
  consigner "Stylelint" "$ERR_STYLE erreur(s)" "ÉCHEC"
fi

# ── 3. Typecheck ───────────────────────────────────────────────────────────────
etape "Vérification des types (tsc, sans émission)"
if npm run --silent typecheck > "$JOURNAL/types.txt" 2>&1; then
  consigner "Typecheck" "OK" "OK"
else
  ERR_TS="$(grep -cE 'error TS[0-9]+' "$JOURNAL/types.txt" || true)"
  tail -25 "$JOURNAL/types.txt" | sed 's/^/      /'
  consigner "Typecheck" "$ERR_TS erreur(s)" "ÉCHEC"
fi

# ── 4. Tests ───────────────────────────────────────────────────────────────────
etape "Tests unitaires (Vitest)"
if npm run --silent test:ci > "$JOURNAL/tests.txt" 2>&1; then
  BILAN_TESTS="$(grep -oE '[0-9]+ passed( \([0-9]+\))?' "$JOURNAL/tests.txt" | tail -1)"
  consigner "Tests" "${BILAN_TESTS:-tous passés}" "OK"
else
  BILAN_TESTS="$(grep -oE '[0-9]+ failed' "$JOURNAL/tests.txt" | tail -1)"
  tail -30 "$JOURNAL/tests.txt" | sed 's/^/      /'
  consigner "Tests" "${BILAN_TESTS:-échec}" "ÉCHEC"
fi

# ── 5. Build de production ─────────────────────────────────────────────────────
etape "Build de production"
if npm run --silent build > "$JOURNAL/build.txt" 2>&1; then
  POIDS="$(grep -oE 'Initial total[^0-9]*[0-9.]+ [kKMG]?B' "$JOURNAL/build.txt" | tail -1 | grep -oE '[0-9.]+ [kKMG]?B')"
  consigner "Build" "${POIDS:-OK}" "OK"
else
  tail -30 "$JOURNAL/build.txt" | sed 's/^/      /'
  consigner "Build" "échec" "ÉCHEC"
fi

if rapport "RAPPORT DE VÉRIFICATION — frontend-angular"; then
  exit 0
else
  printf '%sAu moins une vérification a échoué. Ne pas commiter en l'\''état.%s\n\n' "$C_KO" "$C_RAZ"
  exit 1
fi
