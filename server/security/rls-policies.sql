-- ============================================================================
-- PNAVIM-CI - Row Level Security (RLS) Policies
-- ============================================================================
-- Ce fichier implémente les politiques de sécurité au niveau base de données
-- pour protéger les données sensibles contre les accès non autorisés.
--
-- IMPORTANT : Ces politiques complètent (ne remplacent pas) les contrôles
-- d'accès au niveau applicatif (middleware tRPC).
--
-- Exécution : mysql < server/security/rls-policies.sql
-- ============================================================================

-- Note: MySQL/TiDB ne supporte pas nativement le RLS comme PostgreSQL.
-- Nous utilisons des VIEWS avec DEFINER pour simuler le RLS.

-- ============================================================================
-- 1. CRÉATION DES VUES SÉCURISÉES POUR LES MARCHANDS
-- ============================================================================

-- Vue sécurisée pour les ventes (un marchand ne voit que ses ventes)
CREATE OR REPLACE VIEW merchant_sales_view AS
SELECT 
    s.*
FROM sales s
WHERE s.merchant_id = (
    SELECT m.id 
    FROM merchants m 
    INNER JOIN users u ON m.user_id = u.id 
    WHERE u.open_id = SUBSTRING_INDEX(USER(), '@', 1)
);

-- Vue sécurisée pour le stock (un marchand ne voit que son stock)
CREATE OR REPLACE VIEW merchant_stock_view AS
SELECT 
    ms.*
FROM merchant_stock ms
WHERE ms.merchant_id = (
    SELECT m.id 
    FROM merchants m 
    INNER JOIN users u ON m.user_id = u.id 
    WHERE u.open_id = SUBSTRING_INDEX(USER(), '@', 1)
);

-- Vue sécurisée pour les produits (un marchand ne voit que ses produits)
CREATE OR REPLACE VIEW merchant_products_view AS
SELECT 
    p.*
FROM products p
WHERE p.merchant_id = (
    SELECT m.id 
    FROM merchants m 
    INNER JOIN users u ON m.user_id = u.id 
    WHERE u.open_id = SUBSTRING_INDEX(USER(), '@', 1)
);

-- Vue sécurisée pour les transactions (un marchand ne voit que ses transactions)
CREATE OR REPLACE VIEW merchant_transactions_view AS
SELECT 
    t.*
FROM transactions t
WHERE t.merchant_id = (
    SELECT m.id 
    FROM merchants m 
    INNER JOIN users u ON m.user_id = u.id 
    WHERE u.open_id = SUBSTRING_INDEX(USER(), '@', 1)
);

-- Vue sécurisée pour les sessions de caisse (un marchand ne voit que ses sessions)
CREATE OR REPLACE VIEW merchant_cash_sessions_view AS
SELECT 
    cs.*
FROM cash_sessions cs
WHERE cs.merchant_id = (
    SELECT m.id 
    FROM merchants m 
    INNER JOIN users u ON m.user_id = u.id 
    WHERE u.open_id = SUBSTRING_INDEX(USER(), '@', 1)
);

-- Vue sécurisée pour les commandes (un marchand ne voit que ses commandes)
CREATE OR REPLACE VIEW merchant_orders_view AS
SELECT 
    o.*
FROM orders o
WHERE o.merchant_id = (
    SELECT m.id 
    FROM merchants m 
    INNER JOIN users u ON m.user_id = u.id 
    WHERE u.open_id = SUBSTRING_INDEX(USER(), '@', 1)
);

-- Vue sécurisée pour les cotisations CNPS (un marchand ne voit que ses cotisations)
CREATE OR REPLACE VIEW merchant_cnps_contributions_view AS
SELECT 
    cc.*
FROM cnps_contributions cc
WHERE cc.merchant_id = (
    SELECT m.id 
    FROM merchants m 
    INNER JOIN users u ON m.user_id = u.id 
    WHERE u.open_id = SUBSTRING_INDEX(USER(), '@', 1)
);

-- Vue sécurisée pour les cotisations CMU (un marchand ne voit que ses cotisations)
CREATE OR REPLACE VIEW merchant_cmu_contributions_view AS
SELECT 
    cmu.*
