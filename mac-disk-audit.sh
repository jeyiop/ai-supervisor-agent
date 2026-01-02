#!/bin/bash
#
# Mac Studio Disk Audit Script
# Ce script analyse votre Mac et génère un rapport détaillé sur l'espace disque
# et les fichiers par type (musique, photos, PDF, Word, Excel)
#
# Usage: ./mac-disk-audit.sh [chemin_optionnel]
# Par défaut, analyse /Users/$(whoami)
#

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Répertoire à analyser
SEARCH_PATH="${1:-/Users/$(whoami)}"

# Répertoires à exclure (applications natives et système)
EXCLUDE_PATHS=(
    "/Applications"
    "/System"
    "/Library"
    "*/Library/Application Support"
    "*/Library/Caches"
    "*/.Trash"
    "*/node_modules"
    "*/.git"
    "*/Xcode.app"
    "*/Contents/MacOS"
    "*/Contents/Frameworks"
    "*/.npm"
    "*/.composer"
)

# Construire la chaîne d'exclusion pour find
build_exclude_string() {
    local exclude=""
    for path in "${EXCLUDE_PATHS[@]}"; do
        exclude="$exclude -path \"$path\" -prune -o"
    done
    echo "$exclude"
}

# Fonction pour convertir les octets en format lisible
human_readable() {
    local bytes=$1
    if [[ $bytes -lt 1024 ]]; then
        echo "${bytes} B"
    elif [[ $bytes -lt 1048576 ]]; then
        echo "$(echo "scale=2; $bytes/1024" | bc) KB"
    elif [[ $bytes -lt 1073741824 ]]; then
        echo "$(echo "scale=2; $bytes/1048576" | bc) MB"
    else
        echo "$(echo "scale=2; $bytes/1073741824" | bc) GB"
    fi
}

# Fonction pour compter et calculer la taille des fichiers
analyze_files() {
    local name=$1
    shift
    local extensions=("$@")

    local find_cmd="find \"$SEARCH_PATH\" -type f \\("
    local first=true

    for ext in "${extensions[@]}"; do
        if $first; then
            find_cmd="$find_cmd -iname \"*.$ext\""
            first=false
        else
            find_cmd="$find_cmd -o -iname \"*.$ext\""
        fi
    done
    find_cmd="$find_cmd \\) 2>/dev/null"

    # Compter les fichiers et calculer la taille totale
    local files=$(eval "$find_cmd" | grep -v -E "(^/Applications|^/System|^/Library|/Library/Caches|/Library/Application Support|/.Trash|/node_modules|/.git|/Contents/MacOS|/Contents/Frameworks)")

    if [[ -z "$files" ]]; then
        echo "0|0"
        return
    fi

    local count=$(echo "$files" | wc -l | tr -d ' ')
    local total_size=0

    while IFS= read -r file; do
        if [[ -f "$file" ]]; then
            local size=$(stat -f%z "$file" 2>/dev/null || echo 0)
            total_size=$((total_size + size))
        fi
    done <<< "$files"

    echo "$count|$total_size"
}

# Fonction pour lister les plus gros fichiers d'une catégorie
list_largest_files() {
    local name=$1
    shift
    local extensions=("$@")
    local limit=10

    local find_cmd="find \"$SEARCH_PATH\" -type f \\("
    local first=true

    for ext in "${extensions[@]}"; do
        if $first; then
            find_cmd="$find_cmd -iname \"*.$ext\""
            first=false
        else
            find_cmd="$find_cmd -o -iname \"*.$ext\""
        fi
    done
    find_cmd="$find_cmd \\) -print0 2>/dev/null"

    eval "$find_cmd" | grep -zv -E "(^/Applications|^/System|^/Library|/Library/Caches|/Library/Application Support|/.Trash|/node_modules|/.git|/Contents/MacOS|/Contents/Frameworks)" | xargs -0 stat -f '%z %N' 2>/dev/null | sort -rn | head -$limit
}

# Début du rapport
echo ""
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${BLUE}║          AUDIT DISQUE MAC STUDIO - RAPPORT DETAILLE           ║${NC}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Date de l'audit:${NC} $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "${CYAN}Répertoire analysé:${NC} $SEARCH_PATH"
echo ""

# Informations système
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}  INFORMATIONS SYSTEME${NC}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Nom du Mac
echo -e "${YELLOW}Nom de l'ordinateur:${NC} $(scutil --get ComputerName 2>/dev/null || hostname)"

