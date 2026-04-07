// tests/app/offres-page.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import OffresPage from "@/app/(main)/offres/page";
import type { Product } from "@/lib/db/schema";

vi.mock("@/lib/db", () => ({
  getDb: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/data/products", () => ({
  getPromoProductsFiltered: vi.fn(),
}));

vi.mock("@/lib/data/categories", () => ({
  getCachedTopLevelCategories: vi.fn(),
  getCachedCategoryBySlug: vi.fn(),
}));

vi.mock("@/components/promo/promo-filters", () => ({
  PromoFilters: () => <div data-testid="promo-filters" />,
}));

vi.mock("@/components/products/product-card", () => ({
  ProductCard: ({ product }: { product: Product }) => <div data-testid="product-card">{product.name}</div>,
}));

import { getPromoProductsFiltered } from "@/lib/data/products";
import { getCachedTopLevelCategories, getCachedCategoryBySlug } from "@/lib/data/categories";

const PRODUCT: Product = {
  id: "p1",
  name: "Promo A",
  slug: "promo-a",
  category_id: "smartphones",
  subcategory_id: "iphone",
  price: 80000,
  old_price: 100000,
  brand: "Apple",
  images: ["/x.svg"],
  description: "x",
  specs: {},
  stock: 5,
  badge: null,
  is_active: true,
  created_at: new Date(),
};

beforeEach(() => {
  vi.mocked(getCachedTopLevelCategories).mockResolvedValue([
     
    { id: "smartphones", slug: "smartphones", name: "Smartphones", parent_id: null } as any,
  ]);
  vi.mocked(getCachedCategoryBySlug).mockResolvedValue(null);
});

describe("OffresPage", () => {
  it("renders promo products and count", async () => {
    vi.mocked(getPromoProductsFiltered).mockResolvedValue([PRODUCT]);
    const ui = await OffresPage({ searchParams: Promise.resolve({}) });
    render(ui);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Offres/i);
    expect(screen.getByText(/1 produit/i)).toBeInTheDocument();
    expect(screen.getByTestId("product-card")).toHaveTextContent("Promo A");
  });

  it("renders empty state when no promos", async () => {
    vi.mocked(getPromoProductsFiltered).mockResolvedValue([]);
    const ui = await OffresPage({ searchParams: Promise.resolve({}) });
    render(ui);
    expect(screen.getByText(/Aucune promotion/i)).toBeInTheDocument();
  });

  it("resolves category slug to id when categorie param is set", async () => {
     
    vi.mocked(getCachedCategoryBySlug).mockResolvedValue({ id: "smartphones", slug: "smartphones" } as any);
    vi.mocked(getPromoProductsFiltered).mockResolvedValue([PRODUCT]);
    await OffresPage({ searchParams: Promise.resolve({ categorie: "smartphones" }) });
    expect(getCachedCategoryBySlug).toHaveBeenCalledWith("smartphones");
    expect(getPromoProductsFiltered).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ category_id: "smartphones" })
    );
  });
});
