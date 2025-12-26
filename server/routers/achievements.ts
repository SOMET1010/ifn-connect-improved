import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { userAchievements, courses } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

export const achievementsRouter = router({
  /**
   * Récupérer tous les badges de l'utilisateur connecté
   */
  getMyBadges: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const badges = await db
      .select({
        id: userAchievements.id,
        badgeName: userAchievements.badgeName,
        badgeIcon: userAchievements.badgeIcon,
        courseId: userAchievements.courseId,
        scoreObtained: userAchievements.scoreObtained,
        earnedAt: userAchievements.earnedAt,
        courseTitle: courses.title,
      })
      .from(userAchievements)
      .leftJoin(courses, eq(userAchievements.courseId, courses.id))
      .where(eq(userAchievements.userId, ctx.user.id))
      .orderBy(desc(userAchievements.earnedAt));

    return badges;
  }),

  /**
   * Récupérer les badges d'un utilisateur spécifique (pour affichage public)
   */
  getUserBadges: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const badges = await db
        .select({
          id: userAchievements.id,
          badgeName: userAchievements.badgeName,
          badgeIcon: userAchievements.badgeIcon,
          courseId: userAchievements.courseId,
          scoreObtained: userAchievements.scoreObtained,
          earnedAt: userAchievements.earnedAt,
          courseTitle: courses.title,
        })
        .from(userAchievements)
        .leftJoin(courses, eq(userAchievements.courseId, courses.id))
        .where(eq(userAchievements.userId, input.userId))
        .orderBy(desc(userAchievements.earnedAt));

      return badges;
    }),

  /**
   * Compter le nombre total de badges de l'utilisateur
   */
  getBadgeCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const badges = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, ctx.user.id));

    return { count: badges.length };
  }),

  /**
   * Générer une image de badge partageable (base64)
   */
  generateBadgeImage: protectedProcedure
    .input(z.object({ badgeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Récupérer le badge
      const [badge] = await db
        .select({
          badgeName: userAchievements.badgeName,
          badgeIcon: userAchievements.badgeIcon,
          scoreObtained: userAchievements.scoreObtained,
          earnedAt: userAchievements.earnedAt,
          courseTitle: courses.title,
        })
        .from(userAchievements)
        .leftJoin(courses, eq(userAchievements.courseId, courses.id))
        .where(eq(userAchievements.id, input.badgeId))
        .limit(1);

      if (!badge) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Badge not found' });
      }

      // Générer une image PNG avec Canvas (via node-canvas)
      const { createCanvas } = require('canvas');
      const canvas = createCanvas(800, 600);
      const canvasCtx = canvas.getContext('2d');

      // Fond dégradé orange-terracotta
      const gradient = canvasCtx.createLinearGradient(0, 0, 800, 600);
      gradient.addColorStop(0, '#FF6B35'); // Orange vif
      gradient.addColorStop(1, '#D84315'); // Terracotta foncé
      canvasCtx.fillStyle = gradient;
      canvasCtx.fillRect(0, 0, 800, 600);

      // Bordure blanche
      canvasCtx.strokeStyle = '#FFFFFF';
      canvasCtx.lineWidth = 10;
      canvasCtx.strokeRect(20, 20, 760, 560);

      // Emoji du badge (très grand)
      canvasCtx.font = 'bold 120px Arial';
      canvasCtx.textAlign = 'center';
      canvasCtx.fillStyle = '#FFFFFF';
      canvasCtx.fillText(badge.badgeIcon || '🏆', 400, 180);

      // Nom du badge
      canvasCtx.font = 'bold 48px Arial';
      canvasCtx.fillStyle = '#FFFFFF';
      canvasCtx.fillText(badge.badgeName, 400, 280);

      // Nom de l'utilisateur
      canvasCtx.font = '36px Arial';
      canvasCtx.fillStyle = '#FFF9C4'; // Jaune pâle
      canvasCtx.fillText(ctx.user.name || 'Marchand', 400, 340);

      // Score
      canvasCtx.font = 'bold 32px Arial';
      canvasCtx.fillStyle = '#FFFFFF';
      canvasCtx.fillText(`Score : ${badge.scoreObtained}%`, 400, 400);

      // Cours (si applicable)
      if (badge.courseTitle) {
        canvasCtx.font = '24px Arial';
        canvasCtx.fillStyle = '#FFE0B2'; // Orange très pâle
        canvasCtx.fillText(badge.courseTitle, 400, 440);
      }

      // Date
      const dateStr = new Date(badge.earnedAt).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      canvasCtx.font = '20px Arial';
      canvasCtx.fillStyle = '#FFE0B2';
      canvasCtx.fillText(`Obtenu le ${dateStr}`, 400, 480);

      // Logo/Signature
      canvasCtx.font = 'bold 18px Arial';
      canvasCtx.fillStyle = '#FFFFFF';
      canvasCtx.fillText('IFN Connect - Plateforme d\'Inclusion Numérique', 400, 540);

      // Convertir en base64
      const buffer = canvas.toBuffer('image/png');
      const base64 = buffer.toString('base64');

      return {
        image: `data:image/png;base64,${base64}`,
        filename: `badge-${badge.badgeName.replace(/\s+/g, '-').toLowerCase()}.png`,
      };
    }),
});
