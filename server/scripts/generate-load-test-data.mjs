#!/usr/bin/env node
/**
 * Script de génération de données de test de charge
 * Génère 1000+ ventes pour un marchand sur 30 jours
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { sales, products, merchants } from '../../drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL non définie');
  process.exit(1);
}

async function generateLoadTestData() {
  console.log('🚀 Génération de données de test de charge...\n');
  
  // Connexion à la base de données
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);
  
  try {
    // 1. Récupérer un marchand existant (le premier de la liste)
    const merchantList = await db.select().from(merchants).limit(1);
    if (!merchantList.length) {
      throw new Error('Aucun marchand trouvé dans la base de données');
    }
    const merchant = merchantList[0];
    const merchantId = merchant.id;
    
    console.log(`✅ Marchand sélectionné:`);
    console.log(`   - ID: ${merchantId}`);
    console.log(`   - Numéro: ${merchant.merchantNumber}`);
    console.log(`   - Nom: ${merchant.businessName}\n`);
    
    // 2. Récupérer les produits disponibles
    const allProducts = await db.select().from(products).limit(30);
    console.log(`✅ ${allProducts.length} produits disponibles\n`);
    
    if (!allProducts.length) {
      throw new Error('Aucun produit trouvé dans la base de données');
    }
    
    // 3. Générer 1000 ventes sur 30 jours
    const TOTAL_SALES = 1000;
    const DAYS_RANGE = 30;
    const ventes = [];
    const now = new Date();
    
    console.log(`📝 Génération de ${TOTAL_SALES} ventes sur ${DAYS_RANGE} jours...\n`);
    
    for (let i = 0; i < TOTAL_SALES; i++) {
      // Date aléatoire dans les 30 derniers jours
      const daysAgo = Math.floor(Math.random() * DAYS_RANGE);
      const hoursAgo = Math.floor(Math.random() * 24);
      const minutesAgo = Math.floor(Math.random() * 60);
      
      const saleDate = new Date(now);
      saleDate.setDate(saleDate.getDate() - daysAgo);
      saleDate.setHours(saleDate.getHours() - hoursAgo);
      saleDate.setMinutes(saleDate.getMinutes() - minutesAgo);
      
      // Produit aléatoire
      const product = allProducts[Math.floor(Math.random() * allProducts.length)];
      
      // Quantité aléatoire (1-10)
      const quantity = Math.floor(Math.random() * 10) + 1;
      
      // Prix avec variation ±20%
      const basePrice = parseFloat(product.basePrice);
      const variation = (Math.random() * 0.4 - 0.2); // -20% à +20%
      const unitPrice = Math.round(basePrice * (1 + variation));
      const totalAmount = unitPrice * quantity;
      
      // Méthode de paiement (70% cash, 30% mobile money)
      const paymentMethod = Math.random() > 0.3 ? 'cash' : 'mobile_money';
      
      ventes.push({
        merchantId,
        productId: product.id,
        quantity,
        unitPrice: String(unitPrice),
        totalAmount: String(totalAmount),
        paymentMethod,
        transactionId: `TXN-LOAD-${Date.now()}-${i}`,
        saleDate,
        createdAt: saleDate,
      });
      
      // Afficher la progression tous les 100 ventes
      if ((i + 1) % 100 === 0) {
        console.log(`   ⏳ ${i + 1}/${TOTAL_SALES} ventes générées...`);
      }
    }
    
    console.log(`\n✅ ${TOTAL_SALES} ventes générées\n`);
    
    // 4. Insérer les ventes par batch de 50 pour éviter les timeouts
    console.log('💾 Insertion des ventes dans la base de données...\n');
    const BATCH_SIZE = 50;
    
    for (let i = 0; i < ventes.length; i += BATCH_SIZE) {
      const batch = ventes.slice(i, i + BATCH_SIZE);
      await db.insert(sales).values(batch);
      console.log(`   ✅ ${Math.min(i + BATCH_SIZE, ventes.length)}/${ventes.length} ventes insérées`);
    }
    
    console.log('\n✅ Données de test de charge générées avec succès !');
    console.log(`\n📊 Résumé:`);
    console.log(`   - Marchand: ${merchant.businessName} (${merchant.merchantNumber})`);
    console.log(`   - Ventes créées: ${TOTAL_SALES}`);
    console.log(`   - Période: ${DAYS_RANGE} derniers jours`);
    console.log(`   - Produits utilisés: ${allProducts.length}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération des données:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Exécuter le script
generateLoadTestData()
  .then(() => {
    console.log('\n✨ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
