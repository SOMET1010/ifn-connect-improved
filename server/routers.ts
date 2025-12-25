import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { getMerchantByUserId } from "./db-merchant";
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
import { scoresRouter } from "./routers/scores";
import { savingsRouter } from './routers/savings';
import { eventsRouter } from './routers/events';

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
  scores: scoresRouter,
  savings: savingsRouter,
  events: eventsRouter,
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
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
