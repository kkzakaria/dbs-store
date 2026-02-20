import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "@testing-library/react";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { useCartStore } from "@/lib/cart";

beforeEach(() => {
  act(() => useCartStore.setState({ items: [] }));
});

const inStockProduct = {
  id: "p1",
  slug: "iphone-16",
  name: "iPhone 16",
  price: 1_000_000,
  images: ["/placeholder.svg"],
  stock: 5,
  category_id: "smartphones",
  subcategory_id: null,
  old_price: null,
  brand: "Apple",
  description: "Top.",
  specs: {},
  badge: null,
  is_active: true,
  created_at: new Date(),
} as const;

describe("AddToCartButton", () => {
  it("renders 'Ajouter au panier' when in stock", () => {
    render(<AddToCartButton product={inStockProduct} />);
    expect(screen.getByRole("button", { name: /ajouter au panier/i })).toBeInTheDocument();
  });

  it("is enabled when in stock", () => {
    render(<AddToCartButton product={inStockProduct} />);
    expect(screen.getByRole("button", { name: /ajouter au panier/i })).not.toBeDisabled();
  });

  it("renders 'Rupture de stock' and is disabled when stock is 0", () => {
    render(<AddToCartButton product={{ ...inStockProduct, stock: 0 }} />);
    const btn = screen.getByRole("button", { name: /rupture de stock/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled();
  });

  it("adds item to cart on click", () => {
    render(<AddToCartButton product={inStockProduct} />);
    fireEvent.click(screen.getByRole("button", { name: /ajouter au panier/i }));
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe("p1");
    expect(items[0].price).toBe(1_000_000);
    expect(items[0].quantity).toBe(1);
  });

  it("uses placeholder image when product has no images", () => {
    render(<AddToCartButton product={{ ...inStockProduct, images: [] }} />);
    fireEvent.click(screen.getByRole("button", { name: /ajouter au panier/i }));
    expect(useCartStore.getState().items[0].image).toBe("/images/products/placeholder.svg");
  });
});
