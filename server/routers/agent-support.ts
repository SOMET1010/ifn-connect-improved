import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import {
  agents,
  faqArticles,
  supportConversations,
  supportTickets,
} from '../../drizzle/schema';
import { eq, and, sql, desc, like, or } from 'drizzle-orm';
import { invokeLLM } from '../_core/llm';

/**
 * Middleware pour vérifier que l'utilisateur est un agent
 */
const agentProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== 'agent') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Accès réservé aux agents',
    });
  }

  const db = await getDb();
  if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

  // Récupérer l'agent
  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.userId, ctx.user.id))
    .limit(1);

  if (!agent) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent introuvable' });
  }

  return next({ ctx: { ...ctx, agent } });
});

export const agentSupportRouter = router({
  /**
   * Récupérer toutes les catégories FAQ avec compteurs
   */
  getFaqCategories: agentProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const categories = await db
      .select({
        category: faqArticles.category,
        count: sql<number>`COUNT(*)`,
        totalViews: sql<number>`SUM(${faqArticles.views})`,
      })
      .from(faqArticles)
      .where(eq(faqArticles.isPublished, true))
      .groupBy(faqArticles.category);

    return categories;
  }),

  /**
   * Rechercher dans la FAQ
   */
  searchFaq: agentProcedure
    .input(
      z.object({
        query: z.string().optional(),
        category: z.enum(['enrollment', 'payments', 'technical', 'cnps_cmu', 'cooperatives', 'general']).optional(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      let query = db
        .select()
        .from(faqArticles)
        .where(eq(faqArticles.isPublished, true))
        .$dynamic();

      // Filtrer par catégorie
      if (input.category) {
        query = query.where(eq(faqArticles.category, input.category));
      }

      // Recherche textuelle
      if (input.query && input.query.trim()) {
        const searchTerm = `%${input.query.trim()}%`;
        query = query.where(
          or(
            like(faqArticles.question, searchTerm),
            like(faqArticles.answer, searchTerm)
          )
        );
      }

      const results = await query
        .orderBy(desc(faqArticles.views))
        .limit(input.limit);

      return results;
    }),

  /**
   * Récupérer un article FAQ par ID et incrémenter les vues
   */
  getFaqArticle: agentProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const [article] = await db
        .select()
        .from(faqArticles)
        .where(and(eq(faqArticles.id, input.id), eq(faqArticles.isPublished, true)))
        .limit(1);

      if (!article) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Article introuvable' });
      }

      // Incrémenter les vues
      await db
        .update(faqArticles)
        .set({ views: article.views + 1 })
        .where(eq(faqArticles.id, input.id));

      return { ...article, views: article.views + 1 };
    }),

  /**
   * Voter pour un article FAQ
   */
  voteFaqArticle: agentProcedure
    .input(z.object({ id: z.number(), vote: z.enum(['up', 'down']) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const [article] = await db
        .select()
        .from(faqArticles)
        .where(eq(faqArticles.id, input.id))
        .limit(1);

      if (!article) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Article introuvable' });
      }

      if (input.vote === 'up') {
        await db
          .update(faqArticles)
          .set({ upvotes: article.upvotes + 1 })
          .where(eq(faqArticles.id, input.id));
      } else {
        await db
          .update(faqArticles)
          .set({ downvotes: article.downvotes + 1 })
          .where(eq(faqArticles.id, input.id));
      }

      return { success: true };
    }),

  /**
   * Créer une nouvelle conversation avec le chatbot
   */
  createConversation: agentProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const [conversation] = await db
      .insert(supportConversations)
      .values({
        agentId: ctx.agent.id,
        messages: JSON.stringify([]),
        status: 'active',
      })
      .$returningId();

    return { conversationId: conversation.id };
  }),

  /**
   * Envoyer un message au chatbot et recevoir une réponse
   */
  sendMessage: agentProcedure
    .input(
      z.object({
        conversationId: z.number(),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Récupérer la conversation
      const [conversation] = await db
        .select()
        .from(supportConversations)
        .where(
          and(
            eq(supportConversations.id, input.conversationId),
            eq(supportConversations.agentId, ctx.agent.id)
          )
        )
        .limit(1);

      if (!conversation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation introuvable' });
      }

      // Parser les messages existants
      const messages = JSON.parse(conversation.messages) as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;

      // Ajouter le message de l'utilisateur
      messages.push({ role: 'user', content: input.message });

      // Rechercher dans la FAQ pour fournir du contexte
      const searchTerm = `%${input.message.toLowerCase()}%`;
      const relevantFaq = await db
        .select()
        .from(faqArticles)
        .where(
          and(
            eq(faqArticles.isPublished, true),
            or(
              like(sql`LOWER(${faqArticles.question})`, searchTerm),
              like(sql`LOWER(${faqArticles.answer})`, searchTerm)
            )
          )
        )
        .limit(3);

      // Construire le contexte pour le LLM
      let context = `Tu es un assistant virtuel pour les agents terrain d'IFN Connect en Côte d'Ivoire. 
Tu aides les agents avec leurs questions sur l'enrôlement des marchands, les paiements, la protection sociale (CNPS/CMU), les coopératives, et les aspects techniques de la plateforme.

Réponds en français de manière claire, concise et professionnelle.`;

      if (relevantFaq.length > 0) {
        context += `\n\nVoici des articles FAQ pertinents :\n`;
        relevantFaq.forEach((faq, index) => {
          context += `\n${index + 1}. Q: ${faq.question}\n   R: ${faq.answer}\n`;
        });
      }

      // Appeler le LLM
      const response = await invokeLLM({
        messages: [
          { role: 'system', content: context },
          ...messages,
        ],
      });

      const assistantMessage = typeof response.choices[0].message.content === 'string' 
        ? response.choices[0].message.content 
        : 'Désolé, je n\'ai pas pu générer de réponse.';

      // Ajouter la réponse de l'assistant
      messages.push({ role: 'assistant', content: assistantMessage });

      // Mettre à jour la conversation
      await db
        .update(supportConversations)
        .set({
          messages: JSON.stringify(messages),
          updatedAt: new Date(),
        })
        .where(eq(supportConversations.id, input.conversationId));

      return {
        message: assistantMessage,
        suggestedFaq: relevantFaq.map(faq => ({
          id: faq.id,
          question: faq.question,
          category: faq.category,
        })),
      };
    }),

  /**
   * Récupérer l'historique d'une conversation
   */
  getConversation: agentProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const [conversation] = await db
        .select()
        .from(supportConversations)
        .where(
          and(
            eq(supportConversations.id, input.conversationId),
            eq(supportConversations.agentId, ctx.agent.id)
          )
        )
        .limit(1);

      if (!conversation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation introuvable' });
      }

      return {
        ...conversation,
        messages: JSON.parse(conversation.messages),
      };
    }),

  /**
   * Récupérer les conversations récentes de l'agent
   */
  getMyConversations: agentProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const conversations = await db
        .select()
        .from(supportConversations)
        .where(eq(supportConversations.agentId, ctx.agent.id))
        .orderBy(desc(supportConversations.updatedAt))
        .limit(input.limit);

      return conversations.map(conv => ({
        ...conv,
        messageCount: JSON.parse(conv.messages).length,
      }));
    }),

  /**
   * Escalader une conversation vers un ticket support
   */
  escalateToTicket: agentProcedure
    .input(
      z.object({
        conversationId: z.number(),
        subject: z.string(),
        description: z.string(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Créer le ticket
      const [ticket] = await db
        .insert(supportTickets)
        .values({
          agentId: ctx.agent.id,
          conversationId: input.conversationId,
          subject: input.subject,
          description: input.description,
          priority: input.priority,
          status: 'open',
        })
        .$returningId();

      // Mettre à jour le statut de la conversation
      await db
        .update(supportConversations)
        .set({ status: 'escalated' })
        .where(eq(supportConversations.id, input.conversationId));

      return { ticketId: ticket.id };
    }),
});
