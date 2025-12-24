# 📦 Procédure de Backup/Restore - IFN Connect

**Date de création** : 24 décembre 2025  
**Responsable** : Lead Engineer  
**Objectif** : Sécuriser les données de la plateforme IFN Connect

---

## 🎯 Vue d'Ensemble

La plateforme IFN Connect dispose d'un système de **backup automatique quotidien** de la base de données MySQL/TiDB avec **rotation automatique** (conservation de 30 jours) et **procédure de restore testée**.

### Composants du Système
- **Script de backup** : `scripts/backup/backup-db.sh`
- **Script de restore** : `scripts/backup/restore-db.sh`
- **Dossier de backups** : `/home/ubuntu/ifn-connect-improved/backups/`
- **Logs** : `/home/ubuntu/ifn-connect-improved/logs/backup.log` et `restore.log`
- **Cron job** : Tous les jours à 2h00 du matin

---

## 📅 Backup Automatique

### Configuration du Cron Job

Le backup automatique est exécuté tous les jours à 2h00 du matin via cron.

**Ajouter le cron job** :
```bash
crontab -e
```

**Ligne à ajouter** :
```cron
0 2 * * * /home/ubuntu/ifn-connect-improved/scripts/backup/backup-db.sh >> /home/ubuntu/ifn-connect-improved/logs/cron.log 2>&1
```

**Vérifier les cron jobs actifs** :
```bash
crontab -l
```

### Exécution Manuelle

Pour créer un backup immédiatement :
```bash
cd /home/ubuntu/ifn-connect-improved
./scripts/backup/backup-db.sh
```

### Vérifier les Backups

**Lister tous les backups** :
```bash
ls -lh /home/ubuntu/ifn-connect-improved/backups/
```

**Vérifier les logs** :
```bash
tail -f /home/ubuntu/ifn-connect-improved/logs/backup.log
```

### Format des Fichiers

Les backups sont nommés selon le format :
```
ifn_connect_backup_YYYYMMDD_HHMMSS.sql.gz
```

Exemple : `ifn_connect_backup_20251224_020000.sql.gz`

---

## 🔄 Restauration (Restore)

### ⚠️ ATTENTION

La restauration **ÉCRASE TOUTES LES DONNÉES ACTUELLES** de la base de données. Un backup de sécurité est automatiquement créé avant chaque restore.

### Procédure de Restore

**1. Lister les backups disponibles** :
```bash
ls -lh /home/ubuntu/ifn-connect-improved/backups/
```

**2. Exécuter le script de restore** :
```bash
cd /home/ubuntu/ifn-connect-improved
./scripts/backup/restore-db.sh backups/ifn_connect_backup_20251224_020000.sql.gz
```

Ou simplement :
```bash
./scripts/backup/restore-db.sh ifn_connect_backup_20251224_020000.sql.gz
```

**3. Confirmer l'opération** :
Le script demande une confirmation. Tapez `OUI` en majuscules pour continuer.

**4. Vérifier les logs** :
```bash
tail -f /home/ubuntu/ifn-connect-improved/logs/restore.log
```

### Backup de Sécurité

Avant chaque restore, un backup de sécurité est automatiquement créé :
```
pre_restore_safety_YYYYMMDD_HHMMSS.sql.gz
```

En cas de problème, vous pouvez restaurer ce backup de sécurité.

---

## 🧪 Tests de la Procédure

### Test Complet (Backup → Restore → Vérification)

**1. Créer un backup de test** :
```bash
./scripts/backup/backup-db.sh
```

**2. Noter le nombre de marchands actuel** :
```bash
mysql -h <host> -P <port> -u <user> -p<password> -D <database> -e "SELECT COUNT(*) FROM merchants;"
```

**3. Restaurer le backup** :
```bash
./scripts/backup/restore-db.sh <backup_file>
```

**4. Vérifier que le nombre de marchands est identique** :
```bash
mysql -h <host> -P <port> -u <user> -p<password> -D <database> -e "SELECT COUNT(*) FROM merchants;"
```

**5. Vérifier l'intégrité des données** :
```bash
mysql -h <host> -P <port> -u <user> -p<password> -D <database> -e "SELECT * FROM merchants LIMIT 5;"
```

---

## 🔧 Maintenance

### Rotation des Backups

Les backups sont automatiquement supprimés après **30 jours**. Cette durée peut être modifiée dans le script `backup-db.sh` :

```bash
RETENTION_DAYS=30  # Modifier cette valeur
```

### Espace Disque

**Vérifier l'espace utilisé par les backups** :
```bash
du -sh /home/ubuntu/ifn-connect-improved/backups/
```

