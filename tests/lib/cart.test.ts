import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "@/lib/cart";
import { act } from "@testing-library/react";

// Reset store between tests
beforeEach(() => {
  act(() => useCartStore.setState({ items: [] }));
});

describe("useCartStore", () => {
  const item = {
    productId: "p1",
    slug: "iphone-16",
    name: "iPhone 16",
    price: 1_000_000,
    image: "/placeholder.svg",
  };

  it("adds item to empty cart", () => {
    act(() => useCartStore.getState().addItem(item));
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(1);
  });

  it("increments quantity on duplicate add", () => {
    act(() => {
      useCartStore.getState().addItem(item);
      useCartStore.getState().addItem(item);
    });
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it("removes item", () => {
    act(() => {
      useCartStore.getState().addItem(item);
      useCartStore.getState().removeItem("p1");
    });
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("updates quantity", () => {
    act(() => {
      useCartStore.getState().addItem(item);
      useCartStore.getState().setQuantity("p1", 5);
    });
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it("removes item when quantity set to 0", () => {
    act(() => {
      useCartStore.getState().addItem(item);
      useCartStore.getState().setQuantity("p1", 0);
    });
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("computes total", () => {
    act(() => {
      useCartStore.getState().addItem(item);
      useCartStore.getState().addItem({ ...item, productId: "p2", price: 500_000 });
    });
    expect(useCartStore.getState().total()).toBe(1_500_000);
  });

  it("computes count", () => {
    act(() => {
      useCartStore.getState().addItem(item);
      useCartStore.getState().setQuantity("p1", 3);
    });
    expect(useCartStore.getState().count()).toBe(3);
  });

  it("computes total accounting for quantity", () => {
    act(() => {
      useCartStore.getState().addItem(item);
      useCartStore.getState().setQuantity("p1", 3);
    });
    expect(useCartStore.getState().total()).toBe(3_000_000);
  });

  it("clear empties the cart", () => {
    act(() => {
      useCartStore.getState().addItem(item);
      useCartStore.getState().addItem({ ...item, productId: "p2", price: 500_000 });
      useCartStore.getState().clear();
    });
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.total()).toBe(0);
    expect(state.count()).toBe(0);
  });

  it("removes item when quantity set to a negative value", () => {
    act(() => {
      useCartStore.getState().addItem(item);
      useCartStore.getState().setQuantity("p1", -3);
    });
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
