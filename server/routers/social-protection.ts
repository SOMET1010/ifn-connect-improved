import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { 
  socialProtectionRenewals, 
  merchants, 
  merchantSocialProtection,
  users 
} from "../../drizzle/schema";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { storagePut } from "../storage";

/**
 * Router tRPC pour la gestion des renouvellements de couverture sociale (CNPS/CMU/RSTI)
 */

export const socialProtectionRouter = router({
  /**
   * Créer une demande de renouvellement
   */
  createRenewal: protectedProcedure
    .input(
      z.object({
        type: z.enum(["cnps", "cmu", "rsti"]),
        requestedExpiryDate: z.string(), // ISO date string
        proofDocument: z.string().optional(), // Base64 encoded image
        merchantNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Récupérer le marchand associé à l'utilisateur
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.userId, ctx.user.id))
        .limit(1);

      if (!merchant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Marchand non trouvé",
        });
      }

      // Récupérer les informations de couverture sociale actuelles
      const [socialProtection] = await db
        .select()
        .from(merchantSocialProtection)
        .where(eq(merchantSocialProtection.merchantId, merchant.id))
        .limit(1);

      let currentExpiryDate: Date | null = null;

      if (socialProtection) {
        if (input.type === "cnps") {
          currentExpiryDate = socialProtection.cnpsExpiryDate;
        } else if (input.type === "cmu") {
          currentExpiryDate = socialProtection.cmuExpiryDate;
        } else if (input.type === "rsti") {
          currentExpiryDate = socialProtection.rstiExpiryDate;
        }
      }

      // Upload du justificatif vers S3 si fourni
      let proofDocumentUrl: string | null = null;
      let proofDocumentKey: string | null = null;

      if (input.proofDocument) {
        // Décoder le base64
        const base64Data = input.proofDocument.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // Générer une clé unique
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `renewals/${merchant.id}/${input.type}-${timestamp}-${randomSuffix}.jpg`;

        // Upload vers S3
        const { url } = await storagePut(fileKey, buffer, "image/jpeg");

        proofDocumentUrl = url;
        proofDocumentKey = fileKey;
      }

      // Créer la demande de renouvellement
      const [renewal] = await db
        .insert(socialProtectionRenewals)
        .values({
          merchantId: merchant.id,
          type: input.type,
          currentExpiryDate: currentExpiryDate,
          requestedExpiryDate: new Date(input.requestedExpiryDate),
          status: "pending",
          proofDocumentUrl,
          proofDocumentKey,
          merchantNotes: input.merchantNotes,
        })
        .$returningId();

      return {
        success: true,
        renewalId: renewal.id,
        message: `Demande de renouvellement ${input.type.toUpperCase()} créée avec succès`,
      };
    }),

  /**
   * Liste des demandes de renouvellement d'un marchand
   */
  listByMerchant: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Récupérer le marchand associé à l'utilisateur
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.userId, ctx.user.id))
        .limit(1);

      if (!merchant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Marchand non trouvé",
        });
      }

      // Récupérer les demandes de renouvellement
      const renewals = await db
        .select({
          id: socialProtectionRenewals.id,
          type: socialProtectionRenewals.type,
          currentExpiryDate: socialProtectionRenewals.currentExpiryDate,
          requestedExpiryDate: socialProtectionRenewals.requestedExpiryDate,
          status: socialProtectionRenewals.status,
          proofDocumentUrl: socialProtectionRenewals.proofDocumentUrl,
          merchantNotes: socialProtectionRenewals.merchantNotes,
          adminNotes: socialProtectionRenewals.adminNotes,
          requestedAt: socialProtectionRenewals.requestedAt,
          reviewedAt: socialProtectionRenewals.reviewedAt,
          reviewedByName: users.name,
        })
        .from(socialProtectionRenewals)
        .leftJoin(users, eq(socialProtectionRenewals.reviewedBy, users.id))
        .where(eq(socialProtectionRenewals.merchantId, merchant.id))
        .orderBy(desc(socialProtectionRenewals.requestedAt))
        .limit(input.limit)
        .offset(input.offset);

      return renewals;
    }),

  /**
   * Liste des demandes en attente (admin uniquement)
   */
  listPending: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        type: z.enum(["cnps", "cmu", "rsti", "all"]).default("all"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Vérifier que l'utilisateur est admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Accès réservé aux administrateurs",
        });
      }

      // Construire la condition de filtrage
      const conditions = [eq(socialProtectionRenewals.status, "pending")];
      if (input.type !== "all") {
        conditions.push(eq(socialProtectionRenewals.type, input.type));
      }

      // Récupérer les demandes en attente
      const renewals = await db
        .select({
          id: socialProtectionRenewals.id,
          merchantId: socialProtectionRenewals.merchantId,
          merchantName: users.name,
          merchantNumber: merchants.merchantNumber,
          businessName: merchants.businessName,
          type: socialProtectionRenewals.type,
          currentExpiryDate: socialProtectionRenewals.currentExpiryDate,
          requestedExpiryDate: socialProtectionRenewals.requestedExpiryDate,
          status: socialProtectionRenewals.status,
          proofDocumentUrl: socialProtectionRenewals.proofDocumentUrl,
          merchantNotes: socialProtectionRenewals.merchantNotes,
          requestedAt: socialProtectionRenewals.requestedAt,
        })
        .from(socialProtectionRenewals)
        .innerJoin(merchants, eq(socialProtectionRenewals.merchantId, merchants.id))
        .innerJoin(users, eq(merchants.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(socialProtectionRenewals.requestedAt))
        .limit(input.limit)
        .offset(input.offset);

      return renewals;
    }),

  /**
   * Approuver une demande de renouvellement (admin uniquement)
   */
  approve: protectedProcedure
    .input(
      z.object({
        renewalId: z.number(),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Vérifier que l'utilisateur est admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Accès réservé aux administrateurs",
        });
      }

      // Récupérer la demande de renouvellement
      const [renewal] = await db
        .select()
        .from(socialProtectionRenewals)
        .where(eq(socialProtectionRenewals.id, input.renewalId))
        .limit(1);

      if (!renewal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Demande de renouvellement non trouvée",
        });
      }

      if (renewal.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cette demande a déjà été traitée",
        });
      }

      const now = new Date();

      // Mettre à jour le statut de la demande
      await db
        .update(socialProtectionRenewals)
        .set({
          status: "approved",
          adminNotes: input.adminNotes,
          reviewedAt: now,
          reviewedBy: ctx.user.id,
          approvedAt: now,
        })
        .where(eq(socialProtectionRenewals.id, input.renewalId));

      // Mettre à jour la date d'expiration dans merchant_social_protection
      const [socialProtection] = await db
        .select()
        .from(merchantSocialProtection)
        .where(eq(merchantSocialProtection.merchantId, renewal.merchantId))
        .limit(1);

      if (socialProtection) {
        // Mettre à jour la date d'expiration correspondante
        const updateData: any = {};
        if (renewal.type === "cnps") {
          updateData.cnpsExpiryDate = renewal.requestedExpiryDate;
          updateData.cnpsStatus = "active";
        } else if (renewal.type === "cmu") {
          updateData.cmuExpiryDate = renewal.requestedExpiryDate;
          updateData.cmuStatus = "active";
        } else if (renewal.type === "rsti") {
          updateData.rstiExpiryDate = renewal.requestedExpiryDate;
          updateData.rstiStatus = "active";
        }

        await db
          .update(merchantSocialProtection)
          .set(updateData)
          .where(eq(merchantSocialProtection.merchantId, renewal.merchantId));
      }

      return {
        success: true,
        message: `Demande de renouvellement ${renewal.type.toUpperCase()} approuvée`,
      };
    }),

  /**
   * Rejeter une demande de renouvellement (admin uniquement)
   */
  reject: protectedProcedure
    .input(
      z.object({
        renewalId: z.number(),
        adminNotes: z.string().min(1, "Veuillez indiquer la raison du rejet"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Vérifier que l'utilisateur est admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Accès réservé aux administrateurs",
        });
      }

      // Récupérer la demande de renouvellement
      const [renewal] = await db
        .select()
        .from(socialProtectionRenewals)
        .where(eq(socialProtectionRenewals.id, input.renewalId))
        .limit(1);

      if (!renewal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Demande de renouvellement non trouvée",
        });
      }

      if (renewal.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cette demande a déjà été traitée",
        });
      }

      const now = new Date();

      // Mettre à jour le statut de la demande
      await db
        .update(socialProtectionRenewals)
        .set({
          status: "rejected",
          adminNotes: input.adminNotes,
          reviewedAt: now,
          reviewedBy: ctx.user.id,
          rejectedAt: now,
        })
        .where(eq(socialProtectionRenewals.id, input.renewalId));

      return {
        success: true,
        message: `Demande de renouvellement ${renewal.type.toUpperCase()} rejetée`,
      };
    }),

  /**
   * Statistiques des renouvellements (admin uniquement)
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Vérifier que l'utilisateur est admin
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Accès réservé aux administrateurs",
      });
    }

    // Compter les demandes par statut
    const [stats] = await db
      .select({
        totalPending: sql<number>`COUNT(CASE WHEN ${socialProtectionRenewals.status} = 'pending' THEN 1 END)`,
        totalApproved: sql<number>`COUNT(CASE WHEN ${socialProtectionRenewals.status} = 'approved' THEN 1 END)`,
        totalRejected: sql<number>`COUNT(CASE WHEN ${socialProtectionRenewals.status} = 'rejected' THEN 1 END)`,
        totalCnps: sql<number>`COUNT(CASE WHEN ${socialProtectionRenewals.type} = 'cnps' THEN 1 END)`,
        totalCmu: sql<number>`COUNT(CASE WHEN ${socialProtectionRenewals.type} = 'cmu' THEN 1 END)`,
        totalRsti: sql<number>`COUNT(CASE WHEN ${socialProtectionRenewals.type} = 'rsti' THEN 1 END)`,
      })
      .from(socialProtectionRenewals);

    return {
      totalPending: Number(stats?.totalPending || 0),
      totalApproved: Number(stats?.totalApproved || 0),
      totalRejected: Number(stats?.totalRejected || 0),
      totalCnps: Number(stats?.totalCnps || 0),
      totalCmu: Number(stats?.totalCmu || 0),
      totalRsti: Number(stats?.totalRsti || 0),
    };
  }),

  /**
   * Détecter les couvertures sociales expirant bientôt
   */
  getExpiringProtections: protectedProcedure
    .input(
      z.object({
        daysThreshold: z.number().min(1).max(90).default(30), // Nombre de jours avant expiration
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Vérifier que l'utilisateur est admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Accès réservé aux administrateurs",
        });
      }

      const now = new Date();
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + input.daysThreshold);

      // Récupérer les marchands avec couverture expirant bientôt
      const expiringProtections = await db
        .select({
          merchantId: merchants.id,
          merchantName: users.name,
          merchantNumber: merchants.merchantNumber,
          businessName: merchants.businessName,
          phone: users.phone,
          cnpsExpiryDate: merchantSocialProtection.cnpsExpiryDate,
          cmuExpiryDate: merchantSocialProtection.cmuExpiryDate,
          rstiExpiryDate: merchantSocialProtection.rstiExpiryDate,
        })
        .from(merchantSocialProtection)
        .innerJoin(merchants, eq(merchantSocialProtection.merchantId, merchants.id))
        .innerJoin(users, eq(merchants.userId, users.id))
        .where(
          sql`(
            (${merchantSocialProtection.cnpsExpiryDate} IS NOT NULL AND ${merchantSocialProtection.cnpsExpiryDate} BETWEEN ${now} AND ${thresholdDate})
            OR (${merchantSocialProtection.cmuExpiryDate} IS NOT NULL AND ${merchantSocialProtection.cmuExpiryDate} BETWEEN ${now} AND ${thresholdDate})
            OR (${merchantSocialProtection.rstiExpiryDate} IS NOT NULL AND ${merchantSocialProtection.rstiExpiryDate} BETWEEN ${now} AND ${thresholdDate})
          )`
        )
        .orderBy(merchantSocialProtection.cnpsExpiryDate);

      return expiringProtections;
    }),
});
