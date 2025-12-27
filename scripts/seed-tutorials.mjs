#!/usr/bin/env node

/**
 * Script de seed pour les tutoriels vidéo
 * Crée 10 tutoriels vidéo courts (30 secondes) avec des vendeuses réelles
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL is required");
  process.exit(1);
}

const connection = await mysql.createConnection(connectionString);
const db = drizzle(connection, { schema, mode: "default" });

console.log("🎥 Seeding video tutorials...\n");

// Tutoriels vidéo (URLs de démonstration - à remplacer par de vraies vidéos)
const tutorials = [
  // Catégorie: Caisse
  {
    title: "Comment enregistrer une vente rapidement",
    titleDioula: "I bɛ feereli kɛ cogo di?",
    description: "Apprenez à enregistrer une vente en 3 clics avec la caisse tactile. Awa du marché de Koumassi vous montre comment faire.",
    descriptionDioula: "Aw ye feereli kɛcogo lon ka taa saba ye. Awa bɛ aw jira a kɛcogo.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Placeholder
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 30,
    category: "caisse",
    order: 1,
  },
  {
    title: "Utiliser la commande vocale pour vendre",
    titleDioula: "Ka baara kɛ ni kan ye",
    description: "Vendez sans toucher l'écran ! Dites simplement 'Vendre 3 tas de tomates' et la vente est enregistrée.",
    descriptionDioula: "I bɛ se ka feereli kɛ ni kan ye dɔrɔn! Fɔ 'Feereli 3 tas tomates' ani a bɛ kɛ.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 28,
    category: "caisse",
    order: 2,
  },
  {
    title: "Consulter vos ventes du jour",
    titleDioula: "Ka i ka feereli lajɛ",
    description: "Voyez combien vous avez gagné aujourd'hui et quels produits se vendent le mieux.",
    descriptionDioula: "I bɛ se ka i ka wari ye bi ani fɛɛrɛw minw bɛ feereli kɛ kosɔbɛ.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 25,
    category: "caisse",
    order: 3,
  },
  
  // Catégorie: Stock
  {
    title: "Gérer votre stock facilement",
    titleDioula: "Ka i ka fɛɛrɛw ɲɛnabɔ",
    description: "Ajoutez des produits, modifiez les quantités et recevez des alertes quand le stock est bas.",
    descriptionDioula: "Fɛɛrɛw fara a kan, hakɛ caman yɛlɛma ani kunnafoni sɔrɔ ni fɛɛrɛw dɔgɔyara.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 32,
    category: "stock",
    order: 1,
  },
  {
    title: "Comprendre les alertes de stock bas",
    titleDioula: "Kunnafoni fɛɛrɛw dɔgɔlen kan",
    description: "Quand un produit est presque épuisé, l'application vous prévient automatiquement avec un son et une couleur rouge.",
    descriptionDioula: "Ni fɛɛrɛ dɔ banna, baarakɛminɛn bɛ i kunnafoni di ni mankan ye ani kulɛri bilenman ye.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 27,
    category: "stock",
    order: 2,
  },
  
  // Catégorie: Marché
  {
    title: "Commander au marché virtuel",
    titleDioula: "Ka fɛɛrɛw san sugu kura la",
    description: "Commandez vos produits directement auprès des grossistes et payez avec Mobile Money.",
    descriptionDioula: "Fɛɛrɛw san ka bɔ feerekɛlaw fɛ ani ka sara kɛ ni Mobile Money ye.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 35,
    category: "marche",
    order: 1,
  },
  {
    title: "Payer avec Orange Money ou MTN",
    titleDioula: "Ka sara kɛ ni Orange Money walima MTN ye",
    description: "Payez vos commandes en toute sécurité avec votre téléphone. Pas besoin d'argent liquide !",
    descriptionDioula: "I bɛ se ka i ka feereli sara kɛ ni i ka telefɔni ye. Wari kɛnɛya tɛ yen!",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 29,
    category: "marche",
    order: 2,
  },
  
  // Catégorie: Protection sociale
  {
    title: "Vérifier votre CNPS et CMU",
    titleDioula: "Ka i ka CNPS ani CMU lajɛ",
    description: "Consultez l'état de vos cotisations retraite (CNPS) et santé (CMU) directement dans l'application.",
    descriptionDioula: "I bɛ se ka i ka sɔrɔli kɛnɛya (CMU) ani i ka kɔrɔbali (CNPS) lajɛ baarakɛminɛn kɔnɔ.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 26,
    category: "protection_sociale",
    order: 1,
  },
  
  // Catégorie: Général
  {
    title: "Ouvrir et fermer votre journée",
    titleDioula: "Ka i ka tile dabɔ ani ka a datugu",
    description: "Commencez votre journée en ouvrant la caisse et terminez en fermant pour voir vos résultats.",
    descriptionDioula: "I ka tile dabɔ ni feereli dabɔli ye ani ka a datugu walasa ka i ka jaabiw ye.",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 31,
    category: "general",
    order: 1,
  },
  {
    title: "Activer le son et changer la langue",
    titleDioula: "Ka mankan dabɔ ani ka kan yɛlɛma",
    description: "Personnalisez l'application en activant les sons et en choisissant entre Français et Dioula.",
    descriptionDioula: "Baarakɛminɛn labɛn i yɛrɛ ma: mankan dabɔ ani kan sugandi (Faransi walima Jula).",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
    duration: 24,
    category: "general",
    order: 2,
  },
];

let created = 0;
let skipped = 0;

for (const tutorial of tutorials) {
  try {
    const [existing] = await db
      .select()
      .from(schema.videoTutorials)
      .where(eq(schema.videoTutorials.title, tutorial.title))
      .limit(1);

    if (existing) {
      console.log(`⏭️  Skipped: ${tutorial.title} (already exists)`);
      skipped++;
      continue;
    }

    await db.insert(schema.videoTutorials).values(tutorial);
    console.log(`✅ Created: ${tutorial.title}`);
    created++;
  } catch (error) {
    console.error(`❌ Error creating tutorial "${tutorial.title}":`, error.message);
  }
}

console.log(`\n✨ Seed completed!`);
console.log(`   Created: ${created} tutorials`);
console.log(`   Skipped: ${skipped} tutorials (already exist)`);

await connection.end();
process.exit(0);
