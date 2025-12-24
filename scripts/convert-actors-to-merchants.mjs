#!/usr/bin/env node

/**
 * Script de conversion des acteurs en marchands
 * Convertit les 1278 acteurs de la table actors en utilisateurs et marchands complets
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema.js';
import crypto from 'crypto';

// Fonction pour générer un merchantNumber unique
function generateMerchantNumber(index) {
  return `MRC-${String(index).padStart(5, '0')}`;
}

// Fonction pour générer un openId unique
function generateOpenId(name, phone) {
  const data = `${name}-${phone}-${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

// Fonction pour déterminer le statut CNPS
function getCnpsStatus(hasCnps) {
  if (hasCnps === 'Oui') return 'active';
  if (hasCnps === 'Non') return 'inactive';
  return 'pending';
}

// Fonction pour déterminer le statut CMU
function getCmuStatus(hasCmu) {
  if (hasCmu === 'Oui') return 'active';
  if (hasCmu === 'Non') return 'inactive';
  return 'pending';
}

async function main() {
  console.log('🌱 Démarrage de la conversion des acteurs en marchands...\n');

  // Connexion à la base de données
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection, { schema, mode: 'default' });

  try {
    // 1. Récupérer tous les acteurs
    console.log('👥 Récupération des acteurs...');
    const actors = await db.select().from(schema.actors);
    console.log(`   ✓ ${actors.length} acteurs trouvés\n`);

    if (actors.length === 0) {
      console.log('⚠️  Aucun acteur trouvé.');
      process.exit(0);
    }

    // 2. Récupérer tous les marchés pour le mapping
    console.log('🏪 Récupération des marchés...');
    const markets = await db.select().from(schema.markets);
    const marketMap = new Map(markets.map(m => [m.name, m.id]));
    console.log(`   ✓ ${markets.length} marchés trouvés\n`);

    // 3. Convertir chaque acteur en user + merchant
    console.log('🔄 Conversion des acteurs en marchands...');
    let usersCreated = 0;
    let merchantsCreated = 0;
    let errors = 0;

    for (let i = 0; i < actors.length; i++) {
      const actor = actors[i];
      
      try {
        // Créer l'utilisateur
        const openId = generateOpenId(actor.fullName, actor.phone || '');
        const [userResult] = await db.insert(schema.users).values({
          openId: openId,
          name: actor.fullName,
          phone: actor.phone,
          role: 'merchant',
          language: 'fr',
          isActive: true,
        });

        const userId = userResult.insertId;
        usersCreated++;

        // Créer le marchand
        const merchantNumber = generateMerchantNumber(i + 1);
        const marketId = marketMap.get(actor.marketName);

        await db.insert(schema.merchants).values({
          userId: userId,
          merchantNumber: merchantNumber,
          businessName: actor.fullName, // Utiliser le nom complet de l'acteur
          businessType: 'Commerce informel',
          location: actor.marketName,
          cnpsNumber: actor.identifierCode, // Utiliser le code identificateur
          cmuNumber: actor.identifierCode,
          cnpsStatus: 'pending', // Par défaut pending car pas de données hasCnps/hasCmu
          cmuStatus: 'pending',
          isVerified: true,
          enrolledAt: actor.createdAt,
        });

        merchantsCreated++;

        // Afficher la progression tous les 100 acteurs
        if ((i + 1) % 100 === 0) {
          console.log(`   ✓ ${i + 1}/${actors.length} acteurs convertis...`);
        }

      } catch (error) {
        console.error(`   ❌ Erreur pour l'acteur ${actor.fullName}:`, error.message);
        errors++;
      }
    }

    console.log(`\n✅ Conversion terminée avec succès !\n`);
    console.log('📊 Statistiques :');
    console.log(`   • Acteurs traités : ${actors.length}`);
    console.log(`   • Utilisateurs créés : ${usersCreated}`);
    console.log(`   • Marchands créés : ${merchantsCreated}`);
    console.log(`   • Erreurs : ${errors}`);
    
    console.log('\n🎯 Prêt pour la création du stock initial !\n');

  } catch (error) {
    console.error('❌ Erreur lors de la conversion :', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

main();
