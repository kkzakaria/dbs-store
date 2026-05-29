import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "@/lib/cart";
import { act } from "@testing-library/react";

beforeEach(() => {
  act(() => useCartStore.setState({ items: [] }));
});

const noVariantItem = {
  productId: "p1",
  variantId: null,
  slug: "iphone-16",
  name: "iPhone 16",
  price: 1_000_000,
  image: "/placeholder.svg",
  colorName: null,
  colorHex: null,
};

const variantItem = {
  productId: "p1",
  variantId: "v-noir",
  slug: "iphone-16",
  name: "iPhone 16",
  price: 1_000_000,
  image: "/placeholder.svg",
  colorName: "Noir",
  colorHex: "#000",
};

const variantItem2 = {
  productId: "p1",
  variantId: "v-blanc",
  slug: "iphone-16",
  name: "iPhone 16",
  price: 1_050_000,
  image: "/placeholder.svg",
  colorName: "Blanc",
  colorHex: "#fff",
};

describe("useCartStore — produit sans variante", () => {
  it("ajoute un item au panier vide", () => {
    act(() => useCartStore.getState().addItem(noVariantItem));
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(1);
  });

  it("incrémente la quantité sur doublon (même productId)", () => {
    act(() => {
      useCartStore.getState().addItem(noVariantItem);
      useCartStore.getState().addItem(noVariantItem);
    });
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it("supprime l'item via productId", () => {
    act(() => {
      useCartStore.getState().addItem(noVariantItem);
      useCartStore.getState().removeItem("p1");
    });
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("met à jour la quantité", () => {
    act(() => {
      useCartStore.getState().addItem(noVariantItem);
      useCartStore.getState().setQuantity("p1", 5);
    });
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it("supprime l'item quand la quantité est mise à 0", () => {
    act(() => {
      useCartStore.getState().addItem(noVariantItem);
      useCartStore.getState().setQuantity("p1", 0);
    });
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

describe("useCartStore — produit avec variantes", () => {
  it("ajoute deux couleurs comme deux lignes distinctes", () => {
    act(() => {
      useCartStore.getState().addItem(variantItem);
      useCartStore.getState().addItem(variantItem2);
    });
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it("incrémente la quantité sur doublon de variante", () => {
    act(() => {
      useCartStore.getState().addItem(variantItem);
      useCartStore.getState().addItem(variantItem);
    });
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it("stocke variantId, colorName, colorHex", () => {
    act(() => useCartStore.getState().addItem(variantItem));
    const item = useCartStore.getState().items[0];
    expect(item.variantId).toBe("v-noir");
    expect(item.colorName).toBe("Noir");
    expect(item.colorHex).toBe("#000");
  });

  it("supprime via variantId", () => {
    act(() => {
      useCartStore.getState().addItem(variantItem);
      useCartStore.getState().addItem(variantItem2);
      useCartStore.getState().removeItem("v-noir");
    });
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].variantId).toBe("v-blanc");
  });
});

describe("useCartStore — total et count", () => {
  it("calcule le total", () => {
    act(() => {
      useCartStore.getState().addItem(noVariantItem);
      useCartStore.getState().setQuantity("p1", 2);
    });
    expect(useCartStore.getState().total()).toBe(2_000_000);
  });

  it("calcule le count", () => {
    act(() => {
      useCartStore.getState().addItem(variantItem);
      useCartStore.getState().addItem(variantItem2);
    });
    expect(useCartStore.getState().count()).toBe(2);
  });

  it("vide le panier", () => {
    act(() => {
      useCartStore.getState().addItem(variantItem);
      useCartStore.getState().addItem(noVariantItem);
      useCartStore.getState().clear();
    });
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
