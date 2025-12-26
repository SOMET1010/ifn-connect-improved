/**
 * Script de génération de données de test pour les paiements CNPS
 * Génère 100 paiements CNPS pour 50 marchands sur 3-6 mois
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { merchants, cnpsPayments } from '../../drizzle/schema.ts';
import { eq } from 'drizzle-orm';

// Connexion à la base de données
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('🚀 Début du seed des paiements CNPS...\n');

// Récupérer 50 marchands aléatoires
const allMerchants = await db.select().from(merchants).limit(50);
console.log(`✅ ${allMerchants.length} marchands récupérés\n`);

if (allMerchants.length === 0) {
  console.error('❌ Aucun marchand trouvé dans la base de données');
  process.exit(1);
}

// Statuts possibles
const statuses = ['completed', 'pending', 'failed'];
const statusWeights = [0.8, 0.15, 0.05]; // 80% completed, 15% pending, 5% failed

// Montants possibles (en FCFA)
const amounts = [5000, 7500, 10000, 12500, 15000];

// Méthodes de paiement
const paymentMethods = ['mobile_money', 'bank_transfer', 'cash', 'card'];

// Fonction pour obtenir un statut pondéré
function getWeightedStatus() {
  const random = Math.random();
  let cumulativeWeight = 0;
  
  for (let i = 0; i < statuses.length; i++) {
    cumulativeWeight += statusWeights[i];
    if (random <= cumulativeWeight) {
      return statuses[i];
    }
  }
  
  return statuses[0]; // Par défaut
}

// Fonction pour générer une référence de transaction unique
let refCounter = 0;
function generateTransactionRef() {
  const prefix = 'CNPS';
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  refCounter++;
  return `${prefix}-${timestamp}-${random}-${refCounter}`;
}

// Fonction pour obtenir une date aléatoire entre 3 et 6 mois dans le passé
function getRandomDateInPast() {
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(now.getMonth() - 3);
  
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  
  const start = sixMonthsAgo.getTime();
  const end = threeMonthsAgo.getTime();
  const randomTime = start + Math.random() * (end - start);
  
  return new Date(randomTime);
}

// Générer les paiements
const paymentsToInsert = [];
let completedCount = 0;
let pendingCount = 0;
let failedCount = 0;

for (let i = 0; i < 100; i++) {
  // Sélectionner un marchand aléatoire
  const merchant = allMerchants[Math.floor(Math.random() * allMerchants.length)];
  
  // Générer les données du paiement
  const status = getWeightedStatus();
  const amount = amounts[Math.floor(Math.random() * amounts.length)];
  const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
  const paymentDate = getRandomDateInPast();
  const transactionRef = generateTransactionRef();
  
  // Compter les statuts
  if (status === 'completed') completedCount++;
  else if (status === 'pending') pendingCount++;
  else if (status === 'failed') failedCount++;
  
  paymentsToInsert.push({
    merchantId: merchant.id,
    amount,
    paymentMethod,
    status,
    reference: transactionRef,
    paymentDate,
    createdAt: paymentDate,
    updatedAt: paymentDate,
  });
}

// Insérer les paiements dans la base de données
console.log('📝 Insertion des paiements CNPS...');
await db.insert(cnpsPayments).values(paymentsToInsert);

console.log('\n✅ Seed des paiements CNPS terminé avec succès !\n');
console.log('📊 Statistiques :');
console.log(`   - Total de paiements : ${paymentsToInsert.length}`);
console.log(`   - Complétés (completed) : ${completedCount} (${Math.round(completedCount / paymentsToInsert.length * 100)}%)`);
console.log(`   - En attente (pending) : ${pendingCount} (${Math.round(pendingCount / paymentsToInsert.length * 100)}%)`);
console.log(`   - Échoués (failed) : ${failedCount} (${Math.round(failedCount / paymentsToInsert.length * 100)}%)`);
console.log(`   - Montant total : ${paymentsToInsert.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString('fr-FR')} FCFA`);
console.log(`   - Montant moyen : ${Math.round(paymentsToInsert.reduce((sum, p) => sum + Number(p.amount), 0) / paymentsToInsert.length).toLocaleString('fr-FR')} FCFA`);

// Fermer la connexion
await connection.end();
console.log('\n🔌 Connexion à la base de données fermée');
