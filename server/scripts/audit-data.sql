-- Script d'audit des données pour identifier les données mockées ou de test
-- Date: 27 décembre 2024

-- ============================================================================
-- 1. AUDIT DES UTILISATEURS ET MARCHANDS
-- ============================================================================

-- Compter les utilisateurs par type
SELECT 'Total utilisateurs' AS metric, COUNT(*) AS count FROM users;
SELECT 'Utilisateurs avec openId' AS metric, COUNT(*) AS count FROM users WHERE openId IS NOT NULL;
SELECT 'Utilisateurs sans openId' AS metric, COUNT(*) AS count FROM users WHERE openId IS NULL;

-- Compter les marchands
SELECT 'Total marchands' AS metric, COUNT(*) AS count FROM merchants;
SELECT 'Marchands avec téléphone' AS metric, COUNT(*) AS count FROM merchants WHERE phone IS NOT NULL;
SELECT 'Marchands sans téléphone' AS metric, COUNT(*) AS count FROM merchants WHERE phone IS NULL;
SELECT 'Marchands vérifiés' AS metric, COUNT(*) AS count FROM merchants WHERE verified = 1;

-- Identifier les marchands avec des noms suspects (test, demo, mock)
SELECT 'Marchands avec nom suspect' AS metric, COUNT(*) AS count 
FROM merchants 
WHERE LOWER(businessName) LIKE '%test%' 
   OR LOWER(businessName) LIKE '%demo%' 
   OR LOWER(businessName) LIKE '%mock%'
   OR LOWER(businessName) LIKE '%fake%';

-- Liste des marchands suspects
SELECT merchantNumber, businessName, phone, createdAt
FROM merchants 
WHERE LOWER(businessName) LIKE '%test%' 
   OR LOWER(businessName) LIKE '%demo%' 
   OR LOWER(businessName) LIKE '%mock%'
   OR LOWER(businessName) LIKE '%fake%'
LIMIT 20;

-- ============================================================================
-- 2. AUDIT DES VENTES
-- ============================================================================

-- Statistiques des ventes
SELECT 'Total ventes' AS metric, COUNT(*) AS count FROM sales;
SELECT 'Ventes avec transactionId' AS metric, COUNT(*) AS count FROM sales WHERE transactionId IS NOT NULL;
SELECT 'Ventes en espèces' AS metric, COUNT(*) AS count FROM sales WHERE paymentMethod = 'cash';
SELECT 'Ventes mobile money' AS metric, COUNT(*) AS count FROM sales WHERE paymentMethod = 'mobile_money';

-- Ventes par période
SELECT 
  'Ventes dernières 24h' AS metric, 
  COUNT(*) AS count 
FROM sales 
WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 1 DAY);

SELECT 
  'Ventes derniers 7 jours' AS metric, 
  COUNT(*) AS count 
FROM sales 
WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY);

SELECT 
  'Ventes derniers 30 jours' AS metric, 
  COUNT(*) AS count 
FROM sales 
WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Identifier les ventes avec des montants suspects (trop ronds, trop élevés)
SELECT 'Ventes avec montants ronds suspects' AS metric, COUNT(*) AS count
FROM sales 
WHERE totalAmount IN (1000, 5000, 10000, 50000, 100000, 500000, 1000000);

-- Top 10 des ventes les plus élevées
SELECT merchantId, totalAmount, paymentMethod, createdAt
FROM sales
ORDER BY totalAmount DESC
LIMIT 10;

-- ============================================================================
-- 3. AUDIT DES PRODUITS
-- ============================================================================

-- Statistiques des produits
SELECT 'Total produits' AS metric, COUNT(*) AS count FROM products;
SELECT 'Produits avec image' AS metric, COUNT(*) AS count FROM products WHERE imageUrl IS NOT NULL;

-- Produits avec noms suspects
SELECT 'Produits avec nom suspect' AS metric, COUNT(*) AS count 
FROM products 
WHERE LOWER(nameFr) LIKE '%test%' 
   OR LOWER(nameFr) LIKE '%demo%' 
   OR LOWER(nameFr) LIKE '%mock%';

-- ============================================================================
-- 4. AUDIT DU STOCK
-- ============================================================================

-- Statistiques du stock
SELECT 'Total entrées stock' AS metric, COUNT(*) AS count FROM merchant_stock;
SELECT 'Stock avec quantité 0' AS metric, COUNT(*) AS count FROM merchant_stock WHERE quantity = 0;
SELECT 'Stock bas (< 10)' AS metric, COUNT(*) AS count FROM merchant_stock WHERE quantity < 10;

