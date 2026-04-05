import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDb = {
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockResolvedValue([]),
  limit: vi.fn().mockResolvedValue([]),
};

vi.mock("@/lib/db", () => ({ getDb: vi.fn(() => mockDb) }));
const mockAuthApi = { getSession: vi.fn(), listOrganizations: vi.fn() };
vi.mock("@/lib/auth", () => ({
  getAuth: vi.fn(() => Promise.resolve({ api: mockAuthApi })),
}));
vi.mock("next/headers", () => ({ headers: vi.fn(() => new Headers()) }));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn((_tag: string, _profile: string) => {}),
  unstable_cache: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
}));

import { ORG_SLUG } from "@/lib/constants";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/actions/admin-categories";
import type { CategoryFormData } from "@/lib/actions/admin-categories";

const validData: CategoryFormData = {
  name: "Smartphones",
  slug: "smartphones",
  icon: "smartphone",
  image: null,
  parent_id: null,
  order: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthApi.getSession.mockResolvedValue({ user: { id: "u1" } });
  mockAuthApi.listOrganizations.mockResolvedValue([{ slug: ORG_SLUG }]);
  mockDb.insert.mockReturnThis();
  mockDb.update.mockReturnThis();
  mockDb.delete.mockReturnThis();
  mockDb.select.mockReturnThis();
  mockDb.from.mockReturnThis();
  mockDb.values.mockResolvedValue(undefined);
  mockDb.set.mockReturnThis();
  mockDb.where.mockReturnThis();
  mockDb.orderBy.mockResolvedValue([]);
  mockDb.limit.mockResolvedValue([]);
});

describe("createCategory", () => {
  it("rejette un nom vide", async () => {
    const result = await createCategory({ ...validData, name: "" });
    expect(result.error).toBe("Le nom est requis");
  });

  it("rejette un slug vide", async () => {
    const result = await createCategory({ ...validData, slug: "" });
    expect(result.error).toBe("Le slug est requis");
  });

  it("rejette une icône vide", async () => {
    // @ts-expect-error testing invalid icon
    const result = await createCategory({ ...validData, icon: "" });
    expect(result.error).toBe("L'icône est requise");
  });

  it("rejette une icône invalide", async () => {
    // @ts-expect-error testing invalid icon
    const result = await createCategory({ ...validData, icon: "invalid-icon" });
    expect(result.error).toBe("Icône invalide");
  });

  it("rejette un slug avec des caractères invalides", async () => {
    const result = await createCategory({ ...validData, slug: "Hello World!" });
    expect(result.error).toMatch(/slug/i);
  });

  it("rejette un parent_id inexistant", async () => {
    // getCategoryById returns null (via select().from().where().limit())
    mockDb.limit.mockResolvedValueOnce([]);
    const result = await createCategory({ ...validData, parent_id: "nonexistent" });
    expect(result.error).toBe("La catégorie parente n'existe pas");
  });

  it("insère une catégorie valide", async () => {
    const result = await createCategory(validData);
    expect(result.error).toBeUndefined();
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockDb.values).toHaveBeenCalled();
  });

  it("retourne une erreur spécifique pour slug dupliqué", async () => {
    mockDb.values.mockRejectedValueOnce(new Error("UNIQUE constraint failed: categories.slug"));
    const result = await createCategory(validData);
    expect(result.error).toMatch(/slug.*utilisé/i);
  });

  it("retourne une erreur générique pour autres erreurs DB", async () => {
    mockDb.values.mockRejectedValueOnce(new Error("D1 connection timeout"));
    const result = await createCategory(validData);
    expect(result.error).toBe("Erreur lors de la création");
  });
});

describe("updateCategory", () => {
  it("rejette un nom vide", async () => {
    const result = await updateCategory("smartphones", {
      ...validData,
      name: "",
    });
    expect(result.error).toBe("Le nom est requis");
  });

  it("rejette un parent_id auto-référent", async () => {
    const result = await updateCategory("smartphones", {
      ...validData,
      parent_id: "smartphones",
    });
    expect(result.error).toBe(
      "Une catégorie ne peut pas être son propre parent"
    );
  });

  it("rejette un parent_id inexistant", async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    const result = await updateCategory("smartphones", {
      ...validData,
      parent_id: "nonexistent",
    });
    expect(result.error).toBe("La catégorie parente n'existe pas");
  });

  it("met à jour une catégorie valide", async () => {
    mockDb.where.mockResolvedValue(undefined);
    const result = await updateCategory("smartphones", validData);
    expect(result.error).toBeUndefined();
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalled();
  });

  it("retourne une erreur spécifique pour slug dupliqué", async () => {
    mockDb.where.mockRejectedValueOnce(new Error("UNIQUE constraint failed: categories.slug"));
    const result = await updateCategory("smartphones", validData);
    expect(result.error).toMatch(/slug.*utilisé/i);
  });
});

describe("deleteCategory", () => {
  it("bloque si la catégorie a des enfants", async () => {
    mockDb.orderBy.mockResolvedValue([{ id: "child1", name: "Child" }]);
    const result = await deleteCategory("smartphones");
    expect(result.error).toBe("Supprimez d'abord les sous-catégories");
  });

  it("bloque si des produits utilisent la catégorie", async () => {
    mockDb.orderBy.mockResolvedValue([]);
    mockDb.limit.mockResolvedValue([{ id: "p1", name: "iPhone" }]);
    const result = await deleteCategory("smartphones");
    expect(result.error).toBe("Des produits utilisent cette catégorie");
  });

  it("supprime quand pas d'enfants ni de produits", async () => {
    mockDb.orderBy.mockResolvedValue([]);
    mockDb.limit.mockResolvedValue([]);
    const result = await deleteCategory("smartphones");
    expect(result.error).toBeUndefined();
    expect(mockDb.delete).toHaveBeenCalled();
  });

  it("retourne une erreur si la suppression échoue", async () => {
    mockDb.orderBy.mockResolvedValue([]);
    mockDb.limit.mockResolvedValue([]);
    mockDb.where.mockRejectedValueOnce(new Error("D1 error"));
    const result = await deleteCategory("smartphones");
    expect(result.error).toBe("Erreur lors de la suppression");
  });
});
