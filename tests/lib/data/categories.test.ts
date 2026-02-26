import { describe, it, expect } from "vitest";
import { categories, getTopLevelCategories, getSubcategories } from "@/lib/data/categories";

describe("categories", () => {
  it("has 11 top-level categories", () => {
    const topLevel = getTopLevelCategories();
    expect(topLevel).toHaveLength(11);
  });

  it("top-level categories have no parent_id", () => {
    const topLevel = getTopLevelCategories();
    topLevel.forEach((cat) => {
      expect(cat.parent_id).toBeNull();
    });
  });

  it("smartphones has 6 subcategories", () => {
    const subs = getSubcategories("smartphones");
    expect(subs).toHaveLength(6);
  });

  it("offres has no subcategories", () => {
    const subs = getSubcategories("offres");
    expect(subs).toHaveLength(0);
  });

  it("support has no subcategories", () => {
    const subs = getSubcategories("support");
    expect(subs).toHaveLength(0);
  });

  it("categories are ordered", () => {
    const topLevel = getTopLevelCategories();
    const orders = topLevel.map((c) => c.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("returns empty array for unknown category", () => {
    const subs = getSubcategories("nonexistent");
    expect(subs).toEqual([]);
  });
});
