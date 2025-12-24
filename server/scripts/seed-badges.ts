import { getDb } from "../db";
import { badges } from "../../drizzle/schema";

const INITIAL_BADGES = [
  {
    code: "FIRST_SALE",
    name: "🥇 Premier Pas",
    description: "Réalisez votre première vente",
    icon: "🥇",
    color: "yellow",
    requirement: "Enregistrer 1 vente",
    category: "sales",
    points: 10,
  },
  {
    code: "STOCK_MANAGER",
    name: "📦 Gestionnaire de Stock",
    description: "Maintenez un stock de 10 produits minimum",
    icon: "📦",
    color: "blue",
    requirement: "Avoir 10 produits en stock",
    category: "stock",
    points: 15,
  },
  {
    code: "GOLD_SELLER",
    name: "💰 Vendeur d'Or",
    description: "Atteignez 100 000 FCFA de ventes totales",
    icon: "💰",
    color: "gold",
    requirement: "100 000 FCFA de ventes",
    category: "sales",
    points: 25,
  },
  {
    code: "SOCIAL_PROTECTOR",
    name: "🛡️ Protecteur Social",
    description: "Activez votre CNPS et CMU",
    icon: "🛡️",
    color: "green",
    requirement: "CNPS + CMU actifs",
    category: "social",
    points: 30,
  },
  {
    code: "ACTIVE_LEARNER",
    name: "📚 Apprenant Actif",
    description: "Complétez 5 modules de formation",
    icon: "📚",
    color: "purple",
    requirement: "5 formations complétées",
    category: "learning",
    points: 20,
  },
  {
    code: "MENTOR",
    name: "🤝 Mentor",
    description: "Parrainez un nouveau marchand",
    icon: "🤝",
    color: "orange",
    requirement: "1 marchand parrainé",
    category: "community",
    points: 35,
  },
  {
    code: "REGULAR",
    name: "⭐ Régulier",
    description: "Vendez pendant 30 jours consécutifs",
    icon: "⭐",
    color: "blue",
    requirement: "30 jours consécutifs",
    category: "sales",
    points: 40,
  },
  {
    code: "EXPERT_SELLER",
    name: "🚀 Expert",
    description: "Atteignez 500 000 FCFA de ventes totales",
    icon: "🚀",
    color: "indigo",
    requirement: "500 000 FCFA de ventes",
    category: "sales",
    points: 50,
  },
  {
    code: "MASTER_SELLER",
    name: "👑 Maître",
    description: "Atteignez 1 000 000 FCFA de ventes totales",
    icon: "👑",
    color: "purple",
    requirement: "1 000 000 FCFA de ventes",
    category: "sales",
    points: 100,
  },
  {
    code: "LEGEND",
    name: "🌟 Légende",
    description: "Déverrouillez 5 badges différents",
    icon: "🌟",
    color: "rainbow",
    requirement: "5 badges débloqués",
    category: "achievement",
    points: 75,
  },
];

async function seedBadges() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Impossible de se connecter à la base de données");
    process.exit(1);
  }

  console.log("🔄 Seed des badges initiaux...");

  for (const badge of INITIAL_BADGES) {
    try {
      await db.insert(badges).values(badge);
      console.log(`✅ Badge créé : ${badge.name}`);
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        console.log(`⏭️  Badge déjà existant : ${badge.name}`);
      } else {
        console.error(`❌ Erreur pour ${badge.name}:`, error.message);
      }
    }
  }

  console.log(`\n✅ Seed des badges terminé !`);
  console.log(`📊 ${INITIAL_BADGES.length} badges disponibles`);
  
  process.exit(0);
}

seedBadges().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exit(1);
});
