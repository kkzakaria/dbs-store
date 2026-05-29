import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "@testing-library/react";
import { ProductActions } from "@/components/products/product-actions";
import { useCartStore } from "@/lib/cart";
import type { Product, ProductVariant } from "@/lib/db/schema";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

beforeEach(() => {
  act(() => useCartStore.setState({ items: [] }));
});

function makeVariant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: "v1",
    product_id: "p1",
    color_name: "Noir",
    color_hex: "#000",
    stock: 5,
    price_override: null,
    sort_order: 0,
    created_at: new Date(),
    ...overrides,
  };
}

const baseProduct: Product = {
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

describe("ProductActions — sans variante", () => {
  it("affiche le bouton sans swatches", () => {
    render(<ProductActions product={baseProduct} />);
    expect(screen.getByRole("button", { name: /ajouter au panier/i })).toBeInTheDocument();
    expect(screen.queryByLabelText("Noir")).not.toBeInTheDocument();
  });
});

describe("ProductActions — avec variantes", () => {
  const variants = [
    makeVariant({ id: "v1", color_name: "Noir", color_hex: "#000", stock: 5 }),
    makeVariant({ id: "v2", color_name: "Blanc", color_hex: "#fff", stock: 3 }),
  ];
  const productWithVariants = { ...baseProduct, variants };

  it("affiche les swatches pour chaque variante", () => {
    render(<ProductActions product={productWithVariants} />);
    expect(screen.getByRole("button", { name: "Noir" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Blanc" })).toBeInTheDocument();
  });

  it("swatch désactivée quand stock = 0", () => {
    const outOfStock = { ...productWithVariants, variants: [
      makeVariant({ id: "v1", color_name: "Noir", stock: 0 }),
    ]};
    render(<ProductActions product={outOfStock} />);
    expect(screen.getByRole("button", { name: "Noir" })).toBeDisabled();
  });

  it("ajoute la bonne variante au panier", () => {
    render(<ProductActions product={productWithVariants} />);
    fireEvent.click(screen.getByRole("button", { name: "Blanc" }));
    fireEvent.click(screen.getByRole("button", { name: /ajouter au panier/i }));
    const item = useCartStore.getState().items[0];
    expect(item.variantId).toBe("v2");
    expect(item.colorName).toBe("Blanc");
  });

  it("affiche le price_override quand défini", () => {
    const withOverride = { ...productWithVariants, variants: [
      makeVariant({ id: "v1", color_name: "Noir", price_override: 950_000 }),
    ]};
    render(<ProductActions product={withOverride} />);
    expect(screen.getByText(/950 000/)).toBeInTheDocument();
  });

  it("affiche rupture quand toutes les variantes sont épuisées", () => {
    const allOOS = { ...productWithVariants, variants: [
      makeVariant({ id: "v1", color_name: "Noir", stock: 0 }),
      makeVariant({ id: "v2", color_name: "Blanc", color_hex: "#fff", stock: 0 }),
    ]};
    render(<ProductActions product={allOOS} />);
    expect(screen.getByRole("button", { name: /rupture/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Noir" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Blanc" })).toBeDisabled();
  });
});
