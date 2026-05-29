import { describe, it, expect, vi } from "vitest";
import type { ProductVariant } from "@/lib/db/schema";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { getVariantsByProductId, getVariantsByProductIds } from "@/lib/data/variants";

const mockVariant = (overrides: Partial<ProductVariant> = {}): ProductVariant => ({
  id: "v1",
  product_id: "p1",
  color_name: "Noir",
  color_hex: "#000",
  stock: 5,
  price_override: null,
  sort_order: 0,
  created_at: new Date(),
  ...overrides,
});

function makeMockDb(rows: ProductVariant[]) {
  const query = { orderBy: vi.fn().mockResolvedValue(rows) };
  const whereResult = { orderBy: query.orderBy };
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(whereResult),
      }),
    }),
  };
}

describe("getVariantsByProductId", () => {
  it("returns variants for a given productId", async () => {
    const db = makeMockDb([mockVariant()]);
    const result = await getVariantsByProductId(db as never, "p1");
    expect(result).toHaveLength(1);
    expect(result[0].color_name).toBe("Noir");
  });

  it("returns empty array when no variants", async () => {
    const db = makeMockDb([]);
    const result = await getVariantsByProductId(db as never, "p1");
    expect(result).toHaveLength(0);
  });
});

describe("getVariantsByProductIds", () => {
  it("returns empty array for empty input without touching DB", async () => {
    const db = makeMockDb([]);
    const result = await getVariantsByProductIds(db as never, []);
    expect(result).toHaveLength(0);
    expect(db.select).not.toHaveBeenCalled();
  });

  it("returns variants for multiple product ids", async () => {
    const variants = [
      mockVariant({ id: "v1", product_id: "p1" }),
      mockVariant({ id: "v2", product_id: "p2", color_name: "Blanc" }),
    ];
    const db = makeMockDb(variants);
    const result = await getVariantsByProductIds(db as never, ["p1", "p2"]);
    expect(result).toHaveLength(2);
  });
});
