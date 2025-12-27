/**
 * Script de génération automatique de la bibliothèque audio en Dioula
 * 
 * Ce script :
 * 1. Lit tous les messages depuis audio-messages.json
 * 2. Traduit chaque message en Dioula via Lafricamobile
 * 3. Génère l'audio en Dioula via Lafricamobile TTS
 * 4. Upload les fichiers audio sur S3
 * 5. Stocke les URLs dans la base de données
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { audioLibrary } from '../drizzle/schema.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connexion à la base de données
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Configuration Lafricamobile
const LAFRICAMOBILE_USERNAME = process.env.LAFRICAMOBILE_USERNAME;
const LAFRICAMOBILE_PASSWORD = process.env.LAFRICAMOBILE_PASSWORD;
const LAFRICAMOBILE_BASE_URL = 'https://api.lafricamobile.com';

if (!LAFRICAMOBILE_USERNAME || !LAFRICAMOBILE_PASSWORD) {
  console.error('❌ Variables d\'environnement Lafricamobile manquantes');
  process.exit(1);
}

/**
 * Obtenir un token d'authentification Lafricamobile
 */
async function getAuthToken() {
  const response = await fetch(`${LAFRICAMOBILE_BASE_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: LAFRICAMOBILE_USERNAME,
      password: LAFRICAMOBILE_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error(`Erreur d'authentification: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Traduire un texte en Dioula via Lafricamobile
 */
async function translateToDioula(text, token) {
  // Limiter à 512 caractères
  const textToTranslate = text.substring(0, 512);
  
  const response = await fetch(`${LAFRICAMOBILE_BASE_URL}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      text: textToTranslate,
      source_language: 'fr',
      target_language: 'dioula',
    }),
  });

  if (!response.ok) {
    console.warn(`⚠️ Erreur de traduction pour: "${text}"`);
    return text; // Fallback sur le texte français
  }

  const data = await response.json();
  return data.translated_text || text;
}

/**
 * Générer l'audio en Dioula via Lafricamobile TTS
 */
async function generateAudio(text, token) {
  const response = await fetch(`${LAFRICAMOBILE_BASE_URL}/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      text: text,
      language: 'dioula',
      voice: 'default',
    }),
  });

  if (!response.ok) {
    throw new Error(`Erreur de génération audio: ${response.statusText}`);
  }

  // L'API retourne le fichier audio en base64 ou un buffer
  const audioBuffer = await response.arrayBuffer();
  return Buffer.from(audioBuffer);
}

/**
 * Uploader un fichier audio sur S3 (simulé pour l'instant)
 */
async function uploadAudioToS3(audioBuffer, key) {
  // Pour l'instant, on simule l'upload
  // Dans un environnement de production, utiliser AWS SDK ou storagePut
  const fileName = `audio-library/${key}.mp3`;
  
  // Sauvegarder temporairement en local pour test
  const localPath = path.join(__dirname, '../storage/audio', `${key}.mp3`);
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, audioBuffer);
  
  // Retourner une URL fictive pour l'instant
  return `https://storage.ifn-connect.com/audio-library/${key}.mp3`;
}

/**
 * Calculer la durée approximative d'un audio (en secondes)
 * Estimation basée sur la longueur du texte (environ 150 mots/minute en Dioula)
 */
function estimateAudioDuration(text) {
  const words = text.split(/\s+/).length;
  const wordsPerSecond = 2.5; // 150 mots/minute = 2.5 mots/seconde
  return Math.ceil(words / wordsPerSecond);
}

/**
 * Traiter un message : traduire, générer audio, uploader
 */
async function processMessage(message, token) {
  console.log(`\n📝 Traitement: ${message.key}`);
  console.log(`   FR: ${message.textFr}`);
  
  try {
    // 1. Traduire en Dioula
    console.log('   🔄 Traduction...');
    const textDioula = await translateToDioula(message.textFr, token);
    console.log(`   DI: ${textDioula}`);
    
    // 2. Générer l'audio
    console.log('   🎤 Génération audio...');
    const audioBuffer = await generateAudio(textDioula, token);
    
    // 3. Uploader sur S3
    console.log('   ☁️  Upload S3...');
    const audioUrl = await uploadAudioToS3(audioBuffer, message.key);
    console.log(`   ✅ URL: ${audioUrl}`);
    
    // 4. Calculer la durée
    const audioDuration = estimateAudioDuration(textDioula);
    
    // 5. Insérer dans la base de données
    await db.insert(audioLibrary).values({
      key: message.key,
      category: message.category,
      textFr: message.textFr,
      textDioula: textDioula,
      audioUrl: audioUrl,
      audioDuration: audioDuration,
      context: message.context,
      priority: message.priority,
    });
    
    console.log(`   ✅ Enregistré dans la base de données`);
    
    // Petit délai pour éviter de surcharger l'API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    console.error(`   ❌ Erreur: ${error.message}`);
    return false;
  }
}

/**
 * Script principal
 */
async function main() {
  console.log('🎤 GÉNÉRATION DE LA BIBLIOTHÈQUE AUDIO EN DIOULA\n');
  console.log('================================================\n');
  
  try {
    // 1. Charger les messages
    const messagesPath = path.join(__dirname, '../server/data/audio-messages.json');
    const messagesContent = await fs.readFile(messagesPath, 'utf-8');
    const messagesData = JSON.parse(messagesContent);
    
    // Aplatir toutes les catégories en un seul tableau
    const allMessages = Object.values(messagesData).flat();
    console.log(`📋 ${allMessages.length} messages à traiter\n`);
    
    // 2. S'authentifier
    console.log('🔐 Authentification Lafricamobile...');
    const token = await getAuthToken();
    console.log('✅ Authentifié avec succès\n');
    
    // 3. Traiter chaque message
    let successCount = 0;
    let errorCount = 0;
    
    for (const message of allMessages) {
      const success = await processMessage(message, token);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }
    
    // 4. Résumé
    console.log('\n================================================');
    console.log('📊 RÉSUMÉ');
    console.log('================================================');
    console.log(`✅ Succès: ${successCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📦 Total: ${allMessages.length}`);
    console.log('\n🎉 Génération terminée !');
    
  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();
