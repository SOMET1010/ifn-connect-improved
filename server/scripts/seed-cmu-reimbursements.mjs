/**
 * Script de génération de données de test pour les remboursements CMU
 * Génère 80 remboursements CMU pour 40 marchands sur 3-6 mois
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { merchants, cmuReimbursements } from '../../drizzle/schema.ts';

// Connexion à la base de données
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('🚀 Début du seed des remboursements CMU...\n');

// Récupérer 40 marchands aléatoires
const allMerchants = await db.select().from(merchants).limit(40);
console.log(`✅ ${allMerchants.length} marchands récupérés\n`);

if (allMerchants.length === 0) {
  console.error('❌ Aucun marchand trouvé dans la base de données');
  process.exit(1);
}

// Types de soins avec montants réalistes
const careTypes = [
  { type: 'consultation', minAmount: 2000, maxAmount: 5000 },
  { type: 'medication', minAmount: 3000, maxAmount: 15000 },
  { type: 'hospitalization', minAmount: 20000, maxAmount: 100000 },
  { type: 'surgery', minAmount: 50000, maxAmount: 200000 },
  { type: 'dental', minAmount: 5000, maxAmount: 30000 },
  { type: 'optical', minAmount: 10000, maxAmount: 50000 },
  { type: 'maternity', minAmount: 15000, maxAmount: 80000 },
  { type: 'emergency', minAmount: 10000, maxAmount: 60000 },
];

// Statuts possibles
const statuses = ['approved', 'pending', 'rejected'];
const statusWeights = [0.7, 0.2, 0.1]; // 70% approved, 20% pending, 10% rejected

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

// Fonction pour générer un montant aléatoire selon le type de soin
function getAmountForCareType(careType) {
  const { minAmount, maxAmount } = careType;
  return Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;
}

// Fonction pour générer une référence de remboursement unique
let refCounter = 0;
function generateClaimRef() {
  const prefix = 'CMU';
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

// Établissements de santé
const healthFacilities = [
  'CHU de Cocody',
  'CHU de Yopougon',
  'CHU de Treichville',
  'Hôpital Général d\'Abobo',
  'Hôpital Général de Port-Bouët',
  'Clinique Internationale de l\'Indénié',
  'Polyclinique Sainte Anne-Marie',
  'Centre de Santé Urbain d\'Adjamé',
  'Centre de Santé Urbain de Koumassi',
  'Pharmacie du Plateau',
];

// Générer les remboursements
const reimbursementsToInsert = [];
let approvedCount = 0;
let pendingCount = 0;
let rejectedCount = 0;

// Compteurs par type de soin
const careTypeStats = {
  consultation: 0,
  medication: 0,
  hospitalization: 0,
  surgery: 0,
  dental: 0,
  optical: 0,
  maternity: 0,
  emergency: 0,
};

for (let i = 0; i < 80; i++) {
  // Sélectionner un marchand aléatoire
  const merchant = allMerchants[Math.floor(Math.random() * allMerchants.length)];
  
  // Sélectionner un type de soin aléatoire
  const careType = careTypes[Math.floor(Math.random() * careTypes.length)];
  
  // Générer les données du remboursement
  const status = getWeightedStatus();
  const totalAmount = getAmountForCareType(careType);
  
  // Taux de remboursement CMU : 70% en général
  const reimbursementRate = 70.00;
  const reimbursedAmount = Math.round(totalAmount * (reimbursementRate / 100));
  
  const careDate = getRandomDateInPast();
  const claimRef = generateClaimRef();
  const healthFacility = healthFacilities[Math.floor(Math.random() * healthFacilities.length)];
  
  // Compter les statuts
  if (status === 'approved') approvedCount++;
  else if (status === 'pending') pendingCount++;
  else if (status === 'rejected') rejectedCount++;
  
  // Compter les types de soins
  careTypeStats[careType.type]++;
  
  reimbursementsToInsert.push({
    merchantId: merchant.id,
    careType: careType.type,
    careDate,
    totalAmount,
    reimbursedAmount,
    reimbursementRate,
    status,
    healthFacility,
    reference: claimRef,
    description: `Remboursement ${careType.type} - ${healthFacility}`,
    createdAt: careDate,
    updatedAt: careDate,
  });
}

// Insérer les remboursements dans la base de données
console.log('📝 Insertion des remboursements CMU...');
await db.insert(cmuReimbursements).values(reimbursementsToInsert);

console.log('\n✅ Seed des remboursements CMU terminé avec succès !\n');
console.log('📊 Statistiques :');
console.log(`   - Total de remboursements : ${reimbursementsToInsert.length}`);
console.log(`   - Approuvés (approved) : ${approvedCount} (${Math.round(approvedCount / reimbursementsToInsert.length * 100)}%)`);
console.log(`   - En attente (pending) : ${pendingCount} (${Math.round(pendingCount / reimbursementsToInsert.length * 100)}%)`);
console.log(`   - Rejetés (rejected) : ${rejectedCount} (${Math.round(rejectedCount / reimbursementsToInsert.length * 100)}%)`);
console.log(`\n   Par type de soin :`);
console.log(`   - Consultation : ${careTypeStats.consultation} (${Math.round(careTypeStats.consultation / reimbursementsToInsert.length * 100)}%)`);
console.log(`   - Médicaments : ${careTypeStats.medication} (${Math.round(careTypeStats.medication / reimbursementsToInsert.length * 100)}%)`);
console.log(`   - Hospitalisation : ${careTypeStats.hospitalization} (${Math.round(careTypeStats.hospitalization / reimbursementsToInsert.length * 100)}%)`);
console.log(`   - Chirurgie : ${careTypeStats.surgery} (${Math.round(careTypeStats.surgery / reimbursementsToInsert.length * 100)}%)`);
console.log(`   - Dentaire : ${careTypeStats.dental} (${Math.round(careTypeStats.dental / reimbursementsToInsert.length * 100)}%)`);
console.log(`   - Optique : ${careTypeStats.optical} (${Math.round(careTypeStats.optical / reimbursementsToInsert.length * 100)}%)`);
console.log(`   - Maternité : ${careTypeStats.maternity} (${Math.round(careTypeStats.maternity / reimbursementsToInsert.length * 100)}%)`);
console.log(`   - Urgence : ${careTypeStats.emergency} (${Math.round(careTypeStats.emergency / reimbursementsToInsert.length * 100)}%)`);
console.log(`\n   - Montant total : ${reimbursementsToInsert.reduce((sum, r) => sum + Number(r.totalAmount), 0).toLocaleString('fr-FR')} FCFA`);
console.log(`   - Montant remboursé : ${reimbursementsToInsert.reduce((sum, r) => sum + Number(r.reimbursedAmount), 0).toLocaleString('fr-FR')} FCFA`);
console.log(`   - Montant moyen : ${Math.round(reimbursementsToInsert.reduce((sum, r) => sum + Number(r.totalAmount), 0) / reimbursementsToInsert.length).toLocaleString('fr-FR')} FCFA`);

// Fermer la connexion
await connection.end();
console.log('\n🔌 Connexion à la base de données fermée');