**Vérifier l'espace disque disponible** :
```bash
df -h
```

### Nettoyage Manuel

**Supprimer les backups de plus de 60 jours** :
```bash
find /home/ubuntu/ifn-connect-improved/backups/ -name "ifn_connect_backup_*.sql.gz" -mtime +60 -delete
```

---

## 🚨 Procédures d'Urgence

### Scénario 1 : Perte Totale de Données

**1. Identifier le dernier backup valide** :
```bash
ls -lt /home/ubuntu/ifn-connect-improved/backups/ | head -5
```

**2. Vérifier l'intégrité du backup** :
```bash
gzip -t /home/ubuntu/ifn-connect-improved/backups/<backup_file>
```

**3. Restaurer le backup** :
```bash
./scripts/backup/restore-db.sh <backup_file>
```

**4. Vérifier que l'application fonctionne** :
- Accéder au dashboard admin : `/admin/dashboard`
- Vérifier le nombre de marchands
- Tester une connexion marchand

### Scénario 2 : Backup Corrompu

**1. Tester l'intégrité de tous les backups** :
```bash
for file in /home/ubuntu/ifn-connect-improved/backups/ifn_connect_backup_*.sql.gz; do
    echo "Test: $file"
    gzip -t "$file" && echo "✅ OK" || echo "❌ CORROMPU"
done
```

**2. Restaurer le backup valide le plus récent**

### Scénario 3 : Restore Échoué

**1. Consulter les logs d'erreur** :
```bash
tail -50 /home/ubuntu/ifn-connect-improved/logs/restore.log
```

**2. Restaurer le backup de sécurité** :
```bash
./scripts/backup/restore-db.sh backups/pre_restore_safety_<timestamp>.sql.gz
```

---

## 📊 Monitoring

### Vérifier le Dernier Backup

**Date du dernier backup** :
```bash
ls -lt /home/ubuntu/ifn-connect-improved/backups/ | head -2
```

**Taille du dernier backup** :
```bash
ls -lh /home/ubuntu/ifn-connect-improved/backups/ | head -2
```

### Alertes Recommandées

**Créer une alerte si** :
- Aucun backup depuis plus de 25 heures
- Espace disque < 10%
- Backup corrompu détecté
- Échec du cron job

### Dashboard de Monitoring

**Statistiques à afficher** :
- Date du dernier backup
- Taille du dernier backup
- Nombre total de backups
- Espace disque utilisé
- Historique des backups (30 derniers jours)

---

## 🔐 Sécurité

### Permissions des Fichiers

**Scripts** :
```bash
chmod 700 /home/ubuntu/ifn-connect-improved/scripts/backup/*.sh
```

**Backups** :
```bash
chmod 600 /home/ubuntu/ifn-connect-improved/backups/*.sql.gz
```

### Stockage Externe (Recommandé)

Pour une sécurité maximale, copier les backups vers un stockage externe :

**AWS S3** :
```bash
aws s3 cp /home/ubuntu/ifn-connect-improved/backups/ s3://ifn-connect-backups/ --recursive
```

**Google Cloud Storage** :
```bash
gsutil cp /home/ubuntu/ifn-connect-improved/backups/* gs://ifn-connect-backups/
```

---

## 📝 Checklist de Vérification

### Checklist Quotidienne (Automatique)
- ✅ Backup créé à 2h00 du matin
- ✅ Intégrité du backup vérifiée
- ✅ Logs de backup sans erreur
- ✅ Rotation des anciens backups effectuée

### Checklist Hebdomadaire (Manuelle)
- ✅ Vérifier l'espace disque disponible
- ✅ Tester un restore sur environnement de test
- ✅ Vérifier les logs de cron
- ✅ Vérifier que tous les backups sont intègres

### Checklist Mensuelle (Manuelle)
- ✅ Test complet de restore en production (hors heures)
- ✅ Vérifier la procédure d'urgence
- ✅ Mettre à jour la documentation si nécessaire
- ✅ Copier les backups vers stockage externe

---

## 📞 Support

En cas de problème avec les backups :

1. **Consulter les logs** : `/home/ubuntu/ifn-connect-improved/logs/`
2. **Vérifier l'intégrité des backups** : `gzip -t <backup_file>`
3. **Contacter l'équipe technique** : support@ifn-connect.ci
4. **Documentation complète** : Ce fichier (`BACKUP_PROCEDURE.md`)

---

**Dernière mise à jour** : 24 décembre 2025  
**Version** : 1.0  
**Responsable** : Lead Engineer
