-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Isolation des données par merchantId et userId
-- ============================================================================

-- Note: MySQL/TiDB ne supporte pas nativement RLS comme PostgreSQL
-- Cette approche utilise des VIEWs sécurisées + triggers pour simuler RLS

-- ============================================================================
-- 1. CRÉATION DES VUES SÉCURISÉES POUR LES MARCHANDS
-- ============================================================================

-- Vue sécurisée pour les ventes (sales)
-- Un marchand ne peut voir que ses propres ventes
CREATE OR REPLACE VIEW merchant_sales_view AS
SELECT s.*
FROM sales s
INNER JOIN merchants m ON s.merchantId = m.id
WHERE m.userId = CURRENT_USER_ID(); -- Variable de session à définir

-- Vue sécurisée pour les produits (products)
-- Un marchand ne peut voir que ses propres produits
CREATE OR REPLACE VIEW merchant_products_view AS
SELECT p.*
FROM products p
WHERE p.merchantId = CURRENT_MERCHANT_ID(); -- Variable de session à définir

-- Vue sécurisée pour les documents d'enrôlement (enrollmentDocuments)
-- Un marchand ne peut voir que ses propres documents
CREATE OR REPLACE VIEW merchant_documents_view AS
SELECT ed.*
FROM enrollmentDocuments ed
INNER JOIN merchants m ON ed.merchantId = m.id
WHERE m.userId = CURRENT_USER_ID();

-- Vue sécurisée pour les contributions CNPS
CREATE OR REPLACE VIEW merchant_cnps_view AS
SELECT cc.*
FROM cnps_contributions cc
INNER JOIN merchants m ON cc.merchantId = m.id
WHERE m.userId = CURRENT_USER_ID();

-- Vue sécurisée pour les remboursements CMU
CREATE OR REPLACE VIEW merchant_cmu_view AS
SELECT cr.*
FROM cmu_reimbursements cr
INNER JOIN merchants m ON cr.merchantId = m.id
WHERE m.userId = CURRENT_USER_ID();

-- ============================================================================
-- 2. TRIGGERS POUR EMPÊCHER LES ACCÈS NON AUTORISÉS
-- ============================================================================

-- Trigger BEFORE INSERT sur sales
-- Empêche un marchand d'insérer des ventes pour un autre marchand
DELIMITER //
CREATE TRIGGER prevent_unauthorized_sale_insert
BEFORE INSERT ON sales
FOR EACH ROW
BEGIN
  DECLARE current_merchant_id INT;
  
  -- Récupérer le merchantId de l'utilisateur connecté
  SELECT id INTO current_merchant_id
  FROM merchants
  WHERE userId = CURRENT_USER_ID()
  LIMIT 1;
  
  -- Vérifier que le merchantId correspond
  IF NEW.merchantId != current_merchant_id THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Accès refusé : Vous ne pouvez pas créer de vente pour un autre marchand';
  END IF;
END//
DELIMITER ;

-- Trigger BEFORE UPDATE sur sales
-- Empêche un marchand de modifier les ventes d'un autre marchand
DELIMITER //
CREATE TRIGGER prevent_unauthorized_sale_update
BEFORE UPDATE ON sales
FOR EACH ROW
BEGIN
  DECLARE current_merchant_id INT;
  
  SELECT id INTO current_merchant_id
  FROM merchants
  WHERE userId = CURRENT_USER_ID()
  LIMIT 1;
  
  IF OLD.merchantId != current_merchant_id THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Accès refusé : Vous ne pouvez pas modifier la vente d\'un autre marchand';
  END IF;
END//
DELIMITER ;

-- Trigger BEFORE DELETE sur sales
-- Empêche un marchand de supprimer les ventes d'un autre marchand
DELIMITER //
CREATE TRIGGER prevent_unauthorized_sale_delete
BEFORE DELETE ON sales
FOR EACH ROW
BEGIN
  DECLARE current_merchant_id INT;
  
  SELECT id INTO current_merchant_id
  FROM merchants
  WHERE userId = CURRENT_USER_ID()
  LIMIT 1;
  
  IF OLD.merchantId != current_merchant_id THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Accès refusé : Vous ne pouvez pas supprimer la vente d\'un autre marchand';
  END IF;
END//
DELIMITER ;

