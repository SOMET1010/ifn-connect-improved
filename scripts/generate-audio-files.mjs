#!/usr/bin/env node

/**
 * Script de génération des fichiers audio en Dioula
 * 
 * Utilise l'API Lafricamobile pour générer des voix humaines naturelles
 * et les uploader sur S3 pour utilisation dans l'application
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Messages à générer en Dioula
const messages = [
  {
    id: 'welcome',
    text: 'I ni ce. I ka VENDRE digi walasa ka daminɛ.', // "Bienvenue. Touchez VENDRE pour commencer."
    french: 'Bienvenue. Touchez VENDRE pour commencer.'
  },
  {
    id: 'sell',
    text: 'Feereli kɛ', // "Faire une vente"
    french: 'Faire une vente'
  },
  {
    id: 'stock',
    text: 'N ka stock lajɛ', // "Voir mon stock"
    french: 'Voir mon stock'
  },
  {
    id: 'money',
    text: 'N ka wari lajɛ', // "Voir mon argent"
    french: 'Voir mon argent'
  },
  {
    id: 'help',
    text: 'Dɛmɛ sɔrɔ', // "Obtenir de l'aide"
    french: 'Obtenir de l\'aide'
  },
  {
    id: 'low_stock',
    text: 'I ka stock banna. I ka wari dɔ fara a kan.', // "Votre stock est bas. Ajoutez des produits."
    french: 'Votre stock est bas. Ajoutez des produits.'
  },
  {
    id: 'sale_success',
    text: 'Feereli kɛra kosɔbɛ. A ni ce!', // "Vente enregistrée avec succès. Bravo!"
    french: 'Vente enregistrée avec succès. Bravo!'
  },
  {
    id: 'error',
    text: 'Fili dɔ bɛ yen. I ka segin ka a lajɛ.', // "Il y a un problème. Réessayez."
    french: 'Il y a un problème. Réessayez.'
  }
];

console.log('🎤 Génération des fichiers audio en Dioula...\n');

// Créer le dossier de sortie
const outputDir = '/tmp/audio-dioula';
mkdirSync(outputDir, { recursive: true });

// Récupérer les credentials depuis les variables d'environnement
const username = process.env.LAFRICAMOBILE_USERNAME;
const password = process.env.LAFRICAMOBILE_PASSWORD;

if (!username || !password) {
  console.error('❌ Erreur : Les credentials Lafricamobile ne sont pas configurés');
  console.error('Variables requises : LAFRICAMOBILE_USERNAME, LAFRICAMOBILE_PASSWORD');
  process.exit(1);
}

console.log('✅ Credentials Lafricamobile trouvés\n');

// Fonction pour générer un fichier audio
async function generateAudio(message) {
  console.log(`📝 Génération : ${message.id}`);
  console.log(`   Texte Dioula : ${message.text}`);
  console.log(`   Traduction : ${message.french}`);
  
  try {
    // Appel à l'API Lafricamobile TTS
    const response = await fetch('https://api.lafricamobile.com/tts/v1/synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      },
      body: JSON.stringify({
        text: message.text,
        language: 'dyu', // Code ISO 639-3 pour Dioula
        voice: 'female', // Voix féminine (plus douce)
        speed: 0.9 // Parler un peu plus lentement
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // Récupérer le fichier audio
    const audioBuffer = await response.arrayBuffer();
    const outputPath = join(outputDir, `${message.id}.mp3`);
    writeFileSync(outputPath, Buffer.from(audioBuffer));
    
    console.log(`   ✅ Fichier créé : ${outputPath}\n`);
    
    return outputPath;
  } catch (error) {
    console.error(`   ❌ Erreur : ${error.message}\n`);
    return null;
  }
}

// Générer tous les fichiers audio
const audioFiles = [];
for (const message of messages) {
  const filePath = await generateAudio(message);
  if (filePath) {
    audioFiles.push({
      id: message.id,
      path: filePath,
      text: message.text,
      french: message.french
    });
  }
}

console.log(`\n✅ ${audioFiles.length}/${messages.length} fichiers générés avec succès`);

// Uploader les fichiers sur S3
console.log('\n📤 Upload des fichiers sur S3...\n');

const uploadedFiles = [];
for (const file of audioFiles) {
  try {
    console.log(`📤 Upload : ${file.id}.mp3`);
    
    // Utiliser la commande manus-upload-file
    const result = execSync(`manus-upload-file ${file.path}`, { encoding: 'utf-8' });
    const url = result.trim();
    
    uploadedFiles.push({
      id: file.id,
      url: url,
      text: file.text,
      french: file.french
    });
    
    console.log(`   ✅ URL : ${url}\n`);
  } catch (error) {
    console.error(`   ❌ Erreur upload : ${error.message}\n`);
  }
}

// Générer le fichier de configuration TypeScript
const configContent = `/**
 * Configuration des fichiers audio en Dioula
 * 
 * Générés automatiquement par scripts/generate-audio-files.mjs
 * Ne pas modifier manuellement
 */

export const AUDIO_FILES = {
${uploadedFiles.map(f => `  ${f.id}: {
    url: '${f.url}',
    text: '${f.text}',
    french: '${f.french}'
  }`).join(',\n')}
} as const;

export type AudioFileId = keyof typeof AUDIO_FILES;
`;

const configPath = '/home/ubuntu/ifn-connect-improved/client/src/lib/audioFiles.ts';
writeFileSync(configPath, configContent);

console.log(`\n✅ Fichier de configuration créé : ${configPath}`);
console.log(`\n🎉 Génération terminée ! ${uploadedFiles.length} fichiers audio disponibles.`);
