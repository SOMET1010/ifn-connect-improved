import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/**
 * Middleware pour vérifier que l'utilisateur a accès aux ressources du marchand
 * Protection contre les attaques IDOR (Insecure Direct Object Reference)
 * 
 * Usage: merchantProcedure.input(z.object({ merchantId: z.number() }))...
 * 
 * Ce middleware vérifie automatiquement que:
 * 1. L'utilisateur est authentifié
 * 2. Le merchantId dans l'input correspond au marchand de l'utilisateur
 */
export const merchantProcedure = protectedProcedure.use(
  t.middleware(async opts => {
    const { ctx, next, rawInput } = opts;
    
    // Vérifier si l'input contient un merchantId
    const input = rawInput as any;
    if (input && typeof input === 'object' && 'merchantId' in input) {
      // Récupérer le marchand de l'utilisateur
      const { getMerchantByUserId } = await import('../db-merchant');
      const userMerchant = await getMerchantByUserId(ctx.user.id);
      
      if (!userMerchant) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Vous n'êtes pas associé à un marchand" 
        });
      }
      
      // Vérifier que le merchantId correspond
      if (input.merchantId !== userMerchant.id) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Vous n'avez pas accès aux ressources de ce marchand" 
        });
      }
    }
    
    return next({ ctx });
  })
);