# Modèle
if command -v system_profiler &> /dev/null; then
    echo -e "${YELLOW}Modèle:${NC} $(system_profiler SPHardwareDataType 2>/dev/null | grep "Model Name" | awk -F': ' '{print $2}')"
fi

echo ""

# Espace disque
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}  ESPACE DISQUE${NC}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

df -h / | tail -1 | awk '{
    printf "  Total:      %s\n", $2
    printf "  Utilisé:    %s (%s)\n", $3, $5
    printf "  Disponible: %s\n", $4
}'

echo ""

# Barre de progression de l'espace utilisé
USED_PERCENT=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
BAR_WIDTH=50
FILLED=$((USED_PERCENT * BAR_WIDTH / 100))
EMPTY=$((BAR_WIDTH - FILLED))

echo -n "  ["
for ((i=0; i<FILLED; i++)); do
    if [[ $USED_PERCENT -gt 90 ]]; then
        echo -ne "${RED}█${NC}"
    elif [[ $USED_PERCENT -gt 70 ]]; then
        echo -ne "${YELLOW}█${NC}"
    else
        echo -ne "${GREEN}█${NC}"
    fi
done
for ((i=0; i<EMPTY; i++)); do
    echo -n "░"
done
echo "] ${USED_PERCENT}%"

echo ""

# Analyse des fichiers par type
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}  ANALYSE PAR TYPE DE FICHIER${NC}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}Note: Les fichiers d'applications natives sont exclus${NC}"
echo ""

# Musique
echo -e "${PURPLE}Analyse des fichiers musique...${NC}"
MUSIC_EXTS=("mp3" "m4a" "aac" "flac" "wav" "aiff" "ogg" "wma")
MUSIC_RESULT=$(analyze_files "Musique" "${MUSIC_EXTS[@]}")
MUSIC_COUNT=$(echo "$MUSIC_RESULT" | cut -d'|' -f1)
MUSIC_SIZE=$(echo "$MUSIC_RESULT" | cut -d'|' -f2)

# Photos
echo -e "${PURPLE}Analyse des fichiers photo...${NC}"
PHOTO_EXTS=("jpg" "jpeg" "png" "heic" "heif" "raw" "cr2" "nef" "arw" "gif" "tiff" "tif" "bmp" "webp")
PHOTO_RESULT=$(analyze_files "Photos" "${PHOTO_EXTS[@]}")
PHOTO_COUNT=$(echo "$PHOTO_RESULT" | cut -d'|' -f1)
PHOTO_SIZE=$(echo "$PHOTO_RESULT" | cut -d'|' -f2)

# PDF
echo -e "${PURPLE}Analyse des fichiers PDF...${NC}"
PDF_EXTS=("pdf")
PDF_RESULT=$(analyze_files "PDF" "${PDF_EXTS[@]}")
PDF_COUNT=$(echo "$PDF_RESULT" | cut -d'|' -f1)
PDF_SIZE=$(echo "$PDF_RESULT" | cut -d'|' -f2)

# Word
echo -e "${PURPLE}Analyse des fichiers Word...${NC}"
WORD_EXTS=("doc" "docx" "odt" "rtf")
WORD_RESULT=$(analyze_files "Word" "${WORD_EXTS[@]}")
WORD_COUNT=$(echo "$WORD_RESULT" | cut -d'|' -f1)
WORD_SIZE=$(echo "$WORD_RESULT" | cut -d'|' -f2)

# Excel
echo -e "${PURPLE}Analyse des fichiers Excel...${NC}"
EXCEL_EXTS=("xls" "xlsx" "csv" "ods")
EXCEL_RESULT=$(analyze_files "Excel" "${EXCEL_EXTS[@]}")
EXCEL_COUNT=$(echo "$EXCEL_RESULT" | cut -d'|' -f1)
EXCEL_SIZE=$(echo "$EXCEL_RESULT" | cut -d'|' -f2)

echo ""
echo -e "${BOLD}${BLUE}┌─────────────────────────────────────────────────────────────────┐${NC}"
echo -e "${BOLD}${BLUE}│                    RESULTATS DE L'AUDIT                         │${NC}"
echo -e "${BOLD}${BLUE}├─────────────────┬──────────────────┬──────────────────────────────┤${NC}"
echo -e "${BOLD}${BLUE}│ Type            │ Nombre fichiers  │ Taille totale              │${NC}"
echo -e "${BOLD}${BLUE}├─────────────────┼──────────────────┼──────────────────────────────┤${NC}"

