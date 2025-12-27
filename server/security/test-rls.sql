-- ============================================================================
-- PNAVIM-CI - Tests des Politiques RLS
-- ============================================================================
-- Ce fichier contient les tests de validation des politiques de sécurité
-- au niveau base de données.
--
-- Exécution : mysql < server/security/test-rls.sql
-- ============================================================================

-- ============================================================================
-- 1. TESTS DES VUES SÉCURISÉES MARCHANDS
-- ============================================================================

-- Test 1 : Vérifier que les vues existent
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Test 2 : Compter les enregistrements dans les vues (doit être limité au marchand connecté)
SELECT 'merchant_sales_view' as view_name, COUNT(*) as count FROM merchant_sales_view
UNION ALL
SELECT 'merchant_stock_view', COUNT(*) FROM merchant_stock_view
UNION ALL
SELECT 'merchant_products_view', COUNT(*) FROM merchant_products_view
UNION ALL
SELECT 'merchant_transactions_view', COUNT(*) FROM merchant_transactions_view
UNION ALL
SELECT 'merchant_cash_sessions_view', COUNT(*) FROM merchant_cash_sessions_view
UNION ALL
SELECT 'merchant_orders_view', COUNT(*) FROM merchant_orders_view
UNION ALL
SELECT 'merchant_cnps_contributions_view', COUNT(*) FROM merchant_cnps_contributions_view
UNION ALL
SELECT 'merchant_cmu_contributions_view', COUNT(*) FROM merchant_cmu_contributions_view
UNION ALL
SELECT 'merchant_savings_view', COUNT(*) FROM merchant_savings_view;

-- ============================================================================
-- 2. TESTS DES VUES SÉCURISÉES AGENTS
-- ============================================================================

SELECT 'agent_merchants_view' as view_name, COUNT(*) as count FROM agent_merchants_view
UNION ALL
SELECT 'agent_enrollments_view', COUNT(*) FROM agent_enrollments_view;

-- ============================================================================
-- 3. TESTS DES VUES SÉCURISÉES COOPÉRATIVES
-- ============================================================================

SELECT 'cooperative_members_view' as view_name, COUNT(*) as count FROM cooperative_members_view
UNION ALL
SELECT 'cooperative_group_orders_view', COUNT(*) FROM cooperative_group_orders_view;

-- ============================================================================
-- 4. TESTS DES TRIGGERS
-- ============================================================================

-- Vérifier que les triggers existent
SHOW TRIGGERS WHERE `Table` IN ('sales', 'merchant_stock', 'transactions');

-- ============================================================================
-- 5. TESTS DES INDEX
-- ============================================================================

-- Vérifier que les index existent
SHOW INDEX FROM merchants WHERE Key_name = 'idx_merchants_user_id';
SHOW INDEX FROM agents WHERE Key_name = 'idx_agents_user_id';
SHOW INDEX FROM cooperatives WHERE Key_name = 'idx_cooperatives_user_id';
SHOW INDEX FROM users WHERE Key_name = 'idx_users_open_id';
SHOW INDEX FROM sales WHERE Key_name = 'idx_sales_merchant_id';
SHOW INDEX FROM merchant_stock WHERE Key_name = 'idx_merchant_stock_merchant_id';
SHOW INDEX FROM products WHERE Key_name = 'idx_products_merchant_id';
SHOW INDEX FROM transactions WHERE Key_name = 'idx_transactions_merchant_id';

-- ============================================================================
-- 6. RAPPORT DE VALIDATION
-- ============================================================================

SELECT 
    'RLS Policies Installation' as test_suite,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = DATABASE() AND table_name LIKE '%_view') >= 13
        THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = DATABASE() AND table_name LIKE '%_view') as views_created,
    (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = DATABASE()) as triggers_created,
    'Expected: 13 views, 4 triggers' as expected;

-- ============================================================================
-- FIN DES TESTS
-- ============================================================================