-- ============================================================================
-- 5. AUDIT DES PAIEMENTS CNPS/CMU
-- ============================================================================

-- Statistiques CNPS
SELECT 'Total paiements CNPS' AS metric, COUNT(*) AS count FROM cnps_payments;
SELECT 'CNPS complétés' AS metric, COUNT(*) AS count FROM cnps_payments WHERE status = 'completed';
SELECT 'CNPS en attente' AS metric, COUNT(*) AS count FROM cnps_payments WHERE status = 'pending';
SELECT 'CNPS échoués' AS metric, COUNT(*) AS count FROM cnps_payments WHERE status = 'failed';

-- Statistiques CMU
SELECT 'Total remboursements CMU' AS metric, COUNT(*) AS count FROM cmu_reimbursements;
SELECT 'CMU approuvés' AS metric, COUNT(*) AS count FROM cmu_reimbursements WHERE status = 'approved';
SELECT 'CMU en attente' AS metric, COUNT(*) AS count FROM cmu_reimbursements WHERE status = 'pending';
SELECT 'CMU rejetés' AS metric, COUNT(*) AS count FROM cmu_reimbursements WHERE status = 'rejected';

-- ============================================================================
-- 6. AUDIT DES COMMANDES GROUPÉES
-- ============================================================================

-- Statistiques commandes groupées
SELECT 'Total commandes groupées' AS metric, COUNT(*) AS count FROM grouped_orders;
SELECT 'Commandes draft' AS metric, COUNT(*) AS count FROM grouped_orders WHERE status = 'draft';
SELECT 'Commandes confirmées' AS metric, COUNT(*) AS count FROM grouped_orders WHERE status = 'confirmed';
SELECT 'Commandes livrées' AS metric, COUNT(*) AS count FROM grouped_orders WHERE status = 'delivered';

-- ============================================================================
-- 7. AUDIT DES SESSIONS QUOTIDIENNES
-- ============================================================================

-- Statistiques sessions
SELECT 'Total sessions' AS metric, COUNT(*) AS count FROM merchantDailySessions;
SELECT 'Sessions ouvertes' AS metric, COUNT(*) AS count FROM merchantDailySessions WHERE status = 'OPENED';
SELECT 'Sessions fermées' AS metric, COUNT(*) AS count FROM merchantDailySessions WHERE status = 'CLOSED';

-- Sessions par jour
SELECT 
  DATE(openedAt) AS date, 
  COUNT(*) AS sessions_count
FROM merchantDailySessions
WHERE openedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(openedAt)
ORDER BY date DESC
LIMIT 30;

-- ============================================================================
-- 8. AUDIT DES COURS E-LEARNING
-- ============================================================================

-- Statistiques cours
SELECT 'Total cours' AS metric, COUNT(*) AS count FROM courses;
SELECT 'Cours avec vidéo' AS metric, COUNT(*) AS count FROM courses WHERE videoUrl IS NOT NULL;

-- Statistiques quiz
SELECT 'Total questions quiz' AS metric, COUNT(*) AS count FROM quizzes;
SELECT 'Total tentatives quiz' AS metric, COUNT(*) AS count FROM quiz_attempts;

-- ============================================================================
-- 9. RÉSUMÉ FINAL
-- ============================================================================

SELECT '========================================' AS separator;
SELECT 'RÉSUMÉ DE L\'AUDIT DES DONNÉES' AS title;
SELECT '========================================' AS separator;

-- Créer une vue récapitulative
SELECT 
  'Utilisateurs' AS table_name,
  COUNT(*) AS total_records,
  MIN(createdAt) AS oldest_record,
  MAX(createdAt) AS newest_record
FROM users
UNION ALL
SELECT 
  'Marchands',
  COUNT(*),
  MIN(createdAt),
  MAX(createdAt)
FROM merchants
UNION ALL
SELECT 
  'Ventes',
  COUNT(*),
  MIN(createdAt),
  MAX(createdAt)
FROM sales
UNION ALL
SELECT 
  'Produits',
  COUNT(*),
  MIN(createdAt),
  MAX(createdAt)
FROM products
UNION ALL
SELECT 
  'Stock',
  COUNT(*),
  MIN(createdAt),
  MAX(updatedAt)
FROM merchant_stock;