printf "${BLUE}│${NC} ${YELLOW}Musique${NC}         ${BLUE}│${NC} %16s ${BLUE}│${NC} %28s ${BLUE}│${NC}\n" "$MUSIC_COUNT" "$(human_readable $MUSIC_SIZE)"
printf "${BLUE}│${NC} ${YELLOW}Photos${NC}          ${BLUE}│${NC} %16s ${BLUE}│${NC} %28s ${BLUE}│${NC}\n" "$PHOTO_COUNT" "$(human_readable $PHOTO_SIZE)"
printf "${BLUE}│${NC} ${YELLOW}PDF${NC}             ${BLUE}│${NC} %16s ${BLUE}│${NC} %28s ${BLUE}│${NC}\n" "$PDF_COUNT" "$(human_readable $PDF_SIZE)"
printf "${BLUE}│${NC} ${YELLOW}Word${NC}            ${BLUE}│${NC} %16s ${BLUE}│${NC} %28s ${BLUE}│${NC}\n" "$WORD_COUNT" "$(human_readable $WORD_SIZE)"
printf "${BLUE}│${NC} ${YELLOW}Excel${NC}           ${BLUE}│${NC} %16s ${BLUE}│${NC} %28s ${BLUE}│${NC}\n" "$EXCEL_COUNT" "$(human_readable $EXCEL_SIZE)"

echo -e "${BOLD}${BLUE}├─────────────────┴──────────────────┴──────────────────────────────┤${NC}"

TOTAL_COUNT=$((MUSIC_COUNT + PHOTO_COUNT + PDF_COUNT + WORD_COUNT + EXCEL_COUNT))
TOTAL_SIZE=$((MUSIC_SIZE + PHOTO_SIZE + PDF_SIZE + WORD_SIZE + EXCEL_SIZE))

printf "${BLUE}│${NC} ${BOLD}${GREEN}TOTAL${NC}                              %10s fichiers - %s ${BLUE}│${NC}\n" "$TOTAL_COUNT" "$(human_readable $TOTAL_SIZE)"
echo -e "${BOLD}${BLUE}└──────────────────────────────────────────────────────────────────┘${NC}"

echo ""

# Top 10 des plus gros fichiers par catégorie
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}  TOP 10 DES PLUS GROS FICHIERS PAR CATEGORIE${NC}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BOLD}${YELLOW}  MUSIQUE:${NC}"
list_largest_files "Musique" "${MUSIC_EXTS[@]}" | while read size path; do
    echo "    $(human_readable $size) - $(basename "$path")"
done
echo ""

echo -e "${BOLD}${YELLOW}  PHOTOS:${NC}"
list_largest_files "Photos" "${PHOTO_EXTS[@]}" | while read size path; do
    echo "    $(human_readable $size) - $(basename "$path")"
done
echo ""

echo -e "${BOLD}${YELLOW}  PDF:${NC}"
list_largest_files "PDF" "${PDF_EXTS[@]}" | while read size path; do
    echo "    $(human_readable $size) - $(basename "$path")"
done
echo ""

echo -e "${BOLD}${YELLOW}  WORD:${NC}"
list_largest_files "Word" "${WORD_EXTS[@]}" | while read size path; do
    echo "    $(human_readable $size) - $(basename "$path")"
done
echo ""

echo -e "${BOLD}${YELLOW}  EXCEL:${NC}"
list_largest_files "Excel" "${EXCEL_EXTS[@]}" | while read size path; do
    echo "    $(human_readable $size) - $(basename "$path")"
done
echo ""

# Résumé des répertoires les plus volumineux
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}  TOP 10 REPERTOIRES LES PLUS VOLUMINEUX${NC}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

du -sh "$SEARCH_PATH"/* 2>/dev/null | sort -rh | head -10 | while read size path; do
    echo "    $size - $(basename "$path")"
done

echo ""
echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${BLUE}║                    FIN DU RAPPORT D'AUDIT                      ║${NC}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Génération du fichier de rapport
REPORT_FILE="$HOME/Desktop/mac-audit-$(date '+%Y%m%d-%H%M%S').txt"
echo -e "${CYAN}Un rapport détaillé a été généré: ${REPORT_FILE}${NC}"
echo ""
