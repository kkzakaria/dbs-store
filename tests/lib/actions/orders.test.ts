import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));

import { buildOrder, validateVariantStock } from "@/lib/order-utils";

describe("buildOrder", () => {
  it("calculates correct totals for COD", () => {
    const items = [
      { productId: "p1", variantId: null, name: "A", slug: "a", price: 100_000, image: "/a.svg", colorName: null, colorHex: null, quantity: 2 },
      { productId: "p2", variantId: null, name: "B", slug: "b", price: 50_000, image: "/b.svg", colorName: null, colorHex: null, quantity: 1 },
    ];
    const result = buildOrder(items, "cod");
    expect(result.subtotal).toBe(250_000);
    expect(result.shipping_fee).toBe(0);
    expect(result.total).toBe(250_000);
  });

  it("computes subtotal correctly with quantities > 1", () => {
    const items = [
      { productId: "p1", variantId: null, name: "A", slug: "a", price: 500_000, image: "/a.svg", colorName: null, colorHex: null, quantity: 3 },
    ];
    const result = buildOrder(items, "cod");
    expect(result.subtotal).toBe(1_500_000);
    expect(result.total).toBe(1_500_000);
  });

  it("handles single item with quantity 1", () => {
    const items = [
      { productId: "p1", variantId: null, name: "A", slug: "a", price: 75_000, image: "/a.svg", colorName: null, colorHex: null, quantity: 1 },
    ];
    const result = buildOrder(items, "cod");
    expect(result.subtotal).toBe(75_000);
    expect(result.shipping_fee).toBe(0);
    expect(result.total).toBe(75_000);
  });

  it("returns zero totals for empty items array", () => {
    const result = buildOrder([], "cod");
    expect(result.subtotal).toBe(0);
    expect(result.shipping_fee).toBe(0);
    expect(result.total).toBe(0);
  });

  it("forwards the paymentMethod in its result", () => {
    const items = [
      { productId: "p1", variantId: null, name: "A", slug: "a", price: 10_000, image: "/a.svg", colorName: null, colorHex: null, quantity: 1 },
    ];
    expect(buildOrder(items, "cod").paymentMethod).toBe("cod");
  });
});

describe("validateVariantStock", () => {
  it("ne lève pas d'erreur si stock suffisant", () => {
    expect(() =>
      validateVariantStock(
        [{ variantId: "v1", productId: "p1", quantity: 2 }],
        new Map([["v1", { stock: 5, product_id: "p1" }]])
      )
    ).not.toThrow();
  });

  it("lève STOCK_INSUFFICIENT si stock insuffisant", () => {
    expect(() =>
      validateVariantStock(
        [{ variantId: "v1", productId: "p1", quantity: 3 }],
        new Map([["v1", { stock: 2, product_id: "p1" }]])
      )
    ).toThrow("STOCK_INSUFFICIENT:v1");
  });

  it("lève VARIANT_NOT_FOUND si la variante n'existe pas en DB", () => {
    expect(() =>
      validateVariantStock(
        [{ variantId: "v-unknown", productId: "p1", quantity: 1 }],
        new Map()
      )
    ).toThrow("VARIANT_NOT_FOUND:v-unknown");
  });

  it("ignore les items sans variantId", () => {
    expect(() =>
      validateVariantStock(
        [{ variantId: null, productId: "p1", quantity: 5 }],
        new Map()
      )
    ).not.toThrow();
  });

  it("lève VARIANT_PRODUCT_MISMATCH si la variante appartient à un autre produit", () => {
    expect(() =>
      validateVariantStock(
        [{ variantId: "v-cheap", productId: "p-expensive", quantity: 1 }],
        new Map([["v-cheap", { stock: 10, product_id: "p-cheap" }]])
      )
    ).toThrow("VARIANT_PRODUCT_MISMATCH:v-cheap");
  });
});
