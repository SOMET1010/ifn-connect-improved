#!/bin/bash

###############################################################################
# Script d'Installation du Cron Job pour Backups Automatiques
#
# Objectif : Configurer un backup quotidien à 3h du matin
# Usage : sudo bash scripts/setup-backup-cron.sh
###############################################################################

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}📅 Configuration du cron job pour backups automatiques...${NC}"

# Déterminer le chemin absolu du projet
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_SCRIPT="${PROJECT_DIR}/scripts/backup-db.sh"

echo "📁 Répertoire du projet : ${PROJECT_DIR}"
echo "📜 Script de backup : ${BACKUP_SCRIPT}"

# Vérifier que le script de backup existe
if [ ! -f "${BACKUP_SCRIPT}" ]; then
    echo -e "${RED}❌ Erreur : Le script ${BACKUP_SCRIPT} n'existe pas${NC}"
    exit 1
fi

# Rendre le script exécutable
chmod +x "${BACKUP_SCRIPT}"
echo -e "${GREEN}✅ Script de backup rendu exécutable${NC}"

# Vérifier que cron est installé
if ! command -v crontab &> /dev/null; then
    echo -e "${RED}❌ Erreur : cron n'est pas installé${NC}"
    echo "Installez cron avec : sudo apt-get install cron"
    exit 1
fi

# Créer la ligne cron (tous les jours à 3h du matin)
CRON_LINE="0 3 * * * ${BACKUP_SCRIPT} >> /var/log/ifn-backup.log 2>&1"

# Vérifier si le cron job existe déjà
if crontab -l 2>/dev/null | grep -q "${BACKUP_SCRIPT}"; then
    echo -e "${YELLOW}⚠️  Le cron job existe déjà${NC}"
    echo "Cron job actuel :"
    crontab -l | grep "${BACKUP_SCRIPT}"

    read -p "Voulez-vous le remplacer ? (o/N) : " REPLACE
    if [ "$REPLACE" != "o" ] && [ "$REPLACE" != "O" ]; then
        echo -e "${YELLOW}❌ Installation annulée${NC}"
        exit 0
    fi

    # Supprimer l'ancien cron job
    (crontab -l | grep -v "${BACKUP_SCRIPT}") | crontab -
    echo -e "${GREEN}✅ Ancien cron job supprimé${NC}"
fi

# Ajouter le nouveau cron job
(crontab -l 2>/dev/null; echo "${CRON_LINE}") | crontab -

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Cron job installé avec succès${NC}"
    echo ""
    echo "Configuration :"
    echo "  📅 Fréquence : Tous les jours à 3h00"
    echo "  📜 Script : ${BACKUP_SCRIPT}"
    echo "  📋 Logs : /var/log/ifn-backup.log"
    echo ""
    echo "Liste des cron jobs actuels :"
    crontab -l
else
    echo -e "${RED}❌ Erreur lors de l'installation du cron job${NC}"
    exit 1
fi

# Créer le fichier de log s'il n'existe pas
sudo touch /var/log/ifn-backup.log
sudo chmod 666 /var/log/ifn-backup.log
echo -e "${GREEN}✅ Fichier de log créé : /var/log/ifn-backup.log${NC}"

# Test du script de backup (optionnel)
echo ""
read -p "Voulez-vous tester le script de backup maintenant ? (o/N) : " TEST
if [ "$TEST" = "o" ] || [ "$TEST" = "O" ]; then
    echo -e "${YELLOW}🧪 Test du script de backup...${NC}"
    bash "${BACKUP_SCRIPT}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ CONFIGURATION TERMINÉE${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "Prochaines étapes :"
echo "  1. Vérifiez les logs : tail -f /var/log/ifn-backup.log"
echo "  2. Testez le restore : bash scripts/restore-db.sh <backup-file>"
echo "  3. Le premier backup automatique aura lieu demain à 3h00"
echo ""

exit 0
