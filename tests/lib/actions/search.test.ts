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
});
