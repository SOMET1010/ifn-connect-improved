import { getDb } from "../db";
import { merchants } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

async function addExpiryDates() {
  const db = await getDb();
  if (!db) {
    console.error("❌ Impossible de se connecter à la base de données");
    process.exit(1);
  }

  console.log("🔄 Ajout des dates d'expiration CNPS/CMU...");

  // Récupérer les 50 premiers marchands
  const allMerchants = await db
    .select()
    .from(merchants)
    .limit(50);

  console.log(`📊 ${allMerchants.length} marchands trouvés`);

  let updated = 0;

  for (const merchant of allMerchants) {
    const randomDays = Math.floor(Math.random() * 90) + 1;
    const cnpsExpiry = new Date(Date.now() + randomDays * 24 * 60 * 60 * 1000);
    
    const randomDaysCmu = Math.floor(Math.random() * 90) + 1;
    const cmuExpiry = new Date(Date.now() + randomDaysCmu * 24 * 60 * 60 * 1000);

    // Mettre à jour le statut et les dates
    await db
      .update(merchants)
      .set({
        cnpsStatus: "active",
        cmuStatus: "active",
        cnpsExpiryDate: cnpsExpiry,
        cmuExpiryDate: cmuExpiry,
      })
      .where(eq(merchants.id, merchant.id));

    updated++;
  }

  console.log(`\n✅ ${updated} marchands mis à jour avec succès !`);
  console.log(`📅 Statuts CNPS/CMU activés avec dates d'expiration (entre 1 et 90 jours)`);
  process.exit(0);
}

addExpiryDates().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exit(1);
});
