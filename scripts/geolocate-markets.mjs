#!/usr/bin/env node

/**
 * Script de géolocalisation automatique des marchés
 * Utilise Google Maps Geocoding API pour trouver les coordonnées GPS
 */

import { createConnection } from 'mysql2/promise';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

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

/**
 * Géocoder une adresse via Google Maps API
 */
async function geocodeAddress(marketName) {
  // Construire la requête de recherche
  const searchQuery = `Marché ${marketName} Abidjan Côte d'Ivoire`;
  
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️  GOOGLE_MAPS_API_KEY non définie, utilisation de coordonnées par défaut');
    // Coordonnées par défaut (centre d'Abidjan)
    return {
      latitude: 5.3599517,
      longitude: -4.0082563,
      address: `Marché ${marketName}, Abidjan`,
      isEstimated: true,
    };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        address: result.formatted_address,
        isEstimated: false,
      };
    } else {
      console.warn(`⚠️  Géocodage échoué pour ${marketName}: ${data.status}`);
      // Coordonnées par défaut avec un léger décalage aléatoire
      const randomOffset = () => (Math.random() - 0.5) * 0.01;
      return {
        latitude: 5.3599517 + randomOffset(),
        longitude: -4.0082563 + randomOffset(),
        address: `Marché ${marketName}, Abidjan`,
        isEstimated: true,
      };
    }
  } catch (error) {
    console.error(`❌ Erreur géocodage pour ${marketName}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🗺️  Début de la géolocalisation des marchés...\n');

  const config = parseMySQLUrl(DATABASE_URL);
  config.ssl = { rejectUnauthorized: true };
  const connection = await createConnection(config);

  try {
    // Récupérer tous les marchés non géolocalisés
    const [markets] = await connection.execute(
      'SELECT id, name FROM markets WHERE isGeolocated = FALSE OR isGeolocated IS NULL'
    );

    console.log(`📍 ${markets.length} marchés à géolocaliser\n`);

    let successCount = 0;
    let estimatedCount = 0;

    for (const market of markets) {
      console.log(`🔍 Géolocalisation de "${market.name}"...`);
      
      const geocode = await geocodeAddress(market.name);
      
      if (geocode) {
        await connection.execute(
          `UPDATE markets 
           SET latitude = ?, 
               longitude = ?, 
               address = ?, 
               isGeolocated = TRUE, 
               geolocatedAt = NOW()
           WHERE id = ?`,
          [geocode.latitude, geocode.longitude, geocode.address, market.id]
        );

        if (geocode.isEstimated) {
          console.log(`  ⚠️  Position estimée: ${geocode.latitude}, ${geocode.longitude}`);
          estimatedCount++;
        } else {
          console.log(`  ✓ Position trouvée: ${geocode.latitude}, ${geocode.longitude}`);
        }
        console.log(`  📍 ${geocode.address}\n`);
        successCount++;
      } else {
        console.log(`  ✗ Échec de la géolocalisation\n`);
      }

      // Pause pour respecter les limites de l'API
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n📊 Résumé:');
    console.log(`  - Total: ${markets.length}`);
    console.log(`  - Géolocalisés: ${successCount}`);
    console.log(`  - Positions exactes: ${successCount - estimatedCount}`);
    console.log(`  - Positions estimées: ${estimatedCount}`);

    if (estimatedCount > 0) {
      console.log('\n⚠️  Certains marchés ont des positions estimées.');
      console.log('   Vous pouvez les corriger manuellement dans l\'interface admin.');
    }

    console.log('\n✅ Géolocalisation terminée !');

  } catch (error) {
    console.error('\n❌ Erreur lors de la géolocalisation:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
