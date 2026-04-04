// tests/components/search/search-load-more.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchLoadMore } from "@/components/search/search-load-more";
import type { Product } from "@/lib/db/schema";

const mockLoadMore = vi.fn();

vi.mock("@/lib/actions/search", () => ({
  loadMoreSearchResults: (...args: unknown[]) => mockLoadMore(...args),
}));

// Mock ProductCard to avoid cart store dependency
vi.mock("@/components/products/product-card", () => ({
  ProductCard: ({ product }: { product: Product }) => (
    <div data-testid={`product-${product.id}`}>{product.name}</div>
  ),
}));

const makeProduct = (id: string, name: string): Product => ({
  id,
  name,
  slug: id,
  category_id: "smartphones",
  subcategory_id: null,
  price: 500000,
  old_price: null,
  brand: "Apple",
  images: ["/placeholder.svg"],
  description: "Test",
  specs: {},
  stock: 5,
  badge: null,
  is_active: true,
  created_at: new Date("2026-01-01"),
});

beforeEach(() => {
  mockLoadMore.mockReset();
});

describe("SearchLoadMore", () => {
  it("renders initial products", () => {
    render(
      <SearchLoadMore
        initialProducts={[makeProduct("1", "iPhone 16")]}
        initialHasMore={false}
        query="iphone"
        filters={{}}
      />
    );
    expect(screen.getByText("iPhone 16")).toBeInTheDocument();
  });

  it("shows load more button when hasMore is true", () => {
    render(
      <SearchLoadMore
        initialProducts={[makeProduct("1", "iPhone 16")]}
        initialHasMore={true}
        query="iphone"
        filters={{}}
      />
    );
    expect(screen.getByRole("button", { name: /charger plus/i })).toBeInTheDocument();
  });

  it("hides load more button when hasMore is false", () => {
    render(
      <SearchLoadMore
        initialProducts={[makeProduct("1", "iPhone 16")]}
        initialHasMore={false}
        query="iphone"
        filters={{}}
      />
    );
    expect(screen.queryByRole("button", { name: /charger plus/i })).not.toBeInTheDocument();
  });

  it("fetches and appends more products on click", async () => {
    const newProduct = makeProduct("2", "iPhone 15");
    mockLoadMore.mockResolvedValue({ products: [newProduct], hasMore: false });

    render(
      <SearchLoadMore
        initialProducts={[makeProduct("1", "iPhone 16")]}
        initialHasMore={true}
        query="iphone"
        filters={{}}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /charger plus/i }));

    await waitFor(() => {
      expect(screen.getByText("iPhone 15")).toBeInTheDocument();
    });
    expect(screen.getByText("iPhone 16")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /charger plus/i })).not.toBeInTheDocument();
  });

  it("calls loadMoreSearchResults with correct offset", async () => {
    mockLoadMore.mockResolvedValue({ products: [], hasMore: false });

    render(
      <SearchLoadMore
        initialProducts={Array.from({ length: 12 }, (_, i) => makeProduct(`p${i}`, `P ${i}`))}
        initialHasMore={true}
        query="phone"
        filters={{ brand: "Apple" }}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /charger plus/i }));

    await waitFor(() => {
      expect(mockLoadMore).toHaveBeenCalledWith("phone", { brand: "Apple" }, 12);
    });
  });
});
