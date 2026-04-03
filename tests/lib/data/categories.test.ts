import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getTopLevelCategories,
  getSubcategories,
  getAllCategories,
  getCategoryBySlug,
  getCategoryById,
} from "@/lib/data/categories";

// ── Mock DB helper ───────────────────────────────────────────────────────────

function createMockDb(rows: unknown[] = []) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
  // When no .limit() is called, the chain itself resolves to rows via .then()
  // Drizzle chains are thenable, so we add a .then() to support await without .limit()
  const thenable = {
    ...chain,
    orderBy: vi.fn().mockImplementation(() => {
      return {
        ...chain,
        then: (resolve: (v: unknown) => void) => resolve(rows),
        limit: vi.fn().mockResolvedValue(rows),
      };
    }),
  };
  return thenable as unknown as Record<string, ReturnType<typeof vi.fn>>;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("getTopLevelCategories", () => {
  it("queries categories with null parent_id ordered by order", async () => {
    const expected = [
      { id: "smartphones", slug: "smartphones", name: "Smartphones", icon: "smartphone", image: null, parent_id: null, order: 0, created_at: new Date() },
    ];
    const db = createMockDb(expected);
    const result = await getTopLevelCategories(db as never);
    expect(result).toEqual(expected);
    expect(db.select).toHaveBeenCalled();
    expect(db.from).toHaveBeenCalled();
  });
});

describe("getSubcategories", () => {
  it("queries categories by parent_id ordered by order", async () => {
    const expected = [
      { id: "iphone", slug: "iphone", name: "iPhone", icon: "smartphone", image: null, parent_id: "smartphones", order: 0, created_at: new Date() },
    ];
    const db = createMockDb(expected);
    const result = await getSubcategories(db as never, "smartphones");
    expect(result).toEqual(expected);
    expect(db.select).toHaveBeenCalled();
  });
});

describe("getAllCategories", () => {
  it("returns all categories ordered", async () => {
    const expected = [
      { id: "smartphones", slug: "smartphones", name: "Smartphones", icon: "smartphone", image: null, parent_id: null, order: 0, created_at: new Date() },
      { id: "tablettes", slug: "tablettes", name: "Tablettes", icon: "tablet", image: null, parent_id: null, order: 1, created_at: new Date() },
    ];
    const db = createMockDb(expected);
    const result = await getAllCategories(db as never);
    expect(result).toEqual(expected);
    expect(db.select).toHaveBeenCalled();
  });
});

describe("getCategoryBySlug", () => {
  it("returns category matching slug", async () => {
    const category = { id: "smartphones", slug: "smartphones", name: "Smartphones", icon: "smartphone", image: null, parent_id: null, order: 0, created_at: new Date() };
    const db = createMockDb([category]);
    const result = await getCategoryBySlug(db as never, "smartphones");
    expect(result).toEqual(category);
  });

  it("returns null when not found", async () => {
    const db = createMockDb([]);
    const result = await getCategoryBySlug(db as never, "nonexistent");
    expect(result).toBeNull();
  });
});

describe("getCategoryById", () => {
  it("returns category matching id", async () => {
    const category = { id: "smartphones", slug: "smartphones", name: "Smartphones", icon: "smartphone", image: null, parent_id: null, order: 0, created_at: new Date() };
    const db = createMockDb([category]);
    const result = await getCategoryById(db as never, "smartphones");
    expect(result).toEqual(category);
  });

  it("returns null when not found", async () => {
    const db = createMockDb([]);
    const result = await getCategoryById(db as never, "nonexistent");
    expect(result).toBeNull();
  });
});