FROM cmu_contributions cmu
WHERE cmu.merchant_id = (
    SELECT m.id 
    FROM merchants m 
    INNER JOIN users u ON m.user_id = u.id 
    WHERE u.open_id = SUBSTRING_INDEX(USER(), '@', 1)
);

-- Vue sécurisée pour l'épargne (un marchand ne voit que son épargne)
CREATE OR REPLACE VIEW merchant_savings_view AS
SELECT 
    sa.*
FROM savings sa
WHERE sa.merchant_id = (
    SELECT m.id 
    FROM merchants m 
    INNER JOIN users u ON m.user_id = u.id 
    WHERE u.open_id = SUBSTRING_INDEX(USER(), '@', 1)
);

-- ============================================================================
-- 2. CRÉATION DES VUES SÉCURISÉES POUR LES AGENTS
-- ============================================================================

-- Vue sécurisée pour les marchands enrôlés (un agent ne voit que ses enrôlements)
CREATE OR REPLACE VIEW agent_merchants_view AS
SELECT 
    m.*
FROM merchants m
WHERE m.enrolled_by_agent_id = (
    SELECT a.id 
    FROM agents a 
    INNER JOIN users u ON a.user_id = u.id 
    WHERE u.open_id = SUBSTRING_INDEX(USER(), '@', 1)
);

-- Vue sécurisée pour les enrôlements (un agent ne voit que ses enrôlements)
CREATE OR REPLACE VIEW agent_enrollments_view AS
SELECT 
    e.*
FROM enrollments e
WHERE e.agent_id = (
    SELECT a.id 
    FROM agents a 
    INNER JOIN users u ON a.user_id = u.id 
    WHERE u.open_id = SUBSTRING_INDEX(USER(), '@', 1)
);

-- ============================================================================
-- 3. CRÉATION DES VUES SÉCURISÉES POUR LES COOPÉRATIVES
-- ============================================================================

-- Vue sécurisée pour les membres de la coopérative
CREATE OR REPLACE VIEW cooperative_members_view AS
SELECT 
    cm.*
FROM cooperative_members cm
WHERE cm.cooperative_id = (
    SELECT c.id 
    FROM cooperatives c 
    INNER JOIN users u ON c.user_id = u.id 
    WHERE u.open_id = SUBSTRING_INDEX(USER(), '@', 1)
);

-- Vue sécurisée pour les commandes groupées de la coopérative
CREATE OR REPLACE VIEW cooperative_group_orders_view AS
SELECT 
    go.*
FROM group_orders go
WHERE go.cooperative_id = (
    SELECT c.id 
    FROM cooperatives c 
    INNER JOIN users u ON c.user_id = u.id 
    WHERE u.open_id = SUBSTRING_INDEX(USER(), '@', 1)
);

-- ============================================================================
-- 4. TRIGGERS DE VALIDATION (Protection IDOR)
-- ============================================================================

-- Trigger pour empêcher un marchand de modifier les données d'un autre marchand
DELIMITER $$

CREATE TRIGGER before_sales_insert
BEFORE INSERT ON sales
FOR EACH ROW
BEGIN
    DECLARE current_merchant_id INT;
    
    -- Récupérer l'ID du marchand connecté
    SELECT m.id INTO current_merchant_id
    FROM merchants m 
    INNER JOIN users u ON m.user_id = u.id 
    WHERE u.open_id = SUBSTRING_INDEX(USER(), '@', 1);
    
    -- Vérifier que le marchand insère bien ses propres données
    IF NEW.merchant_id != current_merchant_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Accès refusé : vous ne pouvez pas créer de ventes pour un autre marchand';
    END IF;
END$$

CREATE TRIGGER before_sales_update
BEFORE UPDATE ON sales
FOR EACH ROW
BEGIN
    DECLARE current_merchant_id INT;
    
    SELECT m.id INTO current_merchant_id
    FROM merchants m 
    INNER JOIN users u ON m.user_id = u.id 
    WHERE u.open_id = SUBSTRING_INDEX(USER(), '@', 1);
    
    IF OLD.merchant_id != current_merchant_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Accès refusé : vous ne pouvez pas modifier les ventes d\'un autre marchand';
    END IF;
