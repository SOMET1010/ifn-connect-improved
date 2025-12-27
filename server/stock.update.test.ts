import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as dbModule from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Mock de la base de données
vi.mock("./db", () => ({
  getDb: vi.fn(),
  getMerchantByUserId: vi.fn(),
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

describe("stock.update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update stock quantity successfully", async () => {
    const ctx = createMerchantContext(1);
    const caller = appRouter.createCaller(ctx);

    // Mock getMerchantByUserId
    vi.mocked(dbModule.getMerchantByUserId).mockResolvedValue({
      id: 1,
      userId: 1,
      merchantNumber: "MRC-00001",
      businessName: "Test Business",
    } as any);

    // Mock de la base de données
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 1,
                merchantId: 1,
                productId: 1,
                quantity: "10",
                minThreshold: "5",
              },
            ]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      }),
    };

    vi.mocked(dbModule.getDb).mockResolvedValue(mockDb as any);

    const updateData = {
      productId: 1,
      quantity: 20,
    };

    const result = await caller.stock.update(updateData);

    expect(result).toBeDefined();
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("should throw error when stock item not found", async () => {
    const ctx = createMerchantContext(1);
    const caller = appRouter.createCaller(ctx);

    // Mock getMerchantByUserId
    vi.mocked(dbModule.getMerchantByUserId).mockResolvedValue({
      id: 1,
      userId: 1,
      merchantNumber: "MRC-00001",
      businessName: "Test Business",
    } as any);

    // Mock de la base de données - stock not found
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

    const updateData = {
      productId: 999,
      quantity: 20,
    };

    await expect(caller.stock.update(updateData)).rejects.toThrow();
  });

  it("should throw error with negative quantity", async () => {
    const ctx = createMerchantContext(1);
    const caller = appRouter.createCaller(ctx);

    const updateData = {
      productId: 1,
      quantity: -5, // Invalid negative quantity
    };

    await expect(caller.stock.update(updateData)).rejects.toThrow();
  });

  it("should handle zero quantity (out of stock)", async () => {
    const ctx = createMerchantContext(1);
    const caller = appRouter.createCaller(ctx);

    // Mock getMerchantByUserId
    vi.mocked(dbModule.getMerchantByUserId).mockResolvedValue({
      id: 1,
      userId: 1,
      merchantNumber: "MRC-00001",
      businessName: "Test Business",
    } as any);

    // Mock de la base de données
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 1,
                merchantId: 1,
                productId: 1,
                quantity: "10",
                minThreshold: "5",
              },
            ]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({}),
        }),
      }),
    };

    vi.mocked(dbModule.getDb).mockResolvedValue(mockDb as any);

    const updateData = {
      productId: 1,
      quantity: 0, // Zero is valid (out of stock)
    };

    const result = await caller.stock.update(updateData);

    expect(result).toBeDefined();
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("should update lastRestocked timestamp", async () => {
    const ctx = createMerchantContext(1);
    const caller = appRouter.createCaller(ctx);

    let capturedUpdateData: any;

    // Mock getMerchantByUserId
    vi.mocked(dbModule.getMerchantByUserId).mockResolvedValue({
      id: 1,
      userId: 1,
      merchantNumber: "MRC-00001",
      businessName: "Test Business",
    } as any);

    // Mock de la base de données
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 1,
                merchantId: 1,
                productId: 1,
                quantity: "10",
                minThreshold: "5",
              },
            ]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockImplementation((data) => {
          capturedUpdateData = data;
          return {
            where: vi.fn().mockResolvedValue({}),
          };
        }),
      }),
    };

    vi.mocked(dbModule.getDb).mockResolvedValue(mockDb as any);

    const updateData = {
      productId: 1,
      quantity: 50,
    };

    await caller.stock.update(updateData);

    // Verify lastRestocked is updated
    expect(capturedUpdateData.lastRestocked).toBeDefined();
    expect(capturedUpdateData.lastRestocked).toBeInstanceOf(Date);
  });

  it("should allow updating minThreshold", async () => {
    const ctx = createMerchantContext(1);
    const caller = appRouter.createCaller(ctx);

    let capturedUpdateData: any;

    // Mock getMerchantByUserId
    vi.mocked(dbModule.getMerchantByUserId).mockResolvedValue({
      id: 1,
      userId: 1,
      merchantNumber: "MRC-00001",
      businessName: "Test Business",
    } as any);

    // Mock de la base de données
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 1,
                merchantId: 1,
                productId: 1,
                quantity: "10",
                minThreshold: "5",
              },
            ]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockImplementation((data) => {
          capturedUpdateData = data;
          return {
            where: vi.fn().mockResolvedValue({}),
          };
        }),
      }),
    };

    vi.mocked(dbModule.getDb).mockResolvedValue(mockDb as any);

    const updateData = {
      productId: 1,
      quantity: 10,
      minThreshold: 15, // New threshold
    };

    await caller.stock.update(updateData);

    // Verify minThreshold is updated
    expect(capturedUpdateData.minThreshold).toBe("15");
  });
});
