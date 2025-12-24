import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { mysqlTable, int, varchar, text, decimal } from 'drizzle-orm/mysql-core';

// Redéfinir la table products pour éviter l'import TypeScript
const products = mysqlTable('products', {
  id: int('id').autoincrement().primaryKey(),
  name: text('name').notNull(),
  nameDioula: text('nameDioula'),
  category: varchar('category', { length: 100 }),
  unit: varchar('unit', { length: 50 }).notNull(),
  basePrice: decimal('basePrice', { precision: 10, scale: 2 }),
  imageUrl: text('imageUrl'),
  pictogramUrl: text('pictogramUrl'),
});

/**
 * Script de seed pour peupler la base de données avec 30 produits typiques des marchés ivoiriens
 * Inclut les noms en Dioula pour l'accessibilité
 */

const productsData = [
  // Légumes (7 produits)
  {
    nameFr: 'Tomates',
    nameDioula: 'Tomati',
    category: 'Légumes',
    unit: 'tas',
    basePrice: 500,
    description: 'Tomates fraîches du marché',
  },
  {
    nameFr: 'Oignons',
    nameDioula: 'Jaban',
    category: 'Légumes',
    unit: 'tas',
    basePrice: 300,
    description: 'Oignons locaux',
  },
  {
    nameFr: 'Aubergines',
    nameDioula: 'Jaxatu',
    category: 'Légumes',
    unit: 'tas',
    basePrice: 400,
    description: 'Aubergines africaines',
  },
  {
    nameFr: 'Gombo',
    nameDioula: 'Kàn',
    category: 'Légumes',
    unit: 'tas',
    basePrice: 350,
    description: 'Gombo frais',
  },
  {
    nameFr: 'Piment',
    nameDioula: 'Foronto',
    category: 'Légumes',
    unit: 'tas',
    basePrice: 200,
    description: 'Piment fort',
  },
  {
    nameFr: 'Chou',
    nameDioula: 'Sù',
    category: 'Légumes',
    unit: 'pièce',
    basePrice: 600,
    description: 'Chou vert',
  },
  {
    nameFr: 'Carotte',
    nameDioula: 'Karɔti',
    category: 'Légumes',
    unit: 'kg',
    basePrice: 800,
    description: 'Carottes fraîches',
  },

  // Céréales et tubercules (6 produits)
  {
    nameFr: 'Riz',
    nameDioula: 'Màlo',
    category: 'Céréales',
    unit: 'kg',
    basePrice: 600,
    description: 'Riz local',
  },
  {
    nameFr: 'Maïs',
    nameDioula: 'Kàba',
    category: 'Céréales',
    unit: 'kg',
    basePrice: 400,
    description: 'Maïs en grains',
  },
  {
    nameFr: 'Manioc',
    nameDioula: 'Bàgà',
    category: 'Tubercules',
    unit: 'kg',
    basePrice: 300,
    description: 'Manioc frais',
  },
  {
    nameFr: 'Igname',
    nameDioula: 'Bàsì',
    category: 'Tubercules',
    unit: 'kg',
    basePrice: 500,
    description: 'Igname de qualité',
  },
  {
    nameFr: 'Plantain',
    nameDioula: 'Nàmasa',
    category: 'Fruits',
    unit: 'régime',
    basePrice: 1500,
    description: 'Régime de plantain',
  },
  {
    nameFr: 'Patate douce',
    nameDioula: 'Dùnùgù',
    category: 'Tubercules',
    unit: 'kg',
    basePrice: 400,
    description: 'Patate douce',
  },

  // Légumineuses (4 produits)
  {
    nameFr: 'Arachides',
    nameDioula: 'Tìgà',
    category: 'Légumineuses',
    unit: 'kg',
    basePrice: 1000,
    description: 'Arachides décortiquées',
  },
  {
    nameFr: 'Haricots',
    nameDioula: 'Sɔ̀',
    category: 'Légumineuses',
    unit: 'kg',
    basePrice: 800,
    description: 'Haricots secs',
  },
  {
    nameFr: 'Niébé',
    nameDioula: 'Sɔ̀ fìn',
    category: 'Légumineuses',
    unit: 'kg',
    basePrice: 700,
    description: 'Niébé (haricot blanc)',
  },
  {
    nameFr: 'Soja',
    nameDioula: 'Soja',
    category: 'Légumineuses',
    unit: 'kg',
    basePrice: 900,
    description: 'Graines de soja',
  },

  // Poissons (4 produits)
  {
    nameFr: 'Tilapia',
    nameDioula: 'Jɛgɛ',
    category: 'Poissons',
    unit: 'kg',
    basePrice: 2000,
    description: 'Tilapia frais',
  },
  {
    nameFr: 'Carpe',
    nameDioula: 'Jɛgɛ ba',
    category: 'Poissons',
    unit: 'kg',
    basePrice: 2500,
    description: 'Carpe fraîche',
  },
  {
    nameFr: 'Poisson fumé',
    nameDioula: 'Jɛgɛ jàlan',
    category: 'Poissons',
    unit: 'kg',
    basePrice: 3000,
    description: 'Poisson fumé',
  },
  {
    nameFr: 'Sardines',
    nameDioula: 'Sardin',
    category: 'Poissons',
    unit: 'boîte',
    basePrice: 500,
    description: 'Boîte de sardines',
  },

  // Viandes (3 produits)
  {
    nameFr: 'Poulet',
    nameDioula: 'Sùsu',
    category: 'Viandes',
    unit: 'kg',
    basePrice: 2500,
    description: 'Poulet frais',
  },
  {
    nameFr: 'Mouton',
    nameDioula: 'Sàgà',
    category: 'Viandes',
    unit: 'kg',
    basePrice: 3500,
    description: 'Viande de mouton',
  },
  {
    nameFr: 'Bœuf',
    nameDioula: 'Mìsì',
    category: 'Viandes',
    unit: 'kg',
    basePrice: 3000,
    description: 'Viande de bœuf',
  },

  // Fruits (6 produits)
  {
    nameFr: 'Bananes',
    nameDioula: 'Nàmasa dɔ̀',
    category: 'Fruits',
    unit: 'régime',
    basePrice: 1000,
    description: 'Régime de bananes',
  },
  {
    nameFr: 'Oranges',
    nameDioula: 'Lɛmuru',
    category: 'Fruits',
    unit: 'tas',
    basePrice: 500,
    description: 'Oranges douces',
  },
  {
    nameFr: 'Mangues',
    nameDioula: 'Màngo',
    category: 'Fruits',
    unit: 'tas',
    basePrice: 600,
    description: 'Mangues mûres',
  },
  {
    nameFr: 'Noix de coco',
    nameDioula: 'Wɔ̀rɔ',
    category: 'Fruits',
    unit: 'pièce',
    basePrice: 300,
    description: 'Noix de coco fraîche',
  },
  {
    nameFr: 'Ananas',
    nameDioula: 'Anana',
    category: 'Fruits',
    unit: 'pièce',
    basePrice: 800,
    description: 'Ananas sucré',
  },
  {
    nameFr: 'Papaye',
    nameDioula: 'Papaya',
    category: 'Fruits',
    unit: 'pièce',
    basePrice: 700,
    description: 'Papaye mûre',
  },

  // Condiments (4 produits)
  {
    nameFr: 'Sel',
    nameDioula: 'Kɔ̀gɔ',
    category: 'Condiments',
    unit: 'kg',
    basePrice: 200,
    description: 'Sel de cuisine',
  },
  {
    nameFr: 'Cube Maggi',
    nameDioula: 'Maggi',
    category: 'Condiments',
    unit: 'sachet',
    basePrice: 100,
    description: 'Cube d\'assaisonnement',
  },
  {
    nameFr: 'Huile de palme',
    nameDioula: 'Tùlu',
    category: 'Condiments',
    unit: 'litre',
    basePrice: 1500,
    description: 'Huile de palme rouge',
  },
  {
    nameFr: 'Piment moulu',
    nameDioula: 'Foronto fàra',
    category: 'Condiments',
    unit: 'sachet',
    basePrice: 150,
    description: 'Piment en poudre',
  },
];

async function seedProducts() {
  console.log('🌾 Début du seed des produits...');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL non définie');
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  try {
    // Insérer tous les produits
    for (const product of productsData) {
      await db.insert(products).values({
        name: product.nameFr,
        nameDioula: product.nameDioula,
        category: product.category,
        unit: product.unit,
        basePrice: product.basePrice,
      });
      console.log(`✅ Produit créé: ${product.nameFr} (${product.nameDioula})`);
    }

    console.log(`\n🎉 ${productsData.length} produits créés avec succès !`);
    console.log('\n📊 Répartition par catégorie:');
    const categories = {};
    productsData.forEach(p => {
      categories[p.category] = (categories[p.category] || 0) + 1;
    });
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`   - ${cat}: ${count} produits`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seedProducts();
