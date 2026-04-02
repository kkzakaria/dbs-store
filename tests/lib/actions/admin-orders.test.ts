import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDb = {
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
};

vi.mock("@/lib/db", () => ({ getDb: vi.fn(() => mockDb) }));
vi.mock("@/lib/actions/admin-auth", () => ({
  requireOrgMember: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateOrderStatus } from "@/lib/actions/admin-orders";

describe("updateOrderStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lève INVALID_TRANSITION si transition non autorisée", async () => {
    mockDb.limit.mockResolvedValueOnce([
      { id: "o1", status: "delivered", payment_method: "cod" },
    ]);
    await expect(updateOrderStatus("o1", "pending")).rejects.toThrow("INVALID_TRANSITION");
  });

  it("lève ORDER_NOT_FOUND si commande introuvable", async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    await expect(updateOrderStatus("unknown", "confirmed")).rejects.toThrow("ORDER_NOT_FOUND");
  });

  it("met à jour le statut pour une transition valide", async () => {
    mockDb.limit.mockResolvedValueOnce([
      { id: "o1", status: "pending", payment_method: "card" },
    ]);
    await updateOrderStatus("o1", "confirmed");
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "confirmed" })
    );
  });

  it("définit payment_status=paid pour COD à la livraison", async () => {
    mockDb.limit.mockResolvedValueOnce([
      { id: "o2", status: "shipped", payment_method: "cod" },
    ]);
    await updateOrderStatus("o2", "delivered");
    expect(mockDb.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "delivered", payment_status: "paid" })
    );
  });
});