END$$

CREATE TRIGGER before_merchant_stock_update
BEFORE UPDATE ON merchant_stock
FOR EACH ROW
BEGIN
    DECLARE current_merchant_id INT;
    
    SELECT m.id INTO current_merchant_id
    FROM merchants m 
    INNER JOIN users u ON m.user_id = u.id 
    WHERE u.open_id = SUBSTRING_INDEX(USER(), '@', 1);
    
    IF OLD.merchant_id != current_merchant_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Accès refusé : vous ne pouvez pas modifier le stock d\'un autre marchand';
    END IF;
END$$

CREATE TRIGGER before_transactions_insert
BEFORE INSERT ON transactions
FOR EACH ROW
BEGIN
    DECLARE current_merchant_id INT;
    
    SELECT m.id INTO current_merchant_id
    FROM merchants m 
    INNER JOIN users u ON m.user_id = u.id 
    WHERE u.open_id = SUBSTRING_INDEX(USER(), '@', 1);
    
    IF NEW.merchant_id != current_merchant_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Accès refusé : vous ne pouvez pas créer de transactions pour un autre marchand';
    END IF;
END$$

DELIMITER ;

-- ============================================================================
-- 5. INDEX DE PERFORMANCE POUR LES VUES
-- ============================================================================

-- Index pour optimiser les requêtes de vérification d'ownership
CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_cooperatives_user_id ON cooperatives(user_id);
CREATE INDEX IF NOT EXISTS idx_users_open_id ON users(open_id);

-- Index pour optimiser les jointures dans les vues
CREATE INDEX IF NOT EXISTS idx_sales_merchant_id ON sales(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_stock_merchant_id ON merchant_stock(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_merchant_id ON products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_merchant_id ON cash_sessions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant_id ON orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_cnps_contributions_merchant_id ON cnps_contributions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_cmu_contributions_merchant_id ON cmu_contributions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_savings_merchant_id ON savings(merchant_id);

-- ============================================================================
-- 6. DOCUMENTATION DES POLITIQUES
-- ============================================================================

-- Les vues créées ci-dessus implémentent les règles suivantes :
--
-- MARCHANDS :
-- - Un marchand ne peut voir que ses propres ventes, stock, produits, transactions
-- - Un marchand ne peut pas accéder aux données d'un autre marchand
-- - Les triggers empêchent les insertions/modifications non autorisées
--
-- AGENTS :
-- - Un agent ne peut voir que les marchands qu'il a enrôlés
-- - Un agent ne peut pas accéder aux marchands enrôlés par d'autres agents
--
-- COOPÉRATIVES :
-- - Une coopérative ne peut voir que ses propres membres et commandes groupées
-- - Une coopérative ne peut pas accéder aux données d'une autre coopérative
--
-- ADMINISTRATEURS :
-- - Les administrateurs ont accès complet (pas de restrictions via les vues)
-- - Les logs d'audit enregistrent toutes les actions des administrateurs

-- ============================================================================
-- 7. TESTS DE VALIDATION
-- ============================================================================

-- Pour tester les politiques RLS :
--
-- 1. Tester l'accès marchand :
--    SELECT * FROM merchant_sales_view;
--    -- Doit retourner uniquement les ventes du marchand connecté
--
-- 2. Tester la protection IDOR :
--    INSERT INTO sales (merchant_id, ...) VALUES (999, ...);
--    -- Doit échouer si 999 n'est pas l'ID du marchand connecté
--
-- 3. Tester l'accès agent :
--    SELECT * FROM agent_merchants_view;
--    -- Doit retourner uniquement les marchands enrôlés par l'agent connecté
--
-- 4. Tester l'accès coopérative :
--    SELECT * FROM cooperative_members_view;
--    -- Doit retourner uniquement les membres de la coopérative connectée

-- ============================================================================
-- FIN DU FICHIER
-- ============================================================================
