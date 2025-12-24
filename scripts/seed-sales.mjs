#!/usr/bin/env node

/**
 * Script pour créer des ventes de test
 * Génère des ventes réalistes sur les 7 derniers jours pour animer les graphiques
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema.js';

// Fonction pour générer une date aléatoire dans les N derniers jours
function getRandomDateInLastNDays(days) {
  const now = new Date();
  const daysAgo = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  const randomTime = daysAgo.getTime() + Math.random() * (now.getTime() - daysAgo.getTime());
  return new Date(randomTime);
}

// Fonction pour générer un montant aléatoire réaliste
function getRandomAmount(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Fonction pour générer une quantité aléatoire
function getRandomQuantity() {
  const rand = Math.random();
  if (rand < 0.5) return Math.floor(Math.random() * 3) + 1; // 1-3 (50%)
  if (rand < 0.8) return Math.floor(Math.random() * 5) + 4; // 4-8 (30%)
  return Math.floor(Math.random() * 10) + 9; // 9-18 (20%)
}

async function main() {
  console.log('🌱 Démarrage de la génération des ventes de test...\n');

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection, { schema, mode: 'default' });

  try {
    // 1. Récupérer quelques marchands (on prend les 10 premiers)
    console.log('👥 Récupération des marchands...');
    const merchants = await db.select().from(schema.merchants).limit(10);
    console.log(`   ✓ ${merchants.length} marchands sélectionnés\n`);

    if (merchants.length === 0) {
      console.log('⚠️  Aucun marchand trouvé.');
      process.exit(0);
    }

    // 2. Récupérer tous les produits
    console.log('📦 Récupération des produits...');
    const products = await db.select().from(schema.products);
    console.log(`   ✓ ${products.length} produits trouvés\n`);

    if (products.length === 0) {
      console.log('⚠️  Aucun produit trouvé.');
      process.exit(0);
    }

    // 3. Générer des ventes pour chaque marchand
    console.log('🔄 Génération des ventes de test...');
    let totalSales = 0;
    let totalAmount = 0;

    for (const merchant of merchants) {
      // Générer entre 15 et 30 ventes par marchand sur les 7 derniers jours
      const salesCount = getRandomAmount(15, 30);

      for (let i = 0; i < salesCount; i++) {
        // Choisir un produit aléatoire
        const product = products[Math.floor(Math.random() * products.length)];
        
        // Générer une quantité
        const quantity = getRandomQuantity();
        
        // Prix unitaire réaliste (500 à 5000 FCFA)
        const unitPrice = getRandomAmount(500, 5000);
        
        // Montant total
        const totalAmountSale = quantity * unitPrice;
        
        // Date aléatoire dans les 7 derniers jours
        const saleDate = getRandomDateInLastNDays(7);
        
        // Méthode de paiement aléatoire
        const paymentMethods = ['cash', 'mobile_money', 'credit'];
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

        // Insérer la vente
        await db.insert(schema.sales).values({
          merchantId: merchant.id,
          productId: product.id,
          quantity: String(quantity),
          unitPrice: String(unitPrice),
          totalAmount: String(totalAmountSale),
          paymentMethod: paymentMethod,
          saleDate: saleDate,
        });

        totalSales++;
        totalAmount += totalAmountSale;
      }

      console.log(`   ✓ ${salesCount} ventes créées pour ${merchant.businessName}`);
    }

    console.log(`\n✅ Ventes de test créées avec succès !\n`);
    console.log('📊 Statistiques :');
    console.log(`   • Total de ventes : ${totalSales}`);
    console.log(`   • Marchands concernés : ${merchants.length}`);
    console.log(`   • Montant total : ${totalAmount.toLocaleString('fr-FR')} FCFA`);
    console.log(`   • Montant moyen par vente : ${Math.round(totalAmount / totalSales).toLocaleString('fr-FR')} FCFA`);
    console.log('\n🎯 Les graphiques du dashboard sont maintenant animés !\n');

  } catch (error) {
    console.error('❌ Erreur lors de la génération des ventes :', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
