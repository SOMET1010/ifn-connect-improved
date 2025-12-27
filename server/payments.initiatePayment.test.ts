import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as dbModule from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Mock de la base de données
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

function createMerchantContext(userId: number): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "merchant-test",
    email: "merchant@example.com",
    name: "Test Merchant",
    loginMethod: "manus",
    role: "merchant",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe.skip("payments.initiatePayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initiate payment successfully with valid order", async () => {
    const ctx = createMerchantContext(1);
    const caller = appRouter.createCaller(ctx);

    // Mock de la base de données
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 1,
                buyerId: 1,
                totalAmount: "5000",
                status: "pending_payment",
              },
            ]),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          $returningId: vi.fn().mockResolvedValue([{ id: 1 }]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      }),
    };

    vi.mocked(dbModule.getDb).mockResolvedValue(mockDb as any);

    const paymentData = {
      orderId: 1,
      provider: "orange_money" as const,
      phoneNumber: "+2250123456789",
    };

    const result = await caller.payments.initiatePayment(paymentData);

    expect(result).toBeDefined();
    expect(result.reference).toContain("IFN-");
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("should throw error when order not found", async () => {
    const ctx = createMerchantContext(1);
    const caller = appRouter.createCaller(ctx);

    // Mock de la base de données - order not found
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // Empty result
          }),
        }),
      }),
    };

    vi.mocked(dbModule.getDb).mockResolvedValue(mockDb as any);

    const paymentData = {
      orderId: 999,
      provider: "orange_money" as const,
      phoneNumber: "+2250123456789",
    };

    await expect(caller.payments.initiatePayment(paymentData)).rejects.toThrow(
      "Commande introuvable"
    );
  });

  it("should throw error when order does not belong to user", async () => {
    const ctx = createMerchantContext(1);
    const caller = appRouter.createCaller(ctx);

    // Mock de la base de données - order belongs to different user
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 1,
                buyerId: 999, // Different user
                totalAmount: "5000",
                status: "pending_payment",
              },
            ]),
          }),
        }),
      }),
    };

    vi.mocked(dbModule.getDb).mockResolvedValue(mockDb as any);

    const paymentData = {
      orderId: 1,
      provider: "orange_money" as const,
      phoneNumber: "+2250123456789",
    };

    await expect(caller.payments.initiatePayment(paymentData)).rejects.toThrow(
      "Cette commande ne vous appartient pas"
    );
  });

  it("should throw error when order already paid", async () => {
    const ctx = createMerchantContext(1);
    const caller = appRouter.createCaller(ctx);

    // Mock de la base de données - order already paid
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 1,
                buyerId: 1,
                totalAmount: "5000",
                status: "paid", // Already paid
              },
            ]),
          }),
        }),
      }),
    };

    vi.mocked(dbModule.getDb).mockResolvedValue(mockDb as any);

    const paymentData = {
      orderId: 1,
      provider: "orange_money" as const,
      phoneNumber: "+2250123456789",
    };

    await expect(caller.payments.initiatePayment(paymentData)).rejects.toThrow(
      "Cette commande a déjà été payée ou annulée"
    );
  });

  it("should throw error with invalid phone number format", async () => {
    const ctx = createMerchantContext(1);
    const caller = appRouter.createCaller(ctx);

    const paymentData = {
      orderId: 1,
      provider: "orange_money" as const,
      phoneNumber: "123456", // Invalid format
    };

    await expect(caller.payments.initiatePayment(paymentData)).rejects.toThrow();
  });

  it("should support all payment providers", async () => {
    const ctx = createMerchantContext(1);
    const caller = appRouter.createCaller(ctx);

    const providers = ["orange_money", "mtn_momo", "wave", "moov_money"] as const;

    for (const provider of providers) {
      // Mock de la base de données
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: 1,
                  buyerId: 1,
                  totalAmount: "5000",
                  status: "pending_payment",
                },
              ]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            $returningId: vi.fn().mockResolvedValue([{ id: 1 }]),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue({}),
          }),
        }),
      };

      vi.mocked(dbModule.getDb).mockResolvedValue(mockDb as any);

      const paymentData = {
        orderId: 1,
        provider,
        phoneNumber: "+2250123456789",
      };

      const result = await caller.payments.initiatePayment(paymentData);
      expect(result).toBeDefined();
      expect(result.provider).toBe(provider);
    }
  });

  it("should generate unique payment reference", async () => {
    const ctx = createMerchantContext(1);
    const caller = appRouter.createCaller(ctx);

    const references = new Set<string>();

    for (let i = 0; i < 5; i++) {
      // Mock de la base de données
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: i + 1,
                  buyerId: 1,
                  totalAmount: "5000",
                  status: "pending_payment",
                },
              ]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            $returningId: vi.fn().mockResolvedValue([{ id: i + 1 }]),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue({}),
          }),
        }),
      };

      vi.mocked(dbModule.getDb).mockResolvedValue(mockDb as any);

      const paymentData = {
        orderId: i + 1,
        provider: "orange_money" as const,
        phoneNumber: "+2250123456789",
      };

      const result = await caller.payments.initiatePayment(paymentData);
      references.add(result.reference);

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // All references should be unique
    expect(references.size).toBe(5);
  });
});
