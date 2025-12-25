/**
 * Script de génération automatique des alertes événements
 * 
 * Ce script génère automatiquement des alertes pour tous les marchands
 * 7 jours, 3 jours et 1 jour avant chaque événement.
 * 
 * À exécuter quotidiennement via cron job.
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { localEvents, eventAlerts, merchants } from '../drizzle/schema.js';
import { and, gte, lte, eq, sql } from 'drizzle-orm';

// Connexion à la base de données
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('🚀 Génération des alertes événements...\n');

// Récupérer tous les événements à venir (90 prochains jours)
const today = new Date();
const futureLimit = new Date();
futureLimit.setDate(today.getDate() + 90);

const upcomingEvents = await db
  .select()
  .from(localEvents)
  .where(
    and(
      gte(localEvents.date, today),
      lte(localEvents.date, futureLimit)
    )
  );

console.log(`📅 ${upcomingEvents.length} événements à venir trouvés\n`);

// Récupérer tous les marchands actifs
const allMerchants = await db.select().from(merchants);
console.log(`👥 ${allMerchants.length} marchands actifs\n`);

let alertsCreated = 0;

// Pour chaque événement
for (const event of upcomingEvents) {
  const eventDate = new Date(event.date);
  const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  console.log(`\n🎯 Événement: ${event.name} (dans ${daysUntil} jours)`);

  // Définir les seuils d'alerte
  const alertThresholds = [7, 3, 1];

  for (const threshold of alertThresholds) {
    // Si on est exactement à X jours de l'événement
    if (daysUntil === threshold) {
      console.log(`  ⏰ Génération des alertes ${threshold}j avant...`);

      // Créer une alerte pour chaque marchand
      for (const merchant of allMerchants) {
        try {
          // Vérifier si l'alerte existe déjà
          const existingAlert = await db
            .select()
            .from(eventAlerts)
            .where(
              and(
                eq(eventAlerts.eventId, event.id),
                eq(eventAlerts.merchantId, merchant.id),
                eq(eventAlerts.daysBeforeEvent, threshold)
              )
            )
            .limit(1);

          if (existingAlert.length === 0) {
            // Créer l'alerte
            let message = '';
            if (threshold === 7) {
              message = `${event.iconEmoji || '📅'} ${event.name} commence dans 7 jours ! Prépare ton stock maintenant.`;
            } else if (threshold === 3) {
              message = `${event.iconEmoji || '📅'} ${event.name} commence dans 3 jours ! Fais ton stock rapidement !`;
            } else if (threshold === 1) {
              message = `${event.iconEmoji || '📅'} ${event.name} commence demain ! Dernière chance pour te préparer !`;
            }

            await db.insert(eventAlerts).values({
              eventId: event.id,
              merchantId: merchant.id,
              message,
              daysBeforeEvent: threshold,
              isRead: false,
              createdAt: new Date(),
            });

            alertsCreated++;
          }
        } catch (error) {
          console.error(`    ❌ Erreur pour marchand ${merchant.id}:`, error.message);
        }
      }

      console.log(`    ✅ Alertes ${threshold}j créées`);
    }
  }
}

console.log(`\n✅ Génération terminée : ${alertsCreated} alertes créées\n`);

await connection.end();
process.exit(0);
