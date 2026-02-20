import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { useCartStore } from "@/lib/cart";
import { act } from "@testing-library/react";

beforeEach(() => {
  act(() => useCartStore.setState({ items: [] }));
});

describe("CartDrawer", () => {
  it("shows empty state when cart is empty", () => {
    render(<CartDrawer open onOpenChange={() => {}} />);
    expect(screen.getByText(/panier est vide/i)).toBeInTheDocument();
  });

  it("displays cart items", () => {
    act(() =>
      useCartStore.getState().addItem({
        productId: "p1",
        slug: "iphone",
        name: "iPhone 16",
        price: 1_000_000,
        image: "/placeholder.svg",
      })
    );
    render(<CartDrawer open onOpenChange={() => {}} />);
    expect(screen.getByText("iPhone 16")).toBeInTheDocument();
    // price appears both on item row and in subtotal
    expect(screen.getAllByText(/1 000 000 FCFA/).length).toBe(2);
  });

  it("calls onOpenChange(false) when 'Continuer les achats' clicked on empty state", () => {
    const onOpenChange = vi.fn();
    render(<CartDrawer open onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: /continuer les achats/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) when 'Continuer les achats' clicked on filled cart footer", () => {
    act(() =>
      useCartStore.getState().addItem({
        productId: "p1",
        slug: "iphone",
        name: "iPhone 16",
        price: 1_000_000,
        image: "/placeholder.svg",
      })
    );
    const onOpenChange = vi.fn();
    render(<CartDrawer open onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: /continuer les achats/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("removes item on click delete", () => {
    act(() =>
      useCartStore.getState().addItem({
        productId: "p1",
        slug: "iphone",
        name: "iPhone 16",
        price: 1_000_000,
        image: "/placeholder.svg",
      })
    );
    render(<CartDrawer open onOpenChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /supprimer/i }));
    expect(screen.getByText(/panier est vide/i)).toBeInTheDocument();
  });
});
