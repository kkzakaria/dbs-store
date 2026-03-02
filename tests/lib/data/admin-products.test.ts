import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildProductFiltersForAdmin, PAGE_SIZE, getAdminProductById } from "@/lib/data/admin-products";

const mockQueryChain = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
};

vi.mock("@/lib/db", () => ({ getDb: vi.fn(() => mockQueryChain) }));

describe("admin products data", () => {
  it("exporte PAGE_SIZE = 25", () => {
    expect(PAGE_SIZE).toBe(25);
  });

  it("buildProductFiltersForAdmin sans filtres retourne undefined", () => {
    const result = buildProductFiltersForAdmin({});
    expect(result).toBeUndefined();
  });

  it("buildProductFiltersForAdmin avec category_id retourne une condition non-undefined", () => {
    const result = buildProductFiltersForAdmin({ category_id: "smartphones" });
    expect(result).toBeDefined();
  });

  it("buildProductFiltersForAdmin avec search retourne une condition non-undefined", () => {
    const result = buildProductFiltersForAdmin({ search: "iPhone" });
    expect(result).toBeDefined();
  });
});

describe("getAdminProductById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retourne null si aucun résultat", async () => {
    mockQueryChain.select.mockReturnThis();
    mockQueryChain.from.mockReturnThis();
    mockQueryChain.where.mockReturnThis();
    mockQueryChain.limit.mockResolvedValueOnce([]);
    const result = await getAdminProductById(mockQueryChain as never, "nonexistent");
    expect(result).toBeNull();
  });

  it("parse les images JSON correctement", async () => {
    mockQueryChain.select.mockReturnThis();
    mockQueryChain.from.mockReturnThis();
    mockQueryChain.where.mockReturnThis();
    mockQueryChain.limit.mockResolvedValueOnce([
      {
        id: "p1",
        name: "Test",
        slug: "test",
        category_id: "smartphones",
        subcategory_id: null,
        price: 100000,
        old_price: null,
        brand: "Brand",
        images: '["https://example.com/img.jpg"]',
        specs: '{"RAM":"8 Go"}',
        description: "Desc",
        stock: 5,
        badge: null,
        is_active: true,
        created_at: new Date(),
      },
    ]);
    const result = await getAdminProductById(mockQueryChain as never, "p1");
    expect(result?.images).toEqual(["https://example.com/img.jpg"]);
    expect(result?.specs).toEqual({ RAM: "8 Go" });
  });

  it("retourne images vide si JSON invalide", async () => {
    mockQueryChain.select.mockReturnThis();
    mockQueryChain.from.mockReturnThis();
    mockQueryChain.where.mockReturnThis();
    mockQueryChain.limit.mockResolvedValueOnce([
      {
        id: "p1",
        name: "Test",
        slug: "test",
        category_id: "smartphones",
        subcategory_id: null,
        price: 100000,
        old_price: null,
        brand: "Brand",
        images: "INVALID_JSON",
        specs: "{}",
        description: "Desc",
        stock: 5,
        badge: null,
        is_active: true,
        created_at: new Date(),
      },
    ]);
    const result = await getAdminProductById(mockQueryChain as never, "p1");
    expect(result?.images).toEqual([]);
  });
});
