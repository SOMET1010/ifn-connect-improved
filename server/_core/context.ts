import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Mode test E2E : bypass authentification avec un utilisateur mock marchand
  if (process.env.E2E_TEST_MODE === 'true') {
    user = {
      id: 1,
      openId: 'test-merchant',
      name: 'Test Merchant',
      email: 'merchant@test.com',
      phone: '0123456789',
      role: 'merchant' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
  } else {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
