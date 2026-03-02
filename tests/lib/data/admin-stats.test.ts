import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
};

vi.mock("@/lib/db", () => ({ getDb: vi.fn(() => mockDb) }));

import { getAdminStats } from "@/lib/data/admin-stats";

describe("getAdminStats", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retourne un objet avec les 4 métriques et ordersByDay", async () => {
    // Chaque appel .where() retourne une Promise resolving à un tableau
    mockDb.where
      .mockResolvedValueOnce([{ count: 3 }])
      .mockResolvedValueOnce([{ total: 150000 }])
      .mockResolvedValueOnce([{ count: 12 }])
      .mockResolvedValueOnce([{ count: 2 }])
      .mockResolvedValueOnce([]);  // recentOrders

    const stats = await getAdminStats(mockDb as never);
    expect(stats).toMatchObject({
      ordersToday: expect.any(Number),
      revenueMonth: expect.any(Number),
      pendingOrders: expect.any(Number),
      lowStockProducts: expect.any(Number),
      ordersByDay: expect.any(Array),
    });
    expect(stats.ordersByDay).toHaveLength(7);
  });
});
