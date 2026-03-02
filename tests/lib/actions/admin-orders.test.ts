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
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn(), listOrganizations: vi.fn() } },
}));
vi.mock("next/headers", () => ({ headers: vi.fn(() => new Headers()) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/actions/admin-orders";

function mockAuth() {
  (auth.api.getSession as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    user: { id: "u1" },
  });
  (auth.api.listOrganizations as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "org1" }]);
}

describe("updateOrderStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth();
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
});
