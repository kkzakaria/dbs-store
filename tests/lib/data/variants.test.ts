import { describe, it, expect } from "vitest";
import type { ProductVariant } from "@/lib/db/schema";

describe("ProductVariant type", () => {
  it("has expected shape", () => {
    const v: ProductVariant = {
      id: "v1",
      product_id: "p1",
      color_name: "Noir",
      color_hex: "#000",
      stock: 5,
      price_override: null,
      sort_order: 0,
      created_at: new Date(),
    };
    expect(v.color_name).toBe("Noir");
  });
});
