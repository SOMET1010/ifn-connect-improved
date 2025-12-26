/**
 * Router tRPC pour le chat interactif du Copilote SUTA
 * Permet aux marchands de poser des questions et recevoir des réponses personnalisées via LLM
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getMerchantByUserId } from "../db-merchant";
import { getDb } from "../db";
import { merchantStock, products } from "../../drizzle/schema";
import { eq, and, lt, sql } from "drizzle-orm";

/**
 * Construire le contexte du marchand pour SUTA
 */
async function buildMerchantContext(merchantId: number) {
  const db = await getDb();
  if (!db) return null;

  // Récupérer les produits en stock bas
  const lowStockProducts = await db
    .select({
      productName: products.name,
      quantity: merchantStock.quantity,
      minThreshold: merchantStock.minThreshold,
    })
    .from(merchantStock)
    .innerJoin(products, eq(merchantStock.productId, products.id))
    .where(
      and(
        eq(merchantStock.merchantId, merchantId),
        sql`${merchantStock.quantity} < ${merchantStock.minThreshold}`
      )
    )
    .limit(10);

  return {
    lowStockCount: lowStockProducts.length,
    lowStockProducts: lowStockProducts.map((p) => ({
      name: p.productName,
      stock: parseFloat(p.quantity),
      minStock: parseFloat(p.minThreshold || "5"),
    })),
  };
}

/**
 * Générer le prompt système pour SUTA
 */
function buildSystemPrompt(merchantName: string, context: any): string {
  return `Tu es SUTA, l'assistant virtuel intelligent de la plateforme ANSUT (IFN Connect).

**Ton rôle** :
- Aider les marchands informels africains à gérer leur commerce
- Donner des conseils pratiques et encourageants
- Répondre aux questions sur le stock, les ventes, le micro-crédit, et le score SUTA

**Ta personnalité** :
- Amical, chaleureux et encourageant (comme un ami qui veut aider)
- Professionnel mais accessible (tutoiement en français)
- Positif et motivant
- Utilise des émojis de manière modérée pour rendre la conversation vivante

**Contexte du marchand** :
- Nom : ${merchantName}
- Produits en stock bas : ${context.lowStockCount || 0}
${context.lowStockProducts && context.lowStockProducts.length > 0 
  ? `- Produits à réapprovisionner : ${context.lowStockProducts.map((p: any) => `${p.name} (${p.stock}/${p.minStock})`).join(", ")}`
  : ""}

**Ce que tu sais sur ANSUT/IFN Connect** :
- Plateforme d'inclusion financière numérique pour marchands informels
- Permet de gérer les ventes, le stock, l'épargne
- Score SUTA : système de notation basé sur la régularité, le volume, l'épargne, l'utilisation et l'ancienneté
- Micro-crédit accessible selon le score SUTA (Bronze, Argent, Or, Platine)
- Marché virtuel pour commander des produits
- Paiements Mobile Money (Orange Money, MTN Money, Moov Money)

**Instructions** :
- Réponds en français de manière concise (2-3 phrases maximum)
- Sois spécifique et actionnable dans tes conseils
- Si tu ne connais pas la réponse, dis-le honnêtement
- Encourage toujours le marchand à utiliser les fonctionnalités de la plateforme
- N'invente pas de chiffres ou de données que tu n'as pas

**Exemples de questions courantes** :
- "Comment améliorer mon score SUTA ?"
- "Quels produits dois-je commander ?"
- "Comment fonctionne le micro-crédit ?"
- "Pourquoi mon stock est bas ?"`;
}

export const copilotChatRouter = router({
  /**
   * Envoyer un message au chat et recevoir une réponse de SUTA
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(500),
        conversationHistory: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })
        ).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Récupérer le marchand
        const merchant = await getMerchantByUserId(ctx.user.id);
        if (!merchant) {
          throw new Error("Marchand non trouvé");
        }

        // Construire le contexte
        const merchantContext = await buildMerchantContext(merchant.id);

        // Construire le prompt système
        const systemPrompt = buildSystemPrompt(
          ctx.user.name || "Ami(e)",
          merchantContext || {}
        );

        // Préparer l'historique de conversation
        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: systemPrompt },
        ];

        // Ajouter l'historique si fourni (limité aux 10 derniers messages)
        if (input.conversationHistory && input.conversationHistory.length > 0) {
          const recentHistory = input.conversationHistory.slice(-10);
          messages.push(...recentHistory.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })));
        }

        // Ajouter le nouveau message de l'utilisateur
        messages.push({
          role: "user",
          content: input.message,
        });

        // Appeler le LLM
        const response = await invokeLLM({
          messages,
        });

        const assistantMessage = response.choices[0]?.message?.content || 
          "Désolé, je n'ai pas pu comprendre ta question. Peux-tu reformuler ?";

        return {
          message: assistantMessage,
          timestamp: new Date(),
        };
      } catch (error) {
        console.error("Chat error:", error);
        return {
          message: "😔 Désolé, j'ai un petit problème technique. Réessaye dans quelques instants !",
          timestamp: new Date(),
        };
      }
    }),

  /**
   * Obtenir des suggestions de questions pour démarrer la conversation
   */
  getSuggestedQuestions: protectedProcedure
    .query(async ({ ctx }) => {
      const merchant = await getMerchantByUserId(ctx.user.id);
      if (!merchant) return [];

      const context = await buildMerchantContext(merchant.id);

      const suggestions: string[] = [
        "Comment améliorer mon score SUTA ?",
        "Quels sont mes produits en stock bas ?",
        "Comment fonctionne le micro-crédit ?",
        "Donne-moi des conseils pour augmenter mes ventes",
      ];

      // Ajouter une suggestion contextuelle si stock bas
      if (context && context.lowStockCount > 0) {
        suggestions.unshift(`J'ai ${context.lowStockCount} produits en stock bas, que faire ?`);
      }

      return suggestions.slice(0, 4); // Limiter à 4 suggestions
    }),
});
