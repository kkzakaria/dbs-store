import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────

const { mockUnstableCache, mockGetDb } = vi.hoisted(() => {
  const mockUnstableCache = vi.fn((fn: (...args: unknown[]) => unknown, keyParts?: string[], options?: Record<string, unknown>) => {
    const wrapped = (...args: unknown[]) => fn(...args);
    (wrapped as any)._keyParts = keyParts;
    (wrapped as any)._options = options;
    return wrapped;
  });
  const mockGetDb = vi.fn();
  return { mockUnstableCache, mockGetDb };
});

vi.mock("next/cache", () => ({
  unstable_cache: mockUnstableCache,
  revalidateTag: vi.fn(),
}));

const mockRows: unknown[] = [];
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockImplementation(() => ({
    then: (resolve: (v: unknown) => void) => resolve(mockRows),
    limit: vi.fn().mockResolvedValue(mockRows),
  })),
  limit: vi.fn().mockResolvedValue(mockRows),
};

mockGetDb.mockReturnValue(mockDb);
vi.mock("@/lib/db", () => ({ getDb: mockGetDb }));

import {
  getCachedAllCategories,
  getCachedTopLevelCategories,
  getCachedSubcategories,
  getCachedCategoryBySlug,
} from "@/lib/data/categories";

// ── Tests ──────────────────────────────────────────────────────────────────

describe("cached category functions", () => {
  it("getCachedAllCategories uses unstable_cache with correct tag and revalidate", () => {
    const fn = getCachedAllCategories as unknown as { _keyParts: string[]; _options: Record<string, unknown> };
    expect(fn._keyParts).toEqual(["getAllCategories"]);
    expect(fn._options).toEqual({ revalidate: 3600, tags: ["categories"] });
  });

  it("getCachedTopLevelCategories uses unstable_cache with correct tag and revalidate", () => {
    const fn = getCachedTopLevelCategories as unknown as { _keyParts: string[]; _options: Record<string, unknown> };
    expect(fn._keyParts).toEqual(["getTopLevelCategories"]);
    expect(fn._options).toEqual({ revalidate: 3600, tags: ["categories"] });
  });

  it("getCachedSubcategories uses unstable_cache with correct tag and revalidate", () => {
    const fn = getCachedSubcategories as unknown as { _keyParts: string[]; _options: Record<string, unknown> };
    expect(fn._keyParts).toEqual(["getSubcategories"]);
    expect(fn._options).toEqual({ revalidate: 3600, tags: ["categories"] });
  });

  it("getCachedCategoryBySlug uses unstable_cache with correct tag and revalidate", () => {
    const fn = getCachedCategoryBySlug as unknown as { _keyParts: string[]; _options: Record<string, unknown> };
    expect(fn._keyParts).toEqual(["getCategoryBySlug"]);
    expect(fn._options).toEqual({ revalidate: 3600, tags: ["categories"] });
  });

  it("unstable_cache was called 4 times (one per cached function)", () => {
    expect(mockUnstableCache).toHaveBeenCalledTimes(4);
  });
});

describe("cached function invocation", () => {
  const category = { id: "1", slug: "smartphones", name: "Smartphones", icon: "smartphone", image: null, parent_id: null, order: 0, created_at: new Date() };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDb.mockReturnValue(mockDb);
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockImplementation(() => ({
      then: (resolve: (v: unknown) => void) => resolve([category]),
      limit: vi.fn().mockResolvedValue([category]),
    }));
    mockDb.limit.mockResolvedValue([category]);
  });

  it("getCachedAllCategories calls getDb and returns data", async () => {
    const result = await getCachedAllCategories();
    expect(mockGetDb).toHaveBeenCalled();
    expect(result).toEqual([category]);
  });

  it("getCachedTopLevelCategories calls getDb and returns data", async () => {
    const result = await getCachedTopLevelCategories();
    expect(mockGetDb).toHaveBeenCalled();
    expect(result).toEqual([category]);
  });

  it("getCachedSubcategories forwards parentId argument", async () => {
    const result = await getCachedSubcategories("parent-123");
    expect(mockGetDb).toHaveBeenCalled();
    expect(mockDb.where).toHaveBeenCalled();
    expect(result).toEqual([category]);
  });

  it("getCachedCategoryBySlug forwards slug argument", async () => {
    const result = await getCachedCategoryBySlug("smartphones");
    expect(mockGetDb).toHaveBeenCalled();
    expect(mockDb.where).toHaveBeenCalled();
    expect(result).toEqual(category);
  });

  it("propagates DB errors to the caller", async () => {
    mockGetDb.mockImplementation(() => { throw new Error("D1 unavailable"); });
    await expect(getCachedAllCategories()).rejects.toThrow("D1 unavailable");
  });
});
