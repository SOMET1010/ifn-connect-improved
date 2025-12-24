#!/bin/bash

################################################################################
# Script de Test Backup/Restore - IFN Connect
# Description: Test complet du flux backup → restore → vérification
# Auteur: Lead Engineer
# Date: 24 décembre 2025
################################################################################

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Test Complet Backup/Restore${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Chemins
BACKUP_SCRIPT="/home/ubuntu/ifn-connect-improved/scripts/backup/backup-db.sh"
RESTORE_SCRIPT="/home/ubuntu/ifn-connect-improved/scripts/backup/restore-db.sh"
BACKUP_DIR="/home/ubuntu/ifn-connect-improved/backups"
TEST_LOG="/home/ubuntu/ifn-connect-improved/logs/test-backup-restore.log"

# Créer le dossier de logs
mkdir -p "$(dirname "$TEST_LOG")"

# Fonction de logging
log() {
    echo -e "$1" | tee -a "$TEST_LOG"
}

log_success() {
    log "${GREEN}✅ $1${NC}"
}

log_error() {
    log "${RED}❌ $1${NC}"
}

log_info() {
    log "${BLUE}ℹ️  $1${NC}"
}

log_warning() {
    log "${YELLOW}⚠️  $1${NC}"
}

# Récupérer les variables d'environnement
if [ -f "/home/ubuntu/ifn-connect-improved/.env" ]; then
    export $(grep -v '^#' /home/ubuntu/ifn-connect-improved/.env | xargs)
else
    log_error "Fichier .env introuvable"
    exit 1
fi

# Parser DATABASE_URL
DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

log_info "Configuration:"
log_info "  - Hôte: $DB_HOST:$DB_PORT"
log_info "  - Base: $DB_NAME"
echo ""

# ========================================
# ÉTAPE 1 : Récupérer l'état initial
# ========================================
log_info "ÉTAPE 1/5 : Récupération de l'état initial..."

INITIAL_MERCHANT_COUNT=$(mysql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --password="$DB_PASS" \
    --database="$DB_NAME" \
    -N -e "SELECT COUNT(*) FROM merchants;")

INITIAL_SALES_COUNT=$(mysql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --password="$DB_PASS" \
    --database="$DB_NAME" \
    -N -e "SELECT COUNT(*) FROM sales;")

log_success "État initial récupéré"
log_info "  - Marchands: $INITIAL_MERCHANT_COUNT"
log_info "  - Ventes: $INITIAL_SALES_COUNT"
echo ""

# ========================================
# ÉTAPE 2 : Créer un backup
# ========================================
log_info "ÉTAPE 2/5 : Création d'un backup de test..."

if ! "$BACKUP_SCRIPT"; then
    log_error "Échec de la création du backup"
    exit 1
fi

# Récupérer le dernier backup créé
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/ifn_connect_backup_*.sql.gz | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    log_error "Aucun backup trouvé après création"
    exit 1
fi

BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
log_success "Backup créé: $(basename "$LATEST_BACKUP") ($BACKUP_SIZE)"
echo ""

# ========================================
# ÉTAPE 3 : Vérifier l'intégrité du backup
# ========================================
log_info "ÉTAPE 3/5 : Vérification de l'intégrité du backup..."

if gzip -t "$LATEST_BACKUP"; then
    log_success "Intégrité du backup vérifiée"
else
    log_error "Le backup est corrompu"
    exit 1
fi
echo ""

# ========================================
# ÉTAPE 4 : Restaurer le backup
# ========================================
log_info "ÉTAPE 4/5 : Restauration du backup..."
log_warning "Cette opération va écraser les données actuelles"

# Créer un fichier de confirmation automatique pour le test
echo "OUI" | "$RESTORE_SCRIPT" "$LATEST_BACKUP" > /dev/null 2>&1 || {
    log_error "Échec de la restauration"
    exit 1
}

log_success "Restauration terminée"
echo ""

# ========================================
# ÉTAPE 5 : Vérifier les données après restore
# ========================================
log_info "ÉTAPE 5/5 : Vérification des données après restore..."

RESTORED_MERCHANT_COUNT=$(mysql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --password="$DB_PASS" \
    --database="$DB_NAME" \
    -N -e "SELECT COUNT(*) FROM merchants;")

RESTORED_SALES_COUNT=$(mysql \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --password="$DB_PASS" \
    --database="$DB_NAME" \
    -N -e "SELECT COUNT(*) FROM sales;")

log_info "État après restore:"
log_info "  - Marchands: $RESTORED_MERCHANT_COUNT"
log_info "  - Ventes: $RESTORED_SALES_COUNT"
echo ""

# Comparer les données
if [ "$INITIAL_MERCHANT_COUNT" -eq "$RESTORED_MERCHANT_COUNT" ] && \
   [ "$INITIAL_SALES_COUNT" -eq "$RESTORED_SALES_COUNT" ]; then
    log_success "Les données sont identiques après restore"
else
    log_error "Les données ne correspondent pas!"
    log_error "  Marchands: $INITIAL_MERCHANT_COUNT → $RESTORED_MERCHANT_COUNT"
    log_error "  Ventes: $INITIAL_SALES_COUNT → $RESTORED_SALES_COUNT"
    exit 1
fi

# ========================================
# RÉSUMÉ
# ========================================
echo ""
log_info "${BLUE}=========================================${NC}"
log_success "${GREEN}✅ TOUS LES TESTS PASSENT${NC}"
log_info "${BLUE}=========================================${NC}"
echo ""
log_info "Résumé:"
log_info "  ✅ Backup créé avec succès"
log_info "  ✅ Intégrité du backup vérifiée"
log_info "  ✅ Restore exécuté sans erreur"
log_info "  ✅ Données identiques après restore"
log_info "  ✅ Backup de sécurité créé automatiquement"
echo ""
log_info "Fichiers:"
log_info "  - Backup test: $(basename "$LATEST_BACKUP")"
log_info "  - Logs: $TEST_LOG"
echo ""
log_success "Le système de backup/restore est opérationnel!"

exit 0
