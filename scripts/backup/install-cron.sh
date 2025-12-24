#!/bin/bash

################################################################################
# Script d'Installation du Cron Job - IFN Connect
# Description: Configure le backup automatique quotidien à 2h00
# Auteur: Lead Engineer
# Date: 24 décembre 2025
################################################################################

set -e

echo "========================================="
echo "Installation du Cron Job de Backup"
echo "========================================="

# Chemin absolu du script de backup
BACKUP_SCRIPT="/home/ubuntu/ifn-connect-improved/scripts/backup/backup-db.sh"
CRON_LOG="/home/ubuntu/ifn-connect-improved/logs/cron.log"

# Vérifier que le script existe
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "❌ Erreur: Script de backup introuvable: $BACKUP_SCRIPT"
    exit 1
fi

# Vérifier que le script est exécutable
if [ ! -x "$BACKUP_SCRIPT" ]; then
    echo "⚠️  Le script n'est pas exécutable. Ajout des permissions..."
    chmod +x "$BACKUP_SCRIPT"
fi

# Créer le dossier de logs
mkdir -p "$(dirname "$CRON_LOG")"

# Ligne du cron job (tous les jours à 2h00)
CRON_LINE="0 2 * * * $BACKUP_SCRIPT >> $CRON_LOG 2>&1"

# Vérifier si le cron job existe déjà
if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
    echo "⚠️  Le cron job existe déjà"
    echo "Cron jobs actuels:"
    crontab -l | grep "$BACKUP_SCRIPT"
    
    read -p "Voulez-vous le remplacer? (o/n): " REPLACE
    if [ "$REPLACE" != "o" ]; then
        echo "Installation annulée"
        exit 0
    fi
    
    # Supprimer l'ancien cron job
    crontab -l | grep -v "$BACKUP_SCRIPT" | crontab -
    echo "✅ Ancien cron job supprimé"
fi

# Ajouter le nouveau cron job
(crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -

echo "✅ Cron job installé avec succès"
echo ""
echo "Configuration:"
echo "  - Heure: 2h00 du matin (tous les jours)"
echo "  - Script: $BACKUP_SCRIPT"
echo "  - Logs: $CRON_LOG"
echo ""
echo "Cron jobs actuels:"
crontab -l

echo ""
echo "========================================="
echo "Installation terminée"
echo "========================================="
echo ""
echo "Pour tester immédiatement le backup:"
echo "  $BACKUP_SCRIPT"
echo ""
echo "Pour voir les logs du cron:"
echo "  tail -f $CRON_LOG"
echo ""
echo "Pour désinstaller le cron job:"
echo "  crontab -e  # puis supprimer la ligne"

exit 0
