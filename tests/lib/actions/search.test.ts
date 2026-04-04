// tests/lib/actions/search.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock getDb to return a fake db
const mockSearchProducts = vi.fn();
const mockSuggestProducts = vi.fn();

vi.mock("@/lib/data/products", () => ({
  searchProducts: (...args: unknown[]) => mockSearchProducts(...args),
  suggestProducts: (...args: unknown[]) => mockSuggestProducts(...args),
}));

vi.mock("@/lib/db", () => ({
  getDb: vi.fn().mockResolvedValue("mock-db"),
}));

// Import after mocks
const { searchSuggestions, loadMoreSearchResults } = await import(
  "@/lib/actions/search"
);

beforeEach(() => {
  mockSearchProducts.mockReset();
  mockSuggestProducts.mockReset();
});

describe("searchSuggestions", () => {
  it("returns empty array when query is shorter than 3 characters", async () => {
    const result = await searchSuggestions("ab");
    expect(result).toEqual([]);
    expect(mockSuggestProducts).not.toHaveBeenCalled();
  });

  it("calls suggestProducts with db and query when query >= 3 chars", async () => {
    mockSuggestProducts.mockResolvedValue([{ id: "1", name: "iPhone" }]);
    const result = await searchSuggestions("iph");
    expect(mockSuggestProducts).toHaveBeenCalledWith("mock-db", "iph");
    expect(result).toEqual([{ id: "1", name: "iPhone" }]);
  });

  it("returns empty array for empty string", async () => {
    const result = await searchSuggestions("");
    expect(result).toEqual([]);
  });

  it("returns empty array when query exceeds 200 characters", async () => {
    const result = await searchSuggestions("a".repeat(201));
    expect(result).toEqual([]);
    expect(mockSuggestProducts).not.toHaveBeenCalled();
  });

  it("returns empty array when suggestProducts throws", async () => {
    mockSuggestProducts.mockRejectedValue(new Error("DB down"));
    const result = await searchSuggestions("iphone");
    expect(result).toEqual([]);
  });
});

describe("loadMoreSearchResults", () => {
  it("calls searchProducts with correct arguments", async () => {
    mockSearchProducts.mockResolvedValue({
      products: [],
      hasMore: false,
      total: 0,
    });
    const filters = { brand: "Apple" };
    await loadMoreSearchResults("iphone", filters, 12);
    expect(mockSearchProducts).toHaveBeenCalledWith("mock-db", "iphone", filters, 12, 12);
  });

  it("returns products and hasMore from searchProducts", async () => {
    mockSearchProducts.mockResolvedValue({
      products: [{ id: "1" }],
      hasMore: true,
      total: 25,
    });
    const result = await loadMoreSearchResults("iphone", {}, 0);
    expect(result.products).toEqual([{ id: "1" }]);
    expect(result.hasMore).toBe(true);
  });

  it("returns empty for query exceeding 200 characters", async () => {
    const result = await loadMoreSearchResults("a".repeat(201), {}, 0);
    expect(result).toEqual({ products: [], hasMore: false });
    expect(mockSearchProducts).not.toHaveBeenCalled();
  });

  it("returns empty for negative offset", async () => {
    const result = await loadMoreSearchResults("iphone", {}, -1);
    expect(result).toEqual({ products: [], hasMore: false });
    expect(mockSearchProducts).not.toHaveBeenCalled();
  });

  it("returns empty for non-integer offset", async () => {
    const result = await loadMoreSearchResults("iphone", {}, 1.5);
    expect(result).toEqual({ products: [], hasMore: false });
    expect(mockSearchProducts).not.toHaveBeenCalled();
  });

  it("returns empty for empty query", async () => {
    const result = await loadMoreSearchResults("", {}, 0);
    expect(result).toEqual({ products: [], hasMore: false });
    expect(mockSearchProducts).not.toHaveBeenCalled();
  });

  it("returns empty when searchProducts throws", async () => {
    mockSearchProducts.mockRejectedValue(new Error("DB down"));
    const result = await loadMoreSearchResults("iphone", {}, 0);
    expect(result).toEqual({ products: [], hasMore: false });
  });

  it("sanitizes invalid filter values", async () => {
    mockSearchProducts.mockResolvedValue({ products: [], hasMore: false, total: 0 });
    await loadMoreSearchResults("iphone", { prix_min: -100, tri: "invalid" as any } as any, 0);
    const calledFilters = mockSearchProducts.mock.calls[0][2];
    expect(calledFilters.prix_min).toBeUndefined();
    expect(calledFilters.tri).toBeUndefined();
  });
});
