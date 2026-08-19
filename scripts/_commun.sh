#!/usr/bin/env bash
# Fonctions partagées par les scripts du projet : couleurs, étapes numérotées, rapport final.
# Ce fichier n'est jamais exécuté directement, il est sourcé.

set -uo pipefail

if [ -t 1 ]; then
  C_OK=$'\033[0;32m'; C_KO=$'\033[0;31m'; C_SKIP=$'\033[0;33m'
  C_TITRE=$'\033[1;36m'; C_GRIS=$'\033[0;90m'; C_RAZ=$'\033[0m'
else
  C_OK=''; C_KO=''; C_SKIP=''; C_TITRE=''; C_GRIS=''; C_RAZ=''
fi

RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEBUT=$SECONDS

ETAPE_NUM=0
ETAPES_TOTAL=0
declare -a RAPPORT_LIBELLE=()
declare -a RAPPORT_VALEUR=()
declare -a RAPPORT_STATUT=()
NB_OK=0
NB_KO=0
NB_IGNORE=0

titre() {
  printf '\n%s%s%s\n' "$C_TITRE" "$1" "$C_RAZ"
  printf '%s%s%s\n' "$C_GRIS" "$(printf '─%.0s' $(seq 1 60))" "$C_RAZ"
}

etape() {
  ETAPE_NUM=$((ETAPE_NUM + 1))
  printf '\n%s[%d/%d]%s %s\n' "$C_TITRE" "$ETAPE_NUM" "$ETAPES_TOTAL" "$C_RAZ" "$1"
}

detail() { printf '%s      %s%s\n' "$C_GRIS" "$1" "$C_RAZ"; }

# consigner <libellé> <valeur> <OK|ÉCHEC|IGNORÉ>
consigner() {
  RAPPORT_LIBELLE+=("$1")
  RAPPORT_VALEUR+=("$2")
  RAPPORT_STATUT+=("$3")
  case "$3" in
    OK)      NB_OK=$((NB_OK + 1));     printf '      %s→ OK%s        %s\n' "$C_OK" "$C_RAZ" "$2" ;;
    ÉCHEC)   NB_KO=$((NB_KO + 1));     printf '      %s→ ÉCHEC%s     %s\n' "$C_KO" "$C_RAZ" "$2" ;;
    IGNORÉ)  NB_IGNORE=$((NB_IGNORE + 1)); printf '      %s→ IGNORÉ%s    %s\n' "$C_SKIP" "$C_RAZ" "$2" ;;
  esac
}

duree_lisible() {
  local s=$1
  if [ "$s" -lt 60 ]; then printf '%d s' "$s"; else printf '%d m %02d s' $((s / 60)) $((s % 60)); fi
}

# rapport <titre>
rapport() {
  local titre_rapport="$1"
  local largeur=56
  local i statut couleur
  printf '\n%s%s%s\n' "$C_TITRE" "$(printf '=%.0s' $(seq 1 $largeur))" "$C_RAZ"
  printf '%s %s%s\n' "$C_TITRE" "$titre_rapport" "$C_RAZ"
  printf '%s%s%s\n' "$C_TITRE" "$(printf '=%.0s' $(seq 1 $largeur))" "$C_RAZ"
  for i in "${!RAPPORT_LIBELLE[@]}"; do
    statut="${RAPPORT_STATUT[$i]}"
    case "$statut" in
      OK) couleur="$C_OK" ;; ÉCHEC) couleur="$C_KO" ;; *) couleur="$C_SKIP" ;;
    esac
    printf ' %-22s : %-20s %s[%s]%s\n' \
      "${RAPPORT_LIBELLE[$i]}" "${RAPPORT_VALEUR[$i]}" "$couleur" "$statut" "$C_RAZ"
  done
  printf '%s\n' "$(printf -- '-%.0s' $(seq 1 $largeur))"
  printf ' %-22s : %s\n' "Durée totale" "$(duree_lisible $((SECONDS - DEBUT)))"
  printf ' %-22s : %d/%d' "Étapes réussies" "$NB_OK" "${#RAPPORT_LIBELLE[@]}"
  [ "$NB_IGNORE" -gt 0 ] && printf '   (%d ignorée(s))' "$NB_IGNORE"
  printf '\n'
  printf '%s%s%s\n\n' "$C_TITRE" "$(printf '=%.0s' $(seq 1 $largeur))" "$C_RAZ"
  [ "$NB_KO" -eq 0 ]
}

# Vérifie que la version de Node correspond à .nvmrc et aux exigences d'Angular CLI 22.
verifier_node() {
  local attendue actuelle
  attendue="$(tr -d '[:space:]' < "$RACINE/.nvmrc" 2>/dev/null || echo '')"
  actuelle="$(node --version 2>/dev/null | tr -d 'v')"
  if [ -z "$actuelle" ]; then
    detail "Node introuvable dans le PATH."
    return 1
  fi
  if [ -n "$attendue" ] && [ "$actuelle" != "$attendue" ]; then
    detail "Version installée : v$actuelle — attendue : v$attendue (.nvmrc)."
    detail "Corriger avec : nvm use"
    return 1
  fi
  return 0
}
