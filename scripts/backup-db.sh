#!/bin/bash

###############################################################################
# Script de Backup Automatique - Base de Données IFN Connect
# 
# Objectif : Sauvegarder quotidiennement la base de données MySQL/TiDB
# Stockage : S3 (avec rotation sur 30 jours)
# Fréquence : Quotidien à 3h du matin (via cron)
# 
# Usage : ./scripts/backup-db.sh
###############################################################################

set -e  # Arrêter en cas d'erreur
set -u  # Erreur si variable non définie

# Couleurs pour les logs
RED='\033[0:31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/ifn-backups"
BACKUP_FILENAME="ifn-connect-backup-${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"
S3_BUCKET_PATH="backups/database"
RETENTION_DAYS=30

# Charger les variables d'environnement
if [ -f "/home/ubuntu/ifn-connect-improved/.env" ]; then
    export $(grep -v '^#' /home/ubuntu/ifn-connect-improved/.env | xargs)
fi

# Vérifier que DATABASE_URL est défini
if [ -z "${DATABASE_URL:-}" ]; then
    echo -e "${RED}❌ Erreur : DATABASE_URL n'est pas défini${NC}"
    exit 1
fi

# Extraire les paramètres de connexion depuis DATABASE_URL
# Format: mysql://user:password@host:port/database
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo -e "${YELLOW}🔄 Démarrage du backup de la base de données...${NC}"
echo "📅 Date : $(date '+%Y-%m-%d %H:%M:%S')"
echo "🗄️  Base : ${DB_NAME}"
echo "🖥️  Hôte : ${DB_HOST}:${DB_PORT}"

# Créer le répertoire de backup
mkdir -p "${BACKUP_DIR}"

# Effectuer le backup avec mysqldump
echo -e "${YELLOW}📦 Création du dump SQL...${NC}"
mysqldump \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --user="${DB_USER}" \
    --password="${DB_PASS}" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --databases "${DB_NAME}" \
    | gzip > "${BACKUP_PATH}"

# Vérifier que le backup a été créé
if [ ! -f "${BACKUP_PATH}" ]; then
    echo -e "${RED}❌ Erreur : Le fichier de backup n'a pas été créé${NC}"
    exit 1
fi

BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
echo -e "${GREEN}✅ Dump SQL créé : ${BACKUP_SIZE}${NC}"

# Upload vers S3 (si configuré)
if [ -n "${BUILT_IN_FORGE_API_KEY:-}" ]; then
    echo -e "${YELLOW}☁️  Upload vers S3...${NC}"
    
    # Utiliser le helper S3 de Manus
    node -e "
    const fs = require('fs');
    const { storagePut } = require('../server/storage');
    
    (async () => {
        try {
            const fileBuffer = fs.readFileSync('${BACKUP_PATH}');
            const s3Key = '${S3_BUCKET_PATH}/${BACKUP_FILENAME}';
            const result = await storagePut(s3Key, fileBuffer, 'application/gzip');
            console.log('✅ Backup uploadé vers S3:', result.url);
            
            // Sauvegarder l'URL dans un fichier de métadonnées
            fs.writeFileSync('${BACKUP_DIR}/latest-backup.txt', result.url);
        } catch (error) {
            console.error('❌ Erreur upload S3:', error.message);
            process.exit(1);
        }
    })();
    "
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backup uploadé vers S3${NC}"
    else
        echo -e "${RED}❌ Erreur lors de l'upload S3${NC}"
        echo -e "${YELLOW}⚠️  Le backup local est conservé : ${BACKUP_PATH}${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  BUILT_IN_FORGE_API_KEY non défini, backup local uniquement${NC}"
fi

# Nettoyer les anciens backups locaux (> 7 jours)
echo -e "${YELLOW}🧹 Nettoyage des anciens backups locaux...${NC}"
find "${BACKUP_DIR}" -name "ifn-connect-backup-*.sql.gz" -type f -mtime +7 -delete
echo -e "${GREEN}✅ Anciens backups supprimés (> 7 jours)${NC}"

# Résumé final
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ BACKUP TERMINÉ AVEC SUCCÈS${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo "📁 Fichier : ${BACKUP_FILENAME}"
echo "📏 Taille : ${BACKUP_SIZE}"
echo "📍 Chemin local : ${BACKUP_PATH}"
if [ -f "${BACKUP_DIR}/latest-backup.txt" ]; then
    echo "☁️  URL S3 : $(cat ${BACKUP_DIR}/latest-backup.txt)"
fi
echo ""

exit 0
