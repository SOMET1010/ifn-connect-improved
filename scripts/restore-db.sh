#!/bin/bash

###############################################################################
# Script de Restore - Base de Données IFN Connect
# 
# Objectif : Restaurer la base de données depuis un backup
# Source : Backup local ou URL S3
# 
# Usage : 
#   ./scripts/restore-db.sh /tmp/ifn-backups/ifn-connect-backup-20251226_030000.sql.gz
#   ./scripts/restore-db.sh https://s3.amazonaws.com/.../backup.sql.gz
###############################################################################

set -e  # Arrêter en cas d'erreur
set -u  # Erreur si variable non définie

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier les arguments
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ Erreur : Aucun fichier de backup spécifié${NC}"
    echo ""
    echo "Usage :"
    echo "  $0 /chemin/vers/backup.sql.gz"
    echo "  $0 https://url-s3/backup.sql.gz"
    echo ""
    exit 1
fi

BACKUP_SOURCE="$1"
TEMP_DIR="/tmp/ifn-restore"
RESTORE_FILE="${TEMP_DIR}/restore.sql"

# Charger les variables d'environnement
if [ -f "/home/ubuntu/ifn-connect-improved/.env" ]; then
    export $(grep -v '^#' /home/ubuntu/ifn-connect-improved/.env | xargs)
fi

# Vérifier que DATABASE_URL est défini
if [ -z "${DATABASE_URL:-}" ]; then
    echo -e "${RED}❌ Erreur : DATABASE_URL n'est pas défini${NC}"
    exit 1
fi

# Extraire les paramètres de connexion
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo -e "${YELLOW}🔄 Démarrage du restore de la base de données...${NC}"
echo "📅 Date : $(date '+%Y-%m-%d %H:%M:%S')"
echo "🗄️  Base : ${DB_NAME}"
echo "🖥️  Hôte : ${DB_HOST}:${DB_PORT}"
echo "📦 Source : ${BACKUP_SOURCE}"
echo ""

# Confirmation avant restore
echo -e "${RED}⚠️  ATTENTION : Cette opération va ÉCRASER toutes les données actuelles !${NC}"
read -p "Êtes-vous sûr de vouloir continuer ? (tapez 'OUI' pour confirmer) : " CONFIRM

if [ "$CONFIRM" != "OUI" ]; then
    echo -e "${YELLOW}❌ Restore annulé${NC}"
    exit 0
fi

# Créer le répertoire temporaire
mkdir -p "${TEMP_DIR}"

# Télécharger ou copier le backup
if [[ "$BACKUP_SOURCE" == http* ]]; then
    echo -e "${YELLOW}📥 Téléchargement du backup depuis l'URL...${NC}"
    wget -q -O "${TEMP_DIR}/backup.sql.gz" "$BACKUP_SOURCE"
    BACKUP_FILE="${TEMP_DIR}/backup.sql.gz"
else
    if [ ! -f "$BACKUP_SOURCE" ]; then
        echo -e "${RED}❌ Erreur : Le fichier ${BACKUP_SOURCE} n'existe pas${NC}"
        exit 1
    fi
    BACKUP_FILE="$BACKUP_SOURCE"
fi

# Décompresser le backup
echo -e "${YELLOW}📦 Décompression du backup...${NC}"
gunzip -c "${BACKUP_FILE}" > "${RESTORE_FILE}"

RESTORE_SIZE=$(du -h "${RESTORE_FILE}" | cut -f1)
echo -e "${GREEN}✅ Backup décompressé : ${RESTORE_SIZE}${NC}"

# Vérifier l'intégrité du fichier SQL
echo -e "${YELLOW}🔍 Vérification de l'intégrité du fichier SQL...${NC}"
if ! head -n 1 "${RESTORE_FILE}" | grep -q "MySQL dump"; then
    echo -e "${RED}❌ Erreur : Le fichier ne semble pas être un dump MySQL valide${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Fichier SQL valide${NC}"

# Créer un backup de sécurité avant restore
echo -e "${YELLOW}💾 Création d'un backup de sécurité avant restore...${NC}"
SAFETY_BACKUP="${TEMP_DIR}/safety-backup-$(date +%Y%m%d_%H%M%S).sql.gz"
mysqldump \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --user="${DB_USER}" \
    --password="${DB_PASS}" \
    --single-transaction \
    --databases "${DB_NAME}" \
    | gzip > "${SAFETY_BACKUP}"
echo -e "${GREEN}✅ Backup de sécurité créé : ${SAFETY_BACKUP}${NC}"

# Effectuer le restore
echo -e "${YELLOW}🔄 Restore en cours...${NC}"
mysql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --user="${DB_USER}" \
    --password="${DB_PASS}" \
    < "${RESTORE_FILE}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Restore terminé avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors du restore${NC}"
    echo -e "${YELLOW}⚠️  Vous pouvez restaurer le backup de sécurité :${NC}"
    echo -e "${YELLOW}   mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p${DB_PASS} < <(gunzip -c ${SAFETY_BACKUP})${NC}"
    exit 1
fi

# Vérifier l'intégrité après restore
echo -e "${YELLOW}🔍 Vérification de l'intégrité après restore...${NC}"
TABLE_COUNT=$(mysql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --user="${DB_USER}" \
    --password="${DB_PASS}" \
    --database="${DB_NAME}" \
    --batch --skip-column-names \
    -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}'")

echo -e "${GREEN}✅ ${TABLE_COUNT} tables restaurées${NC}"

# Nettoyer les fichiers temporaires
echo -e "${YELLOW}🧹 Nettoyage des fichiers temporaires...${NC}"
rm -f "${RESTORE_FILE}"
if [[ "$BACKUP_SOURCE" == http* ]]; then
    rm -f "${TEMP_DIR}/backup.sql.gz"
fi

# Résumé final
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ RESTORE TERMINÉ AVEC SUCCÈS${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo "🗄️  Base de données : ${DB_NAME}"
echo "📊 Tables restaurées : ${TABLE_COUNT}"
echo "💾 Backup de sécurité : ${SAFETY_BACKUP}"
echo ""
echo -e "${YELLOW}⚠️  Pensez à redémarrer l'application pour prendre en compte les changements${NC}"
echo ""

exit 0
