/**
 * Script pour peupler les événements prédéfinis (Ramadan, Tabaski, Noël, Rentrée)
 * Usage: node server/seed-events.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import { localEvents, eventStockRecommendations } from "../drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

// Événements 2025-2026
const events = [
  {
    name: "Ramadan 2025",
    type: "religious",
    date: new Date("2025-03-01"),
    endDate: new Date("2025-03-30"),
    description: "Mois sacré du jeûne musulman",
    isRecurring: true,
    iconEmoji: "🌙",
    color: "green",
  },
  {
    name: "Tabaski 2025 (Aïd el-Kebir)",
    type: "religious",
    date: new Date("2025-06-07"),
    description: "Fête du sacrifice",
    isRecurring: true,
    iconEmoji: "🐑",
    color: "purple",
  },
  {
    name: "Fête de l'Indépendance",
    type: "national",
    date: new Date("2025-08-07"),
    description: "Indépendance de la Côte d'Ivoire",
    isRecurring: true,
    iconEmoji: "🇨🇮",
    color: "orange",
  },
  {
    name: "Rentrée Scolaire 2025",
    type: "cultural",
    date: new Date("2025-09-15"),
    description: "Début de l'année scolaire",
    isRecurring: true,
    iconEmoji: "📚",
    color: "blue",
  },
  {
    name: "Noël 2025",
    type: "religious",
    date: new Date("2025-12-25"),
    description: "Fête de la Nativité",
    isRecurring: true,
    iconEmoji: "🎄",
    color: "red",
  },
  {
    name: "Nouvel An 2026",
    type: "cultural",
    date: new Date("2026-01-01"),
    description: "Nouvelle année",
    isRecurring: true,
    iconEmoji: "🎉",
    color: "gold",
  },
];

// Recommandations de stock par événement
const recommendations = {
  "Ramadan 2025": [
    { productName: "Sucre", category: "Alimentaire", priority: "high", estimatedDemandIncrease: 200 },
    { productName: "Lait", category: "Alimentaire", priority: "high", estimatedDemandIncrease: 150 },
    { productName: "Dattes", category: "Alimentaire", priority: "high", estimatedDemandIncrease: 300 },
    { productName: "Farine", category: "Alimentaire", priority: "medium", estimatedDemandIncrease: 120 },
    { productName: "Huile", category: "Alimentaire", priority: "medium", estimatedDemandIncrease: 130 },
  ],
  "Tabaski 2025 (Aïd el-Kebir)": [
    { productName: "Mouton", category: "Viande", priority: "high", estimatedDemandIncrease: 500 },
    { productName: "Riz", category: "Alimentaire", priority: "high", estimatedDemandIncrease: 180 },
    { productName: "Huile", category: "Alimentaire", priority: "high", estimatedDemandIncrease: 150 },
    { productName: "Condiments", category: "Alimentaire", priority: "medium", estimatedDemandIncrease: 140 },
    { productName: "Oignons", category: "Légumes", priority: "medium", estimatedDemandIncrease: 160 },
  ],
  "Fête de l'Indépendance": [
    { productName: "Boissons", category: "Boissons", priority: "high", estimatedDemandIncrease: 200 },
    { productName: "Snacks", category: "Alimentaire", priority: "high", estimatedDemandIncrease: 180 },
    { productName: "Drapeaux", category: "Décoration", priority: "medium", estimatedDemandIncrease: 300 },
  ],
  "Rentrée Scolaire 2025": [
    { productName: "Cahiers", category: "Scolaire", priority: "high", estimatedDemandIncrease: 400 },
    { productName: "Stylos", category: "Scolaire", priority: "high", estimatedDemandIncrease: 350 },
    { productName: "Uniformes", category: "Vêtements", priority: "high", estimatedDemandIncrease: 250 },
    { productName: "Sacs d'école", category: "Scolaire", priority: "medium", estimatedDemandIncrease: 200 },
    { productName: "Crayons", category: "Scolaire", priority: "medium", estimatedDemandIncrease: 180 },
  ],
  "Noël 2025": [
    { productName: "Poulet", category: "Viande", priority: "high", estimatedDemandIncrease: 250 },
    { productName: "Vin", category: "Boissons", priority: "high", estimatedDemandIncrease: 200 },
    { productName: "Gâteaux", category: "Pâtisserie", priority: "medium", estimatedDemandIncrease: 180 },
    { productName: "Décorations", category: "Décoration", priority: "medium", estimatedDemandIncrease: 220 },
  ],
  "Nouvel An 2026": [
    { productName: "Champagne", category: "Boissons", priority: "high", estimatedDemandIncrease: 300 },
    { productName: "Feux d'artifice", category: "Décoration", priority: "medium", estimatedDemandIncrease: 250 },
    { productName: "Snacks", category: "Alimentaire", priority: "medium", estimatedDemandIncrease: 150 },
  ],
};

async function seedEvents() {
  console.log("🌱 Seeding events...");

  try {
    // Insérer les événements
    for (const event of events) {
      const [insertedEvent] = await db.insert(localEvents).values(event);
      console.log(`✅ Created event: ${event.name}`);

      // Insérer les recommandations pour cet événement
      const recs = recommendations[event.name];
      if (recs) {
        for (const rec of recs) {
          await db.insert(eventStockRecommendations).values({
            eventId: insertedEvent.insertId,
            ...rec,
          });
        }
        console.log(`   📦 Added ${recs.length} stock recommendations`);
      }
    }

    console.log("\n🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding events:", error);
    process.exit(1);
  }

  process.exit(0);
}

seedEvents();
