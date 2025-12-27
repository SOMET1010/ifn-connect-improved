import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { getMerchantByUserId } from "./db-merchant";
import { recordDailyLogin, markBriefingShown, markBriefingSkipped, hasBriefingBeenShown } from "./db-daily-logins";
import { publicProcedure, router } from "./_core/trpc";
import { salesRouter } from "./routers/sales";
import { productsRouter, stockRouter } from "./routers/products";
import { marketsRouter } from './routers/markets';
import { agentRouter } from './routers/agent';
import { ordersRouter } from './routers/orders';
import { badgesRouter } from "./routers/badges";
import { certificatesRouter } from "./routers/certificates";
import { adminRouter } from "./routers/admin";
import { paymentsRouter } from "./routers/payments";
import { copilotRouter } from "./routers/copilot";
import { copilotChatRouter } from "./routers/copilot-chat";
import { scoresRouter } from "./routers/scores";
import { savingsRouter } from './routers/savings';
import { eventsRouter } from './routers/events';
import { weatherRouter } from './routers/weather';
import { socialProtectionRouter } from './routers/social-protection';
import { coursesRouter } from './routers/courses';
import { achievementsRouter } from './routers/achievements';
import { challengesRouter } from './routers/challenges';
import { leaderboardRouter } from './routers/leaderboard';
import { adminUsersRouter } from './routers/admin-users';
import { inAppNotificationsRouter } from './routers/in-app-notifications';
import { cooperativeDashboardRouter } from './routers/cooperative-dashboard';
import { groupedOrdersRouter } from './routers/grouped-orders';
import { merchantSettingsRouter } from './routers/merchant-settings';
import { dailySessionsRouter } from './routers/daily-sessions';
import { attendanceBadgesRouter } from './routers/attendance-badges';
import { tutorialsRouter } from './routers-tutorials';
import { firstTimeUserRouter } from './routers/first-time-user';

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  sales: salesRouter,
  products: productsRouter,
  stock: stockRouter,
  markets: marketsRouter,
  agent: agentRouter,
  orders: ordersRouter,
  badges: badgesRouter,
  certificates: certificatesRouter,
  admin: adminRouter,
  payments: paymentsRouter,
  copilot: copilotRouter,
  copilotChat: copilotChatRouter,
  scores: scoresRouter,
  savings: savingsRouter,
  events: eventsRouter,
  weather: weatherRouter,
  socialProtection: socialProtectionRouter,
  courses: coursesRouter,
  achievements: achievementsRouter,
  challenges: challengesRouter,
  leaderboard: leaderboardRouter,
  adminUsers: adminUsersRouter,
  inAppNotifications: inAppNotificationsRouter,
  cooperativeDashboard: cooperativeDashboardRouter,
  groupedOrders: groupedOrdersRouter,
  merchantSettings: merchantSettingsRouter,
  dailySessions: dailySessionsRouter,
  attendanceBadges: attendanceBadgesRouter,
  tutorials: tutorialsRouter,
  firstTimeUser: firstTimeUserRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    // Récupérer le marchand lié à l'utilisateur connecté
    myMerchant: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      const merchant = await getMerchantByUserId(ctx.user.id);
      return merchant;
    }),
    // Détecter si c'est le premier login du jour
    checkFirstLoginToday: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return { isFirstLogin: false, shouldShowBriefing: false };
      
      const merchant = await getMerchantByUserId(ctx.user.id);
      if (!merchant) return { isFirstLogin: false, shouldShowBriefing: false };
      
      const isFirstLogin = await recordDailyLogin(merchant.id);
      const alreadyShown = await hasBriefingBeenShown(merchant.id);
      
      return {
        isFirstLogin,
        shouldShowBriefing: isFirstLogin && !alreadyShown,
      };
    }),
    // Marquer le briefing comme affiché
    markBriefingShown: publicProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user) return { success: false };
      
      const merchant = await getMerchantByUserId(ctx.user.id);
      if (!merchant) return { success: false };
      
      await markBriefingShown(merchant.id);
      return { success: true };
    }),
    // Marquer le briefing comme ignoré
    markBriefingSkipped: publicProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user) return { success: false };
      
      const merchant = await getMerchantByUserId(ctx.user.id);
      if (!merchant) return { success: false };
      
      await markBriefingSkipped(merchant.id);
      return { success: true };
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
