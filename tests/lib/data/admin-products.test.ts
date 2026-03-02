import { describe, it, expect } from "vitest";
import { buildProductFiltersForAdmin, PAGE_SIZE } from "@/lib/data/admin-products";

describe("admin products data", () => {
  it("exporte PAGE_SIZE = 25", () => {
    expect(PAGE_SIZE).toBe(25);
  });

  it("buildProductFiltersForAdmin sans filtres retourne undefined", () => {
    const result = buildProductFiltersForAdmin({});
    expect(result).toBeUndefined();
  });

  it("buildProductFiltersForAdmin avec category_id retourne une condition non-undefined", () => {
    const result = buildProductFiltersForAdmin({ category_id: "smartphones" });
    expect(result).toBeDefined();
  });

  it("buildProductFiltersForAdmin avec search retourne une condition non-undefined", () => {
    const result = buildProductFiltersForAdmin({ search: "iPhone" });
    expect(result).toBeDefined();
  });
});
