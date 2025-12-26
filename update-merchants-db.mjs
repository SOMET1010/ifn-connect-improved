#!/usr/bin/env node
/**
 * Script de mise à jour de la base de données avec les marchands fusionnés
 * Remplace les anciennes données par les 1618 marchands fusionnés
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import fs from 'fs';
import csv from 'csv-parser';

// Configuration de la base de données
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('=' .repeat(80));
console.log('MISE À JOUR DE LA BASE DE DONNÉES - MARCHANDS FUSIONNÉS');
console.log('='.repeat(80));
console.log();

// 1. Lire le fichier CSV fusionné
console.log('📂 Lecture du fichier marchands_fusionnes.csv...');
const merchants = [];

await new Promise((resolve, reject) => {
  fs.createReadStream('/home/ubuntu/marchands_fusionnes.csv')
    .pipe(csv())
    .on('data', (row) => merchants.push(row))
    .on('end', resolve)
    .on('error', reject);
});

console.log(`   ✓ ${merchants.length} marchands chargés`);

// 2. Supprimer les anciennes données
console.log('\n🗑️  Suppression des anciennes données...');
try {
  // Supprimer les marchands importés automatiquement (pas ceux créés manuellement)
  const deleteResult = await connection.execute(`
    DELETE m, u 
    FROM merchants m
    LEFT JOIN users u ON m.userId = u.id
    WHERE m.merchantNumber LIKE '%-%' 
       OR m.merchantNumber LIKE 'PACA-%'
       OR m.merchantNumber LIKE 'COCOVICO-%'
       OR m.merchantNumber LIKE 'BISSATA-%'
       OR m.merchantNumber LIKE 'UNICOVIA-%'
       OR m.merchantNumber LIKE 'SION-%'
       OR m.merchantNumber LIKE 'COVIYOP-%'
       OR m.merchantNumber LIKE 'COOFEPALME-%'
       OR m.merchantNumber LIKE 'BAGNON-%'
       OR m.merchantNumber LIKE 'UNKNOWN-%'
       OR m.merchantNumber LIKE 'CO.MAR.VISCOO-%'
  `);
  
  console.log(`   ✓ ${deleteResult[0].affectedRows} anciennes entrées supprimées`);
} catch (error) {
  console.error('   ⚠️  Erreur lors de la suppression:', error.message);
}

// 3. Importer les nouveaux marchands
console.log('\n📥 Importation des marchands fusionnés...');

let imported = 0;
let errors = 0;

for (const merchant of merchants) {
  try {
    const { marchand_uid, nom_complet, nom, prenoms, telephone, marche, source } = merchant;
    
    // Créer l'utilisateur
    const [userResult] = await connection.execute(
      `INSERT INTO users (openId, name, phone, role, createdAt, updatedAt, lastSignedIn) 
       VALUES (?, ?, ?, 'merchant', NOW(), NOW(), NOW())`,
      [
        `merchant_${marchand_uid.replace(/[^a-zA-Z0-9]/g, '_')}`,
        nom_complet || `${nom} ${prenoms}`.trim(),
        telephone && telephone.length === 10 ? telephone : null
      ]
    );
    
    const userId = userResult.insertId;
    
    // Créer le marchand
    await connection.execute(
      `INSERT INTO merchants (userId, merchantNumber, businessName, businessType, location, isVerified, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userId,
        marchand_uid,
        nom_complet || `${nom} ${prenoms}`.trim(),
        'Vivrier', // Type par défaut
        marche,
        source === 'user_data' ? 1 : 0 // Vérifier les marchands de la source utilisateur
      ]
    );
    
    imported++;
    
    if (imported % 100 === 0) {
      console.log(`   ⏳ ${imported}/${merchants.length} importés...`);
    }
  } catch (error) {
    errors++;
    if (errors <= 5) {
      console.error(`   ⚠️  Erreur pour ${merchant.nom_complet}:`, error.message);
    }
  }
}

console.log(`   ✓ ${imported} marchands importés avec succès`);
if (errors > 0) {
  console.log(`   ⚠️  ${errors} erreurs rencontrées`);
}

// 4. Vérifier les résultats
console.log('\n🔍 Vérification des résultats...');

const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM merchants');
const totalMerchants = countResult[0].count;

const [verifiedResult] = await connection.execute('SELECT COUNT(*) as count FROM merchants WHERE isVerified = 1');
const verifiedMerchants = verifiedResult[0].count;

const [withPhoneResult] = await connection.execute(`
  SELECT COUNT(*) as count 
  FROM merchants m
  LEFT JOIN users u ON m.userId = u.id
  WHERE u.phone IS NOT NULL AND LENGTH(u.phone) = 10
`);
const withPhone = withPhoneResult[0].count;

const [byMarketResult] = await connection.execute(`
  SELECT location as marche, COUNT(*) as count
  FROM merchants
  WHERE location IS NOT NULL
  GROUP BY location
  ORDER BY count DESC
  LIMIT 10
`);

console.log(`   ✓ Total marchands en base: ${totalMerchants}`);
console.log(`   ✓ Marchands vérifiés: ${verifiedMerchants}`);
console.log(`   ✓ Marchands avec téléphone: ${withPhone}`);

console.log('\n📊 Répartition par marché (top 10):');
for (const row of byMarketResult) {
  console.log(`   - ${row.marche}: ${row.count}`);
}

// 5. Fermer la connexion
await connection.end();

console.log('\n' + '='.repeat(80));
console.log('✅ MISE À JOUR TERMINÉE AVEC SUCCÈS');
console.log('='.repeat(80));
console.log();
