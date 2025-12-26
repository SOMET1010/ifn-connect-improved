#!/usr/bin/env node
/**
 * Script d'import des marchands depuis le CSV extrait
 * Import en masse dans la base de données IFN Connect
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les données CSV
const CSV_FILE = '/home/ubuntu/merchants_extracted.csv';
const PHOTOS_MAPPING_FILE = '/home/ubuntu/merchant_photos_mapping.json';

// Fonction pour parser le CSV
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || null;
    });
    data.push(row);
  }
  
  return data;
}

// Fonction pour générer un merchantNumber unique
function generateMerchantNumber(identifiant, cooperative) {
  // Format: COOP-IDENTIFIANT (ex: COVIYOP-0000467A)
  const coopPrefix = cooperative.substring(0, 8).toUpperCase();
  return `${coopPrefix}-${identifiant}`;
}

// Fonction pour extraire nom et prénom
function splitName(nomComplet) {
  const parts = nomComplet.trim().split(/\s+/);
  if (parts.length === 1) {
    return { nom: parts[0], prenom: '' };
  }
  // Le premier mot est généralement le nom de famille
  const nom = parts[0];
  const prenom = parts.slice(1).join(' ');
  return { nom, prenom };
}

async function main() {
  console.log('=' .repeat(60));
  console.log('IMPORT DES MARCHANDS EN BASE DE DONNÉES');
  console.log('=' .repeat(60));
  
  // Vérifier que le fichier CSV existe
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`✗ Fichier CSV non trouvé: ${CSV_FILE}`);
    process.exit(1);
  }
  
  // Charger le CSV
  console.log(`\n📄 Chargement du CSV: ${CSV_FILE}`);
  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const merchants = parseCSV(csvContent);
  console.log(`✓ ${merchants.length} marchands chargés`);
  
  // Charger le mapping des photos
  let photosMapping = {};
  if (fs.existsSync(PHOTOS_MAPPING_FILE)) {
    const photosData = JSON.parse(fs.readFileSync(PHOTOS_MAPPING_FILE, 'utf-8'));
    // Créer un mapping page -> URL
    photosData.forEach(photo => {
      photosMapping[photo.page] = photo.s3_url;
    });
    console.log(`✓ ${Object.keys(photosMapping).length} photos chargées`);
  }
  
  // Connexion à la base de données
  console.log('\n🔌 Connexion à la base de données...');
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);
  console.log('✓ Connecté');
  
  // Statistiques
  let usersCreated = 0;
  let merchantsCreated = 0;
  let cooperativesMap = new Map(); // Nom coopérative -> ID
  let errors = 0;
  
  console.log('\n📥 Import en cours...');
  
  for (let i = 0; i < merchants.length; i++) {
    const merchant = merchants[i];
    
    try {
      // Extraire nom et prénom
      const { nom, prenom } = splitName(merchant.nom_complet);
      
      // Générer merchantNumber unique
      const merchantNumber = generateMerchantNumber(merchant.identifiant, merchant.cooperative);
      
      // Vérifier si le marchand existe déjà (par merchantNumber)
      const [existingMerchant] = await connection.execute(
        'SELECT id FROM merchants WHERE merchantNumber = ?',
        [merchantNumber]
      );
      
      if (existingMerchant.length > 0) {
        // Marchand existe déjà, skip
        continue;
      }
      
      // Créer un utilisateur pour ce marchand
      const phone = merchant.telephone || null;
      const email = phone ? `${phone}@ifn-connect.ci` : null; // Email temporaire
      
      // Insérer l'utilisateur
      const [userResult] = await connection.execute(
        `INSERT INTO users (openId, name, email, phone, role, isActive, createdAt, updatedAt, lastSignedIn)
         VALUES (?, ?, ?, ?, 'merchant', true, NOW(), NOW(), NOW())`,
        [
          `merchant-${merchantNumber}`, // openId unique
          `${nom} ${prenom}`.trim(),
          email,
          phone
        ]
      );
      
      const userId = userResult.insertId;
      usersCreated++;
      
      // Insérer le marchand
      await connection.execute(
        `INSERT INTO merchants (userId, merchantNumber, businessName, businessType, location, isVerified, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, false, NOW(), NOW())`,
        [
          userId,
          merchantNumber,
          `${nom} ${prenom}`.trim(), // businessName = nom complet
          'Vivrier', // Type par défaut
          merchant.cooperative // Location = nom de la coopérative
        ]
      );
      
      merchantsCreated++;
      
      // Afficher la progression
      if ((i + 1) % 50 === 0) {
        console.log(`  Progression: ${i + 1}/${merchants.length} (${Math.round((i + 1) / merchants.length * 100)}%)`);
      }
      
    } catch (error) {
      errors++;
      console.error(`\n✗ Erreur import marchand ${merchant.nom_complet}: ${error.message}`);
    }
  }
  
  // Fermer la connexion
  await connection.end();
  
  // Résultats
  console.log('\n' + '=' .repeat(60));
  console.log('RÉSULTATS DE L\'IMPORT');
  console.log('=' .repeat(60));
  console.log(`✓ Utilisateurs créés: ${usersCreated}`);
  console.log(`✓ Marchands créés: ${merchantsCreated}`);
  console.log(`✗ Erreurs: ${errors}`);
  console.log(`\n✓ Import terminé avec succès!`);
}

main().catch(error => {
  console.error('✗ Erreur fatale:', error);
  process.exit(1);
});
