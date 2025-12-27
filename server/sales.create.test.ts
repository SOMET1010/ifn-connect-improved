import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as dbModule from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Mock de la base de données
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

function createMerchantContext(merchantId: number): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
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

describe("sales.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a sale successfully with valid data", async () => {
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
                userId: 1,
                merchantNumber: "MRC-00001",
                businessName: "Test Business",
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

    const saleData = {
      productId: 1,
      quantity: 5,
      unitPrice: 1000,
      paymentMethod: "cash" as const,
    };

    const result = await caller.sales.create(saleData);

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.update).toHaveBeenCalled(); // Stock should be updated
  });

  it("should throw error when merchant not found", async () => {
    const ctx = createMerchantContext(999);
    const caller = appRouter.createCaller(ctx);

    // Mock de la base de données - merchant not found
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

    const saleData = {
      productId: 1,
      quantity: 5,
      unitPrice: 1000,
      paymentMethod: "cash" as const,
    };

    await expect(caller.sales.create(saleData)).rejects.toThrow();
  });

  it("should throw error with invalid quantity (zero)", async () => {
    const ctx = createMerchantContext(1);
    const caller = appRouter.createCaller(ctx);

    const saleData = {
      productId: 1,
      quantity: 0, // Invalid quantity
      unitPrice: 1000,
      paymentMethod: "cash" as const,
    };

    await expect(caller.sales.create(saleData)).rejects.toThrow();
  });

  it("should throw error with negative quantity", async () => {
    const ctx = createMerchantContext(1);
    const caller = appRouter.createCaller(ctx);

    const saleData = {
      productId: 1,
      quantity: -5, // Invalid negative quantity
      unitPrice: 1000,
      paymentMethod: "cash" as const,
    };

    await expect(caller.sales.create(saleData)).rejects.toThrow();
  });

  it("should calculate total amount correctly", async () => {
    const ctx = createMerchantContext(1);
    const caller = appRouter.createCaller(ctx);

    let capturedSaleData: any;

    // Mock de la base de données
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 1,
                userId: 1,
                merchantNumber: "MRC-00001",
                businessName: "Test Business",
              },
            ]),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockImplementation((data) => {
          capturedSaleData = data;
          return {
            $returningId: vi.fn().mockResolvedValue([{ id: 1 }]),
          };
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      }),
    };

    vi.mocked(dbModule.getDb).mockResolvedValue(mockDb as any);

    const saleData = {
      productId: 1,
      quantity: 3,
      unitPrice: 500,
      paymentMethod: "cash" as const,
    };

    await caller.sales.create(saleData);

    // Verify total amount calculation (3 * 500 = 1500)
    expect(capturedSaleData.totalAmount).toBe("1500");
  });

  it("should support mobile money payment method", async () => {
    const ctx = createMerchantContext(1);
    const caller = appRouter.createCaller(ctx);

    let capturedSaleData: any;

    // Mock de la base de données
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 1,
                userId: 1,
                merchantNumber: "MRC-00001",
                businessName: "Test Business",
              },
            ]),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockImplementation((data) => {
          capturedSaleData = data;
          return {
            $returningId: vi.fn().mockResolvedValue([{ id: 1 }]),
          };
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      }),
    };

    vi.mocked(dbModule.getDb).mockResolvedValue(mockDb as any);

    const saleData = {
      productId: 1,
      quantity: 2,
      unitPrice: 750,
      paymentMethod: "mobile_money" as const,
      paymentProvider: "Orange Money",
    };

    await caller.sales.create(saleData);

    expect(capturedSaleData.paymentMethod).toBe("mobile_money");
    expect(capturedSaleData.paymentProvider).toBe("Orange Money");
  });
});
