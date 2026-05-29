import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "@testing-library/react";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { useCartStore } from "@/lib/cart";
import type { ProductVariant } from "@/lib/db/schema";

beforeEach(() => {
  act(() => useCartStore.setState({ items: [] }));
});

const baseProduct = {
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
  rating: null,
  reviews: 0,
  colors: [],
  variants: [],
  is_active: true,
  created_at: new Date(),
};

const makeVariant = (overrides: Partial<ProductVariant> = {}): ProductVariant => ({
  id: "v1",
  product_id: "p1",
  color_name: "Noir",
  color_hex: "#000",
  stock: 5,
  price_override: null,
  sort_order: 0,
  created_at: new Date(),
  ...overrides,
});

describe("AddToCartButton — sans variante", () => {
  it("affiche 'Ajouter au panier' quand en stock", () => {
    render(<AddToCartButton product={baseProduct} variant={null} />);
    expect(screen.getByRole("button", { name: /ajouter au panier/i })).toBeInTheDocument();
  });

  it("est désactivé quand stock = 0", () => {
    render(<AddToCartButton product={{ ...baseProduct, stock: 0 }} variant={null} />);
    expect(screen.getByRole("button", { name: /rupture/i })).toBeDisabled();
  });

  it("ajoute l'item sans variantId au panier", () => {
    render(<AddToCartButton product={baseProduct} variant={null} />);
    fireEvent.click(screen.getByRole("button", { name: /ajouter/i }));
    const item = useCartStore.getState().items[0];
    expect(item.productId).toBe("p1");
    expect(item.variantId).toBeNull();
    expect(item.colorName).toBeNull();
  });

  it("utilise l'image placeholder quand pas d'images", () => {
    render(<AddToCartButton product={{ ...baseProduct, images: [] }} variant={null} />);
    fireEvent.click(screen.getByRole("button", { name: /ajouter/i }));
    expect(useCartStore.getState().items[0].image).toBe("/images/products/placeholder.svg");
  });
});

describe("AddToCartButton — avec variante", () => {
  it("est désactivé quand stock de la variante = 0", () => {
    render(<AddToCartButton product={baseProduct} variant={makeVariant({ stock: 0 })} />);
    expect(screen.getByRole("button", { name: /rupture/i })).toBeDisabled();
  });

  it("ajoute avec variantId et colorName", () => {
    render(<AddToCartButton product={baseProduct} variant={makeVariant()} />);
    fireEvent.click(screen.getByRole("button", { name: /ajouter/i }));
    const item = useCartStore.getState().items[0];
    expect(item.variantId).toBe("v1");
    expect(item.colorName).toBe("Noir");
    expect(item.colorHex).toBe("#000");
  });

  it("utilise price_override quand défini", () => {
    render(<AddToCartButton product={baseProduct} variant={makeVariant({ price_override: 950_000 })} />);
    fireEvent.click(screen.getByRole("button", { name: /ajouter/i }));
    expect(useCartStore.getState().items[0].price).toBe(950_000);
  });

  it("utilise le prix produit quand price_override est null", () => {
    render(<AddToCartButton product={baseProduct} variant={makeVariant({ price_override: null })} />);
    fireEvent.click(screen.getByRole("button", { name: /ajouter/i }));
    expect(useCartStore.getState().items[0].price).toBe(1_000_000);
  });
});
