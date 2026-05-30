// tests/lib/actions/category-filters.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCount = vi.fn();

vi.mock("@/lib/data/products", () => ({
  countProductsByCategory: (...a: unknown[]) => mockCount(...a),
}));

vi.mock("@/lib/db", () => ({
  getDb: vi.fn().mockResolvedValue("mock-db"),
}));

const { countCategoryProducts } = await import("@/lib/actions/category-filters");

beforeEach(() => {
  mockCount.mockReset();
});

describe("countCategoryProducts", () => {
  it("renvoie null si categoryId est invalide", async () => {
    expect(await countCategoryProducts({ categoryId: "" })).toBeNull();
    // @ts-expect-error test runtime
    expect(await countCategoryProducts(null)).toBeNull();
    expect(mockCount).not.toHaveBeenCalled();
  });

  it("nettoie les inputs et délègue au comptage", async () => {
    mockCount.mockResolvedValue(7);
    const result = await countCategoryProducts({
      categoryId: "smartphones",
      // @ts-expect-error inputs runtime non typés
      brands: ["Apple", "", 42],
      prixMin: -3,
      prixMax: 500000,
    });
    expect(result).toBe(7);
    expect(mockCount).toHaveBeenCalledWith("mock-db", "smartphones", {
      brands: ["Apple"],
      prix_min: undefined,
      prix_max: 500000,
    });
  });

  it("renvoie null si le comptage lève une erreur", async () => {
    mockCount.mockRejectedValue(new Error("db down"));
    expect(await countCategoryProducts({ categoryId: "smartphones" })).toBeNull();
  });
});