-- ============================================================================
-- 3. FONCTIONS UTILITAIRES POUR RLS
-- ============================================================================

-- Fonction pour définir l'utilisateur courant dans la session
DELIMITER //
CREATE FUNCTION SET_CURRENT_USER_ID(user_id INT)
RETURNS INT
DETERMINISTIC
BEGIN
  SET @current_user_id = user_id;
  RETURN user_id;
END//
DELIMITER ;

-- Fonction pour récupérer l'utilisateur courant
DELIMITER //
CREATE FUNCTION CURRENT_USER_ID()
RETURNS INT
DETERMINISTIC
BEGIN
  RETURN @current_user_id;
END//
DELIMITER ;

-- Fonction pour définir le marchand courant dans la session
DELIMITER //
CREATE FUNCTION SET_CURRENT_MERCHANT_ID(merchant_id INT)
RETURNS INT
DETERMINISTIC
BEGIN
  SET @current_merchant_id = merchant_id;
  RETURN merchant_id;
END//
DELIMITER ;

-- Fonction pour récupérer le marchand courant
DELIMITER //
CREATE FUNCTION CURRENT_MERCHANT_ID()
RETURNS INT
DETERMINISTIC
BEGIN
  RETURN @current_merchant_id;
END//
DELIMITER ;

-- ============================================================================
-- 4. PROCÉDURES POUR INITIALISER LE CONTEXTE DE SÉCURITÉ
-- ============================================================================

-- Procédure à appeler au début de chaque session
DELIMITER //
CREATE PROCEDURE INIT_SECURITY_CONTEXT(IN user_id INT)
BEGIN
  DECLARE merchant_id INT;
  
  -- Définir l'utilisateur courant
  SELECT SET_CURRENT_USER_ID(user_id);
  
  -- Récupérer et définir le merchantId
  SELECT id INTO merchant_id
  FROM merchants
  WHERE userId = user_id
  LIMIT 1;
  
  IF merchant_id IS NOT NULL THEN
    SELECT SET_CURRENT_MERCHANT_ID(merchant_id);
  END IF;
END//
DELIMITER ;

-- ============================================================================
-- 5. POLITIQUE D'ACCÈS POUR LES ADMINS
-- ============================================================================

-- Les admins ont accès à toutes les données
-- Vérification via le rôle dans la table users

DELIMITER //
CREATE FUNCTION IS_ADMIN()
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
  DECLARE user_role VARCHAR(50);
  
  SELECT role INTO user_role
  FROM users
  WHERE id = CURRENT_USER_ID()
  LIMIT 1;
  
  RETURN (user_role = 'admin');
END//
DELIMITER ;

-- Modifier les triggers pour autoriser les admins
-- (À ajouter dans chaque trigger : IF NOT IS_ADMIN() THEN ... END IF;)

-- ============================================================================
-- 6. INSTRUCTIONS D'UTILISATION
-- ============================================================================

/*
UTILISATION DANS L'APPLICATION :

1. Au début de chaque requête authentifiée, appeler :
   CALL INIT_SECURITY_CONTEXT(userId);

2. Utiliser les vues sécurisées au lieu des tables directes :
   - merchant_sales_view au lieu de sales
   - merchant_products_view au lieu de products
   - etc.

3. Les triggers empêcheront automatiquement les accès non autorisés

EXEMPLE DANS LE CODE NODE.JS :

// Initialiser le contexte de sécurité
await db.execute('CALL INIT_SECURITY_CONTEXT(?)', [userId]);

// Ensuite, toutes les requêtes seront filtrées automatiquement
const sales = await db.select().from('merchant_sales_view');

// Les INSERT/UPDATE/DELETE seront bloqués si non autorisés
*/

-- ============================================================================
-- 7. TESTS DE SÉCURITÉ
-- ============================================================================

/*
TEST 1 : Vérifier l'isolation des ventes
- Créer 2 marchands (A et B)
- Marchand A crée une vente
- Marchand B tente de voir/modifier la vente de A
- Résultat attendu : Accès refusé

TEST 2 : Vérifier les droits admin
- Admin se connecte
- Admin peut voir toutes les ventes
- Résultat attendu : Accès autorisé

TEST 3 : Vérifier les triggers
- Marchand A tente d'insérer une vente avec merchantId de B
- Résultat attendu : Erreur SQL "Accès refusé"
*/
