import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/admin/categories",
}));

vi.mock("@/lib/actions/admin-categories", () => ({
  createCategory: vi.fn().mockResolvedValue({}),
  updateCategory: vi.fn().mockResolvedValue({}),
  deleteCategory: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/components/admin/image-uploader", () => ({
  ImageUploader: () => <div data-testid="image-uploader" />,
}));

vi.mock("@/lib/actions/admin-upload", () => ({
  generatePresignedUrl: vi.fn(),
}));

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryFormDialog } from "@/components/admin/category-form-dialog";
import type { Category } from "@/lib/db/schema";

const now = new Date();

function cat(
  overrides: Partial<Category> & { id: string; name: string }
): Category {
  return {
    slug: overrides.id,
    icon: "box",
    image: null,
    parent_id: null,
    order: 0,
    created_at: now,
    ...overrides,
  };
}

const topLevelCategories = [
  cat({ id: "smartphones", name: "Smartphones", order: 0 }),
  cat({ id: "tablettes", name: "Tablettes", order: 1 }),
];

describe("CategoryFormDialog", () => {
  it("shows 'Nouvelle catégorie' title when no initial", () => {
    render(
      <CategoryFormDialog
        open={true}
        onOpenChange={() => {}}
        topLevelCategories={topLevelCategories}
      />
    );
    expect(screen.getByText("Nouvelle catégorie")).toBeDefined();
  });

  it("shows 'Modifier la catégorie' title when initial is provided", () => {
    const existing = cat({ id: "smartphones", name: "Smartphones" });
    render(
      <CategoryFormDialog
        open={true}
        onOpenChange={() => {}}
        initial={existing}
        topLevelCategories={topLevelCategories}
      />
    );
    expect(screen.getByText("Modifier la catégorie")).toBeDefined();
  });

  it("auto-generates slug from name when creating", async () => {
    const user = userEvent.setup();
    render(
      <CategoryFormDialog
        open={true}
        onOpenChange={() => {}}
        topLevelCategories={topLevelCategories}
      />
    );

    const nameInput = screen.getByLabelText("Nom");
    await user.type(nameInput, "Écouteurs Sans Fil");

    const slugInput = screen.getByLabelText("Slug") as HTMLInputElement;
    expect(slugInput.value).toBe("ecouteurs-sans-fil");
  });

  it("has required fields: Nom, Slug, Icône, Parent, Ordre", () => {
    render(
      <CategoryFormDialog
        open={true}
        onOpenChange={() => {}}
        topLevelCategories={topLevelCategories}
      />
    );
    expect(screen.getByLabelText("Nom")).toBeDefined();
    expect(screen.getByLabelText("Slug")).toBeDefined();
    expect(screen.getByText("Icône Lucide")).toBeDefined();
    expect(screen.getByText("Parent")).toBeDefined();
    expect(screen.getByLabelText("Ordre")).toBeDefined();
  });
});
