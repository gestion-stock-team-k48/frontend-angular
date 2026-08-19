#!/usr/bin/env bash
# Remplit le backend d'un jeu de démonstration, via son API publique.
# Le backend et son infrastructure doivent tourner : voir README.
set -euo pipefail

racine="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$racine"

if [ -f .nvmrc ] && command -v nvm >/dev/null 2>&1; then
  nvm use >/dev/null
fi

exec node scripts/seed.mjs "$@"
