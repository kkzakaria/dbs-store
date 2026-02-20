import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));

import { buildOrder } from "@/lib/actions/orders";

describe("buildOrder", () => {
  it("calculates correct totals for COD", () => {
    const items = [
      { productId: "p1", name: "A", slug: "a", price: 100_000, image: "/a.svg", quantity: 2 },
      { productId: "p2", name: "B", slug: "b", price: 50_000, image: "/b.svg", quantity: 1 },
    ];
    const result = buildOrder(items, "cod");
    expect(result.subtotal).toBe(250_000);
    expect(result.shipping_fee).toBe(0);
    expect(result.total).toBe(250_000);
  });

  it("computes subtotal correctly with quantities > 1", () => {
    const items = [
      { productId: "p1", name: "A", slug: "a", price: 500_000, image: "/a.svg", quantity: 3 },
    ];
    const result = buildOrder(items, "cod");
    expect(result.subtotal).toBe(1_500_000);
    expect(result.total).toBe(1_500_000);
  });

  it("handles single item with quantity 1", () => {
    const items = [
      { productId: "p1", name: "A", slug: "a", price: 75_000, image: "/a.svg", quantity: 1 },
    ];
    const result = buildOrder(items, "cod");
    expect(result.subtotal).toBe(75_000);
    expect(result.shipping_fee).toBe(0);
    expect(result.total).toBe(75_000);
  });
});
