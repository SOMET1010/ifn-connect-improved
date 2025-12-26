import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { courses, courseProgress, quizzes, quizAttempts, userAchievements } from '../../drizzle/schema';
import { getBadgeForCourse, checkPerfectionistBadge, checkAssiduousBadge } from '../../shared/badges';
import { eq, and, desc } from 'drizzle-orm';

export const coursesRouter = router({
  /**
   * Récupérer tous les cours publiés
   */
  getAll: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        level: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Construire les conditions de filtrage
      const conditions = [eq(courses.isPublished, true)];

      if (input?.category) {
        conditions.push(eq(courses.category, input.category));
      }

      if (input?.level) {
        conditions.push(eq(courses.level, input.level));
      }

      return await db
        .select()
        .from(courses)
        .where(and(...conditions))
        .orderBy(desc(courses.createdAt));
    }),

  /**
   * Récupérer un cours par ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, input.id))
        .limit(1);

      if (!course) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Course not found' });
      }

      return course;
    }),

  /**
   * Récupérer la progression de l'utilisateur pour un cours
   */
  getProgress: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const [progress] = await db
        .select()
        .from(courseProgress)
        .where(
          and(
            eq(courseProgress.userId, ctx.user.id),
            eq(courseProgress.courseId, input.courseId)
          )
        )
        .limit(1);

      return progress || null;
    }),

  /**
   * Récupérer toutes les progressions de l'utilisateur
   */
  getMyProgress: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

    const progressList = await db
      .select({
        id: courseProgress.id,
        courseId: courseProgress.courseId,
        progress: courseProgress.progress,
        completed: courseProgress.completed,
        completedAt: courseProgress.completedAt,
        courseTitle: courses.title,
        courseCategory: courses.category,
        courseDuration: courses.duration,
        courseThumbnail: courses.thumbnailUrl,
      })
      .from(courseProgress)
      .leftJoin(courses, eq(courseProgress.courseId, courses.id))
      .where(eq(courseProgress.userId, ctx.user.id))
      .orderBy(desc(courseProgress.updatedAt));

    return progressList;
  }),

  /**
   * Mettre à jour la progression d'un cours
   */
  updateProgress: protectedProcedure
    .input(
      z.object({
        courseId: z.number(),
        progress: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Vérifier si une progression existe déjà
      const [existing] = await db
        .select()
        .from(courseProgress)
        .where(
          and(
            eq(courseProgress.userId, ctx.user.id),
            eq(courseProgress.courseId, input.courseId)
          )
        )
        .limit(1);

      const completed = input.progress >= 100;
      const completedAt = completed ? new Date() : null;

      if (existing) {
        // Mettre à jour
        await db
          .update(courseProgress)
          .set({
            progress: input.progress,
            completed,
            completedAt: completedAt || existing.completedAt,
          })
          .where(eq(courseProgress.id, existing.id));
      } else {
        // Créer
        await db.insert(courseProgress).values({
          userId: ctx.user.id,
          courseId: input.courseId,
          progress: input.progress,
          completed,
          completedAt,
        });
      }

      return { success: true, completed };
    }),

  /**
   * Générer un certificat PDF
   */
  generateCertificate: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Vérifier que le cours est terminé
      const [progress] = await db
        .select()
        .from(courseProgress)
        .where(
          and(
            eq(courseProgress.userId, ctx.user.id),
            eq(courseProgress.courseId, input.courseId)
          )
        )
        .limit(1);

      if (!progress || !progress.completed) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Course not completed' });
      }

      // Récupérer les infos du cours
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, input.courseId))
        .limit(1);

      if (!course) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Course not found' });
      }

      // Générer le PDF
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));

      return new Promise<{ pdf: string; filename: string }>((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          const base64 = pdfBuffer.toString('base64');
          resolve({
            pdf: base64,
            filename: `certificat-${course.title.replace(/\s+/g, '-').toLowerCase()}.pdf`,
          });
        });

        doc.on('error', reject);

        // Design du certificat
        const centerX = doc.page.width / 2;
        const centerY = doc.page.height / 2;

        // Bordure décorative
        doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80)
          .lineWidth(3)
          .stroke('#4F46E5');

        doc.rect(50, 50, doc.page.width - 100, doc.page.height - 100)
          .lineWidth(1)
          .stroke('#9333EA');

        // Titre
        doc.fontSize(48)
          .font('Helvetica-Bold')
          .fillColor('#4F46E5')
          .text('CERTIFICAT', 0, 100, { align: 'center' });

        doc.fontSize(24)
          .font('Helvetica')
          .fillColor('#6B7280')
          .text('de Complétion', 0, 160, { align: 'center' });

        // Texte principal
        doc.fontSize(16)
          .font('Helvetica')
          .fillColor('#374151')
          .text('Ce certificat atteste que', 0, centerY - 80, { align: 'center' });

        doc.fontSize(32)
          .font('Helvetica-Bold')
          .fillColor('#1F2937')
          .text(ctx.user.name || 'Utilisateur', 0, centerY - 40, { align: 'center' });

        doc.fontSize(16)
          .font('Helvetica')
          .fillColor('#374151')
          .text('a suivi et terminé avec succès le cours', 0, centerY + 10, { align: 'center' });

        doc.fontSize(24)
          .font('Helvetica-Bold')
          .fillColor('#4F46E5')
          .text(course.title, 0, centerY + 50, { align: 'center' });

        // Date
        const completionDate = progress.completedAt ? new Date(progress.completedAt).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }) : new Date().toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        doc.fontSize(14)
          .font('Helvetica')
          .fillColor('#6B7280')
          .text(`Délivré le ${completionDate}`, 0, doc.page.height - 150, { align: 'center' });

        // Signature
        doc.fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#374151')
          .text('IFN Connect - Plateforme Nationale des Acteurs du Vivrier Marchand', 0, doc.page.height - 100, { align: 'center' });

        doc.end();
      });
    }),

  /**
   * Récupérer les questions du quiz d'un cours
   */
  getQuiz: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      const questions = await db.select().from(quizzes).where(eq(quizzes.courseId, input.courseId));
      // Ne pas renvoyer la bonne réponse au frontend
      return questions.map(q => ({
        id: q.id,
        question: q.question,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
      }));
    }),

  /**
   * Soumettre les réponses du quiz
   */
  submitQuiz: protectedProcedure
    .input(z.object({
      courseId: z.number(),
      answers: z.array(z.object({
        questionId: z.number(),
        answer: z.enum(["A", "B", "C", "D"]),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });
      
      // Récupérer toutes les questions
      const questions = await db.select().from(quizzes).where(eq(quizzes.courseId, input.courseId));
      
      // Calculer le score
      let correctAnswers = 0;
      const totalQuestions = questions.length;
      
      for (const userAnswer of input.answers) {
        const question = questions.find(q => q.id === userAnswer.questionId);
        if (question && question.correctAnswer === userAnswer.answer) {
          correctAnswers++;
        }
      }
      
      const score = Math.round((correctAnswers / totalQuestions) * 100);
      const passed = score >= 70;
      
      // Enregistrer la tentative
      await db.insert(quizAttempts).values({
        userId: ctx.user.id,
        courseId: input.courseId,
        score,
        totalQuestions,
        correctAnswers,
        passed,
        answers: JSON.stringify(input.answers),
      });
      
      // Si réussi, marquer le cours comme complété
      if (passed) {
        const [existing] = await db.select().from(courseProgress)
          .where(and(
            eq(courseProgress.userId, ctx.user.id),
            eq(courseProgress.courseId, input.courseId)
          ));
        
        if (existing) {
          await db.update(courseProgress)
            .set({ completed: true, completedAt: new Date() })
            .where(and(
              eq(courseProgress.userId, ctx.user.id),
              eq(courseProgress.courseId, input.courseId)
            ));
        } else {
          await db.insert(courseProgress).values({
            userId: ctx.user.id,
            courseId: input.courseId,
            progress: 100,
            completed: true,
            completedAt: new Date(),
          });
        }
        
        // 🎯 GAMIFICATION : Attribuer les badges
        const badgesToAward: Array<{ badgeName: string; badgeIcon: string; courseId: number | null; scoreObtained: number }> = [];
        
        // Badge spécifique au cours (si score >= 80%)
        const courseBadge = getBadgeForCourse(input.courseId, score);
        if (courseBadge) {
          badgesToAward.push({
            badgeName: courseBadge.name,
            badgeIcon: courseBadge.icon,
            courseId: input.courseId,
            scoreObtained: score,
          });
        }
        
        // Badge "Perfectionniste" (score 100%)
        const perfectionistBadge = checkPerfectionistBadge(score);
        if (perfectionistBadge) {
          badgesToAward.push({
            badgeName: perfectionistBadge.name,
            badgeIcon: perfectionistBadge.icon,
            courseId: input.courseId,
            scoreObtained: score,
          });
        }
        
        // Badge "Apprenant Assidu" (5 cours terminés)
        const completedCoursesCount = await db.select().from(courseProgress)
          .where(and(
            eq(courseProgress.userId, ctx.user.id),
            eq(courseProgress.completed, true)
          ));
        
        const assiduousBadge = checkAssiduousBadge(completedCoursesCount.length);
        if (assiduousBadge) {
          // Vérifier si le badge n'a pas déjà été attribué
          const [existingBadge] = await db.select().from(userAchievements)
            .where(and(
              eq(userAchievements.userId, ctx.user.id),
              eq(userAchievements.badgeName, assiduousBadge.name)
            ));
          
          if (!existingBadge) {
            badgesToAward.push({
              badgeName: assiduousBadge.name,
              badgeIcon: assiduousBadge.icon,
              courseId: null,
              scoreObtained: score,
            });
          }
        }
        
        // Insérer tous les badges gagnés
        if (badgesToAward.length > 0) {
          for (const badge of badgesToAward) {
            // Vérifier si le badge n'existe pas déjà
            const whereConditions = [
              eq(userAchievements.userId, ctx.user.id),
              eq(userAchievements.badgeName, badge.badgeName)
            ];
            
            if (badge.courseId) {
              whereConditions.push(eq(userAchievements.courseId, badge.courseId));
            }
            
            const [existing] = await db.select().from(userAchievements)
              .where(and(...whereConditions));
            
            if (!existing) {
              await db.insert(userAchievements).values({
                userId: ctx.user.id,
                badgeName: badge.badgeName,
                badgeIcon: badge.badgeIcon,
                courseId: badge.courseId,
                scoreObtained: badge.scoreObtained,
              });
            }
          }
        }
        
        // 🏆 CLASSEMENT : Mettre à jour le leaderboard hebdomadaire
        // Récupérer la région du marchand
        const { merchants } = await import('../../drizzle/schema');
        const [merchant] = await db.select({ location: merchants.location })
          .from(merchants)
          .where(eq(merchants.userId, ctx.user.id))
          .limit(1);
        
        const region = merchant?.location || 'Abidjan';
        
        // Calculer la semaine actuelle
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
        const year = now.getFullYear();
        
        // Mettre à jour ou créer l'entrée du leaderboard
        const { weeklyLeaderboard } = await import('../../drizzle/schema');
        const [existingLeaderboard] = await db.select().from(weeklyLeaderboard)
          .where(and(
            eq(weeklyLeaderboard.userId, ctx.user.id),
            eq(weeklyLeaderboard.weekNumber, weekNumber),
            eq(weeklyLeaderboard.year, year)
          ));
        
        if (existingLeaderboard) {
          const newQuizzesCompleted = existingLeaderboard.quizzesCompleted + 1;
          const newTotalPoints = existingLeaderboard.totalPoints + score;
          const newAverageScore = Math.round(newTotalPoints / newQuizzesCompleted);
          
          await db.update(weeklyLeaderboard)
            .set({
              totalPoints: newTotalPoints,
              quizzesCompleted: newQuizzesCompleted,
              averageScore: newAverageScore,
            })
            .where(eq(weeklyLeaderboard.id, existingLeaderboard.id));
        } else {
          await db.insert(weeklyLeaderboard).values({
            userId: ctx.user.id,
            weekNumber,
            year,
            region,
            totalPoints: score,
            quizzesCompleted: 1,
            averageScore: score,
          });
        }
      }
      
      return {
        score,
        correctAnswers,
        totalQuestions,
        passed,
        message: passed ? "Félicitations ! Vous avez réussi le quiz." : "Score insuffisant. Vous devez obtenir au moins 70% pour valider le cours.",
      };
    }),

  /**
   * Récupérer l'historique des tentatives de quiz
   */
  getAttempts: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      return await db.select().from(quizAttempts)
        .where(and(
          eq(quizAttempts.userId, ctx.user.id),
          eq(quizAttempts.courseId, input.courseId)
        ))
        .orderBy(desc(quizAttempts.completedAt));
    }),

  /**
   * Marquer un cours comme terminé
   */
  markComplete: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });

      // Vérifier si une progression existe déjà
      const [existing] = await db
        .select()
        .from(courseProgress)
        .where(
          and(
            eq(courseProgress.userId, ctx.user.id),
            eq(courseProgress.courseId, input.courseId)
          )
        )
        .limit(1);

      if (existing) {
        // Mettre à jour
        await db
          .update(courseProgress)
          .set({
            progress: 100,
            completed: true,
            completedAt: new Date(),
          })
          .where(eq(courseProgress.id, existing.id));
      } else {
        // Créer
        await db.insert(courseProgress).values({
          userId: ctx.user.id,
          courseId: input.courseId,
          progress: 100,
          completed: true,
          completedAt: new Date(),
        });
      }

      return { success: true };
    }),
});
