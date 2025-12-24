import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { merchants, sales, merchantBadges } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { generateCertificate } from "../certificates";

export const certificatesRouter = router({
  /**
   * Génère un certificat professionnel PDF pour un marchand
   */
  generate: publicProcedure
    .input(z.object({ merchantId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Récupérer le marchand
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.id, input.merchantId))
        .limit(1);

      if (!merchant) {
        throw new Error("Merchant not found");
      }

      // Calculer le niveau basé sur les ventes
      const [totalSalesResult] = await db
        .select({ total: sql<number>`COALESCE(SUM(totalAmount), 0)` })
        .from(sales)
        .where(eq(sales.merchantId, input.merchantId));

      const totalSales = totalSalesResult?.total || 0;

      let level = 'Débutant';
      let levelColor = '#95A5A6';

      if (totalSales >= 5000000) {
        level = 'Maître';
        levelColor = '#9B59B6';
      } else if (totalSales >= 2000000) {
        level = 'Expert';
        levelColor = '#3498DB';
      } else if (totalSales >= 500000) {
        level = 'Confirmé';
        levelColor = '#2ECC71';
      } else if (totalSales >= 100000) {
        level = 'Intermédiaire';
        levelColor = '#F39C12';
      }

      // Compter les badges débloqués
      const [badgesCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(merchantBadges)
        .where(eq(merchantBadges.merchantId, input.merchantId));

      const badgesCount = badgesCountResult?.count || 0;

      // Générer le PDF
      const pdfBuffer = await generateCertificate({
        merchant,
        level,
        levelColor,
        badgesCount,
        totalSales,
        enrollmentDate: merchant.enrolledAt || merchant.createdAt,
      });

      // Retourner le PDF en base64
      return {
        success: true,
        pdf: pdfBuffer.toString('base64'),
        filename: `certificat-${merchant.merchantNumber}.pdf`,
      };
    }),
});
