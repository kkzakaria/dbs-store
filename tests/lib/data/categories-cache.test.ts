import { describe, it, expect, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────

const { mockUnstableCache } = vi.hoisted(() => {
  const mockUnstableCache = vi.fn((fn: (...args: unknown[]) => unknown, keyParts?: string[], options?: Record<string, unknown>) => {
    // Return a wrapped function that calls the original
    const wrapped = (...args: unknown[]) => fn(...args);
    // Attach metadata for assertions
    (wrapped as any)._keyParts = keyParts;
    (wrapped as any)._options = options;
    return wrapped;
  });
  return { mockUnstableCache };
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

vi.mock("@/lib/db", () => ({ getDb: vi.fn(() => mockDb) }));

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
