import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDbStore: Record<string, unknown[]> = {};
const mockDb = {
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@/lib/db", () => ({ getDb: vi.fn(() => mockDb) }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn(), listOrganizations: vi.fn() } },
}));
vi.mock("next/headers", () => ({ headers: vi.fn(() => new Headers()) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/lib/auth";
import { validateProductData } from "@/lib/actions/product-validation";
import type { ProductFormData } from "@/lib/actions/product-validation";

const validData: ProductFormData = {
  name: "iPhone 15",
  slug: "iphone-15",
  category_id: "smartphones",
  price: 850000,
  brand: "Apple",
  stock: 10,
  description: "Super téléphone Apple",
  images: ["https://cdn.dbs-store.ci/img.jpg"],
  specs: { Stockage: "256 Go" },
};

describe("validateProductData", () => {
  it("accepte des données valides", () => {
    expect(validateProductData(validData).success).toBe(true);
  });

  it("rejette un prix négatif", () => {
    const result = validateProductData({ ...validData, price: -1 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/prix/i);
  });

  it("rejette un nom vide", () => {
    const result = validateProductData({ ...validData, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejette un slug vide", () => {
    const result = validateProductData({ ...validData, slug: "" });
    expect(result.success).toBe(false);
  });

  it("rejette un stock négatif", () => {
    const result = validateProductData({ ...validData, stock: -5 });
    expect(result.success).toBe(false);
  });

  it("rejette une marque vide", () => {
    const result = validateProductData({ ...validData, brand: "" });
    expect(result.success).toBe(false);
  });
});
