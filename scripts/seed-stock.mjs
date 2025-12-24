#!/usr/bin/env node

/**
 * Script de seed pour créer le stock initial des marchands
 * Assigne des quantités aléatoires (10-100 unités) pour chaque produit/marchand
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema.js';

// Fonction pour générer une quantité aléatoire entre min et max
function randomQuantity(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Fonction pour générer une distribution variée de stock
function getStockQuantity() {
  const rand = Math.random();
  
  // 20% de chance d'avoir un stock bas (5-15 unités) pour tester les alertes
  if (rand < 0.2) {
    return randomQuantity(5, 15);
  }
  // 60% de chance d'avoir un stock normal (20-60 unités)
  else if (rand < 0.8) {
    return randomQuantity(20, 60);
  }
  // 20% de chance d'avoir un stock élevé (70-100 unités)
  else {
    return randomQuantity(70, 100);
  }
}

async function main() {
  console.log('🌱 Démarrage du seed du stock initial...\n');

  // Connexion à la base de données
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection, { schema, mode: 'default' });

  try {
    // 1. Récupérer tous les produits
    console.log('📦 Récupération des produits...');
    const products = await db.select().from(schema.products);
    console.log(`   ✓ ${products.length} produits trouvés\n`);

    // 2. Récupérer tous les marchands
    console.log('👥 Récupération des marchands...');
    const merchants = await db.select().from(schema.merchants);
    console.log(`   ✓ ${merchants.length} marchands trouvés\n`);

    if (products.length === 0) {
      console.log('⚠️  Aucun produit trouvé. Veuillez d\'abord exécuter le script seed-products.mjs');
      process.exit(1);
    }

    if (merchants.length === 0) {
      console.log('⚠️  Aucun marchand trouvé. Le stock sera créé pour les futurs marchands.');
      process.exit(0);
    }

    // 3. Créer le stock pour chaque marchand
    console.log('🔄 Génération du stock initial...');
    let totalStockEntries = 0;
    let lowStockCount = 0;
    let normalStockCount = 0;
    let highStockCount = 0;

    // Pour chaque marchand, on crée un stock pour chaque produit
    for (const merchant of merchants) {
      const stockEntries = [];
      
      for (const product of products) {
        const quantity = getStockQuantity();
        
        // Compter les types de stock
        if (quantity < 20) lowStockCount++;
        else if (quantity < 70) normalStockCount++;
        else highStockCount++;

        stockEntries.push({
          merchantId: merchant.id,
          productId: product.id,
          quantity: quantity.toString(),
          minThreshold: '10', // Seuil d'alerte à 10 unités
          lastRestocked: new Date(),
        });
      }

      // Insérer le stock par batch de 100 pour optimiser
      const batchSize = 100;
      for (let i = 0; i < stockEntries.length; i += batchSize) {
        const batch = stockEntries.slice(i, i + batchSize);
        await db.insert(schema.merchantStock).values(batch);
        totalStockEntries += batch.length;
      }

      // Afficher la progression tous les 100 marchands
      if ((merchants.indexOf(merchant) + 1) % 100 === 0) {
        console.log(`   ✓ ${merchants.indexOf(merchant) + 1}/${merchants.length} marchands traités...`);
      }
    }

    console.log(`\n✅ Stock initial créé avec succès !\n`);
    console.log('📊 Statistiques :');
    console.log(`   • Total d'entrées de stock : ${totalStockEntries}`);
    console.log(`   • Marchands : ${merchants.length}`);
    console.log(`   • Produits : ${products.length}`);
    console.log(`   • Stock bas (< 20 unités) : ${lowStockCount} (${((lowStockCount / totalStockEntries) * 100).toFixed(1)}%)`);
    console.log(`   • Stock normal (20-69 unités) : ${normalStockCount} (${((normalStockCount / totalStockEntries) * 100).toFixed(1)}%)`);
    console.log(`   • Stock élevé (≥ 70 unités) : ${highStockCount} (${((highStockCount / totalStockEntries) * 100).toFixed(1)}%)`);
    console.log('\n🎯 Prêt pour les tests de vente et d\'alertes de stock !\n');

  } catch (error) {
    console.error('❌ Erreur lors du seed du stock :', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
