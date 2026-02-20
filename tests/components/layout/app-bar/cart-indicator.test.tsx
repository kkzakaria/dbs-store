import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "@testing-library/react";
import { CartIndicator } from "@/components/layout/app-bar/cart-indicator";
import { useCartStore } from "@/lib/cart";

beforeEach(() => {
  act(() => useCartStore.setState({ items: [] }));
});

describe("CartIndicator", () => {
  it("renders cart button", () => {
    render(<CartIndicator onClick={() => {}} />);
    expect(screen.getByRole("button", { name: /panier/i })).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<CartIndicator onClick={handleClick} />);
    fireEvent.click(screen.getByRole("button", { name: /panier/i }));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("shows badge when cart has items", () => {
    act(() =>
      useCartStore.getState().addItem({
        productId: "p1",
        slug: "iphone",
        name: "iPhone 16",
        price: 1_000_000,
        image: "/placeholder.svg",
      })
    );
    render(<CartIndicator onClick={() => {}} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("hides badge when cart is empty", () => {
    render(<CartIndicator onClick={() => {}} />);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
