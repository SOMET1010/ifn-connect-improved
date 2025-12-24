#!/bin/bash

################################################################################
# Script de Restore - IFN Connect
# Description: Restauration de la base de données depuis un backup
# Auteur: Lead Engineer
# Date: 24 décembre 2025
# Usage: ./restore-db.sh <backup_file>
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Configuration
BACKUP_DIR="/home/ubuntu/ifn-connect-improved/backups"
LOG_FILE="/home/ubuntu/ifn-connect-improved/logs/restore.log"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

# Vérifier les arguments
if [ $# -eq 0 ]; then
    log_error "Usage: $0 <backup_file>"
    log_info "Backups disponibles:"
    ls -lh "$BACKUP_DIR"/ifn_connect_backup_*.sql.gz 2>/dev/null || echo "Aucun backup trouvé"
    exit 1
fi

BACKUP_FILE="$1"

# Vérifier si le fichier existe
if [ ! -f "$BACKUP_FILE" ]; then
    # Essayer dans le dossier backups
    if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
    else
        log_error "Fichier de backup introuvable: $BACKUP_FILE"
        exit 1
    fi
fi

# Créer le dossier de logs
mkdir -p "$(dirname "$LOG_FILE")"

log "========================================="
log "Démarrage de la restauration"
log "========================================="
log "Fichier: $BACKUP_FILE"

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

# Parser DATABASE_URL
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

log "Configuration:"
log "  - Hôte: $DB_HOST:$DB_PORT"
log "  - Base: $DB_NAME"
log "  - Utilisateur: $DB_USER"

# Vérifier l'intégrité du backup
log "Vérification de l'intégrité du backup..."
if ! gzip -t "$BACKUP_FILE"; then
    log_error "Le fichier de backup est corrompu"
    exit 1
fi
log_success "Intégrité du backup vérifiée"

# Demander confirmation
log_warning "⚠️  ATTENTION: Cette opération va ÉCRASER toutes les données actuelles!"
log_info "Base de données: $DB_NAME sur $DB_HOST"
read -p "Êtes-vous sûr de vouloir continuer? (tapez 'OUI' en majuscules): " CONFIRMATION

if [ "$CONFIRMATION" != "OUI" ]; then
    log_warning "Restauration annulée par l'utilisateur"
    exit 0
fi

# Créer un backup de sécurité avant restore
SAFETY_BACKUP="$BACKUP_DIR/pre_restore_safety_$(date +%Y%m%d_%H%M%S).sql.gz"
log "Création d'un backup de sécurité avant restore..."
if mysqldump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --password="$DB_PASS" \
    --single-transaction \
    --databases "$DB_NAME" \
    | gzip > "$SAFETY_BACKUP"; then
    log_success "Backup de sécurité créé: $(basename "$SAFETY_BACKUP")"
else
    log_error "Échec de la création du backup de sécurité"
    exit 1
fi

# Effectuer la restauration
log "Restauration en cours..."
if gunzip < "$BACKUP_FILE" | mysql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --password="$DB_PASS"; then
    
    log_success "Restauration terminée avec succès"
else
    log_error "Échec de la restauration"
    log_warning "Vous pouvez restaurer le backup de sécurité: $SAFETY_BACKUP"
    exit 1
fi

# Vérifier que la base est accessible
log "Vérification de la base de données..."
if mysql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --password="$DB_PASS" \
    --database="$DB_NAME" \
    -e "SELECT COUNT(*) FROM merchants;" > /dev/null 2>&1; then
    
    MERCHANT_COUNT=$(mysql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --user="$DB_USER" \
        --password="$DB_PASS" \
        --database="$DB_NAME" \
        -N -e "SELECT COUNT(*) FROM merchants;")
    
    log_success "Base de données accessible"
    log_info "Nombre de marchands: $MERCHANT_COUNT"
else
    log_error "La base de données n'est pas accessible après restore"
    exit 1
fi

log "========================================="
log_success "Restauration terminée avec succès"
log "Backup de sécurité conservé: $SAFETY_BACKUP"
log "========================================="

exit 0
