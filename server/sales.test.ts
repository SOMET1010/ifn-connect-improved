import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMerchantContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "merchant-test",
    email: "merchant@test.com",
    name: "Test Merchant",
    loginMethod: "manus",
    role: "user",
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

  return { ctx };
}

describe("sales procedures", () => {
  it("should get today stats for a merchant", async () => {
    const { ctx } = createMerchantContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.sales.todayStats({ merchantId: 1 });

    expect(stats).toHaveProperty("salesCount");
    expect(stats).toHaveProperty("totalAmount");
    expect(typeof stats.salesCount).toBe("number");
    expect(typeof stats.totalAmount).toBe("number");
  });

  it("should list sales by merchant", async () => {
    const { ctx } = createMerchantContext();
    const caller = appRouter.createCaller(ctx);

    const sales = await caller.sales.listByMerchant({
      merchantId: 1,
      limit: 10,
      offset: 0,
    });

    expect(Array.isArray(sales)).toBe(true);
  });

  it("should get sales history with filters", async () => {
    const { ctx } = createMerchantContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.sales.history({
      merchantId: 1,
      limit: 10,
      offset: 0,
    });

    expect(Array.isArray(history)).toBe(true);
  });
});

describe("products procedures", () => {
  it("should list products by merchant", async () => {
    const { ctx } = createMerchantContext();
    const caller = appRouter.createCaller(ctx);

    const products = await caller.products.listByMerchant({
      merchantId: 1,
    });

    expect(Array.isArray(products)).toBe(true);
  });
});

describe("stock procedures", () => {
  it("should list stock by merchant", async () => {
    const { ctx } = createMerchantContext();
    const caller = appRouter.createCaller(ctx);

    const stock = await caller.stock.listByMerchant({
      merchantId: 1,
    });

    expect(Array.isArray(stock)).toBe(true);
  });

  it("should get low stock items", async () => {
    const { ctx } = createMerchantContext();
    const caller = appRouter.createCaller(ctx);

    const lowStock = await caller.stock.lowStock({
      merchantId: 1,
    });

    expect(Array.isArray(lowStock)).toBe(true);
  });
});
