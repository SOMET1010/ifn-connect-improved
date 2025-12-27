-- Script de nettoyage des marchands de test
-- À exécuter avant la mise en production

-- 1. Supprimer les 4 marchands de test identifiés
DELETE FROM merchants WHERE merchantNumber IN (
  'M1766705995011',                    -- "Boutique Test Admin"
  'DJEDJE BAGNON::0000122B',           -- "ISHOLA ADEMOLA AZIZ"
  'MRC-TEST-PAY-1766740926263',        -- "Test Business Payments"
  'MRC-NOPROT-1766744175082'           -- "Test No Protection"
);

-- 2. Supprimer les utilisateurs associés (si nécessaire)
-- Note: Les utilisateurs seront supprimés automatiquement si ON DELETE CASCADE est configuré

-- 3. Vérifier le nombre de marchands restants
SELECT COUNT(*) as total_merchants FROM merchants;

-- 4. Vérifier qu'il ne reste plus de marchands avec "test" dans le nom
SELECT merchantNumber, businessName 
FROM merchants 
WHERE LOWER(businessName) LIKE '%test%';

-- 5. Vérifier qu'il ne reste plus de marchands créés récemment (< 3 jours)
SELECT merchantNumber, businessName, createdAt 
FROM merchants 
WHERE createdAt > DATE_SUB(NOW(), INTERVAL 3 DAY);
