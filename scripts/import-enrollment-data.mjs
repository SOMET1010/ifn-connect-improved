#!/usr/bin/env node

/**
 * Script d'import des données d'enrôlement
 * Importe markets.csv et actors.csv dans la base de données
 */

import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL non définie dans .env');
  process.exit(1);
}

// Parser l'URL de connexion MySQL
function parseMySQLUrl(url) {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)(\?.*)?/);
  if (!match) {
    throw new Error('Format DATABASE_URL invalide');
  }
  return {
    host: match[3],
    port: parseInt(match[4]),
    user: match[1],
    password: match[2],
    database: match[5],
  };
}

async function main() {
  console.log('🚀 Début de l\'import des données d\'enrôlement...\n');

  const config = parseMySQLUrl(DATABASE_URL);
  // Ajouter SSL pour TiDB Cloud
  config.ssl = { rejectUnauthorized: true };
  const connection = await createConnection(config);

  try {
    // ========================================================================
    // 1. IMPORT DES MARCHÉS
    // ========================================================================
    console.log('📊 Import des marchés depuis markets.csv...');
    
    const marketsPath = join(__dirname, '../upload/markets.csv');
    const marketsCSV = readFileSync(marketsPath, 'utf-8');
    const marketsData = parse(marketsCSV, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    let marketsImported = 0;
    for (const market of marketsData) {
      try {
        await connection.execute(
          `INSERT INTO markets (
            name, 
            sourceFile, 
            declaredEffectif, 
            declaredCmu, 
            declaredCnps, 
            declaredRsti, 
            rowsInFile, 
            uniqueIdentifierCodes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            sourceFile = VALUES(sourceFile),
            declaredEffectif = VALUES(declaredEffectif),
            declaredCmu = VALUES(declaredCmu),
            declaredCnps = VALUES(declaredCnps),
            declaredRsti = VALUES(declaredRsti),
            rowsInFile = VALUES(rowsInFile),
            uniqueIdentifierCodes = VALUES(uniqueIdentifierCodes)`,
          [
            market.market_name,
            market.source_file || null,
            market.declared_effectif ? parseInt(market.declared_effectif) : null,
            market.declared_cmu ? parseInt(market.declared_cmu) : null,
            market.declared_cnps ? parseInt(market.declared_cnps) : null,
            market.declared_rsti ? parseInt(market.declared_rsti) : null,
            market.rows_in_file ? parseInt(market.rows_in_file) : null,
            market.unique_identifier_codes ? parseInt(market.unique_identifier_codes) : null,
          ]
        );
        marketsImported++;
        console.log(`  ✓ ${market.market_name}`);
      } catch (error) {
        console.error(`  ✗ Erreur pour ${market.market_name}:`, error.message);
      }
    }

    console.log(`\n✅ ${marketsImported}/${marketsData.length} marchés importés\n`);

    // ========================================================================
    // 2. IMPORT DES ACTEURS
    // ========================================================================
    console.log('👥 Import des acteurs depuis actors.csv...');
    
    const actorsPath = join(__dirname, '../upload/actors.csv');
    const actorsCSV = readFileSync(actorsPath, 'utf-8');
    const actorsData = parse(actorsCSV, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    let actorsImported = 0;
    let batchSize = 100;
    let batch = [];

    for (let i = 0; i < actorsData.length; i++) {
      const actor = actorsData[i];
      batch.push([
        actor.actor_key,
        actor.market_name,
        actor.row_no ? parseInt(actor.row_no) : null,
        actor.full_name,
        actor.identifier_code || null,
        actor.phone || null,
        actor.source_file || null,
      ]);

      // Insérer par batch de 100
      if (batch.length >= batchSize || i === actorsData.length - 1) {
        try {
          const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
          const values = batch.flat();
          
          await connection.execute(
            `INSERT INTO actors (
              actorKey,
              marketName,
              rowNo,
              fullName,
              identifierCode,
              phone,
              sourceFile
            ) VALUES ${placeholders}
            ON DUPLICATE KEY UPDATE
              marketName = VALUES(marketName),
              rowNo = VALUES(rowNo),
              fullName = VALUES(fullName),
              identifierCode = VALUES(identifierCode),
              phone = VALUES(phone),
              sourceFile = VALUES(sourceFile)`,
            values
          );
          
          actorsImported += batch.length;
          console.log(`  ✓ ${actorsImported}/${actorsData.length} acteurs importés...`);
          batch = [];
        } catch (error) {
          console.error(`  ✗ Erreur batch:`, error.message);
        }
      }
    }

    console.log(`\n✅ ${actorsImported}/${actorsData.length} acteurs importés\n`);

    // ========================================================================
    // 3. LIER LES ACTEURS AUX MARCHÉS
    // ========================================================================
    console.log('🔗 Liaison des acteurs aux marchés...');
    
    const [updateResult] = await connection.execute(
      `UPDATE actors a
       INNER JOIN markets m ON a.marketName = m.name
       SET a.marketId = m.id
       WHERE a.marketId IS NULL`
    );

    console.log(`✅ ${updateResult.affectedRows} acteurs liés aux marchés\n`);

    // ========================================================================
    // 4. STATISTIQUES
    // ========================================================================
    console.log('📊 Statistiques finales:');
    
    const [marketCount] = await connection.execute('SELECT COUNT(*) as count FROM markets');
    const [actorCount] = await connection.execute('SELECT COUNT(*) as count FROM actors');
    const [linkedCount] = await connection.execute('SELECT COUNT(*) as count FROM actors WHERE marketId IS NOT NULL');

    console.log(`  - Marchés: ${marketCount[0].count}`);
    console.log(`  - Acteurs: ${actorCount[0].count}`);
    console.log(`  - Acteurs liés: ${linkedCount[0].count}`);

    console.log('\n✅ Import terminé avec succès !');

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'import:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
