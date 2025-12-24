#!/bin/bash

################################################################################
# Script de Backup Automatique - IFN Connect
# Description: Sauvegarde quotidienne de la base de données MySQL/TiDB
# Auteur: Lead Engineer
# Date: 24 décembre 2025
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Configuration
BACKUP_DIR="/home/ubuntu/ifn-connect-improved/backups"
LOG_FILE="/home/ubuntu/ifn-connect-improved/logs/backup.log"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="ifn_connect_backup_${DATE}.sql.gz"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Créer les dossiers nécessaires
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

log "========================================="
log "Démarrage du backup de la base de données"
log "========================================="

# Récupérer les variables d'environnement depuis .env
if [ -f "/home/ubuntu/ifn-connect-improved/.env" ]; then
    export $(grep -v '^#' /home/ubuntu/ifn-connect-improved/.env | xargs)
else
    log_error "Fichier .env introuvable"
    exit 1
fi

# Vérifier que DATABASE_URL est défini
if [ -z "${DATABASE_URL:-}" ]; then
    log_error "DATABASE_URL non défini dans .env"
    exit 1
fi

# Parser DATABASE_URL (format: mysql://user:password@host:port/database)
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

log "Configuration:"
log "  - Hôte: $DB_HOST:$DB_PORT"
log "  - Base: $DB_NAME"
log "  - Utilisateur: $DB_USER"
log "  - Fichier: $BACKUP_FILE"

# Effectuer le backup avec mysqldump
log "Création du backup..."
if mysqldump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --password="$DB_PASS" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --databases "$DB_NAME" \
    | gzip > "$BACKUP_DIR/$BACKUP_FILE"; then
    
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    log_success "Backup créé avec succès: $BACKUP_FILE ($BACKUP_SIZE)"
else
    log_error "Échec de la création du backup"
    exit 1
fi

# Vérifier l'intégrité du fichier
log "Vérification de l'intégrité du backup..."
if gzip -t "$BACKUP_DIR/$BACKUP_FILE"; then
    log_success "Intégrité du backup vérifiée"
else
    log_error "Le fichier de backup est corrompu"
    exit 1
fi

# Rotation des backups (supprimer les backups > RETENTION_DAYS jours)
log "Rotation des backups (conservation: $RETENTION_DAYS jours)..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "ifn_connect_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
if [ "$DELETED_COUNT" -gt 0 ]; then
    log_warning "$DELETED_COUNT ancien(s) backup(s) supprimé(s)"
else
    log "Aucun ancien backup à supprimer"
fi

# Statistiques finales
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "ifn_connect_backup_*.sql.gz" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

log "========================================="
log "Backup terminé avec succès"
log "  - Backups totaux: $TOTAL_BACKUPS"
log "  - Espace utilisé: $TOTAL_SIZE"
log "========================================="

exit 0
