// tests/components/products/product-card.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "@testing-library/react";
import { ProductCard } from "@/components/products/product-card";
import { useCartStore } from "@/lib/cart";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const BASE = {
  id: "iphone-16-pro",
  name: "iPhone 16 Pro",
  slug: "iphone-16-pro",
  category_id: "smartphones",
  subcategory_id: "iphone",
  price: 899000,
  old_price: null,
  brand: "Apple",
  images: ["/placeholder.svg"],
  description: "Top.",
  specs: {},
  stock: 5,
  badge: "Nouveau" as const,
  is_active: true,
  created_at: new Date(),
};

beforeEach(() => {
  act(() => useCartStore.setState({ items: [] }));
});

describe("ProductCard", () => {
  it("affiche le nom et le prix du produit", () => {
    render(<ProductCard product={BASE} />);
    expect(screen.getByText("iPhone 16 Pro")).toBeInTheDocument();
    expect(screen.getByText(/899 000/)).toBeInTheDocument();
  });

  it("affiche le badge quand présent", () => {
    render(<ProductCard product={BASE} />);
    expect(screen.getByText("Nouveau")).toBeInTheDocument();
  });

  it("n'affiche pas de badge quand null", () => {
    render(<ProductCard product={{ ...BASE, badge: null }} />);
    expect(screen.queryByText("Nouveau")).not.toBeInTheDocument();
  });

  it("affiche l'ancien prix et la réduction quand en promo", () => {
    render(<ProductCard product={{ ...BASE, old_price: 999000 }} />);
    expect(screen.getByText(/999 000/)).toBeInTheDocument();
    expect(screen.getByText(/-\d+%/)).toBeInTheDocument();
  });

  it("affiche 'Rupture de stock' quand stock = 0", () => {
    render(<ProductCard product={{ ...BASE, stock: 0 }} />);
    expect(screen.getByText(/rupture de stock/i)).toBeInTheDocument();
  });

  it("pointe vers la page détail produit", () => {
    render(<ProductCard product={BASE} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/produits/iphone-16-pro");
  });

  it("ajoute au panier en cliquant sur le bouton", () => {
    render(<ProductCard product={BASE} />);
    fireEvent.click(screen.getByRole("button", { name: /ajouter au panier/i }));
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].productId).toBe("iphone-16-pro");
  });

  it("n'affiche pas de bouton panier quand rupture de stock", () => {
    render(<ProductCard product={{ ...BASE, stock: 0 }} />);
    expect(screen.queryByRole("button", { name: /ajouter au panier/i })).not.toBeInTheDocument();
  });
});
