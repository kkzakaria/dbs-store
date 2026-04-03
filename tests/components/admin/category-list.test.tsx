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
import { CategoryList } from "@/components/admin/category-list";
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

const testCategories = [
  cat({ id: "smartphones", name: "Smartphones", order: 0 }),
  cat({ id: "tablettes", name: "Tablettes", order: 1 }),
  cat({ id: "iphone", name: "iPhone", parent_id: "smartphones", order: 0 }),
  cat({ id: "ipad", name: "iPad", parent_id: "tablettes", order: 0 }),
];

describe("CategoryList", () => {
  it("renders empty state when no categories", () => {
    render(<CategoryList initialCategories={[]} />);
    expect(screen.getByText("Aucune catégorie.")).toBeDefined();
  });

  it("always shows the 'Nouvelle catégorie' button", () => {
    const { unmount } = render(<CategoryList initialCategories={[]} />);
    expect(screen.getByText("Nouvelle catégorie")).toBeDefined();
    unmount();

    render(<CategoryList initialCategories={testCategories} />);
    expect(screen.getByText("Nouvelle catégorie")).toBeDefined();
  });

  it("renders top-level categories in bold", () => {
    render(<CategoryList initialCategories={testCategories} />);
    const smartphones = screen.getByText("Smartphones");
    expect(smartphones.classList.contains("font-bold")).toBe(true);

    const tablettes = screen.getByText("Tablettes");
    expect(tablettes.classList.contains("font-bold")).toBe(true);
  });

  it("renders subcategories with pl-10 indentation", () => {
    render(<CategoryList initialCategories={testCategories} />);
    const iphone = screen.getByText("iPhone");
    // The pl-10 class is on the parent row div
    const row = iphone.closest(
      ".pl-10"
    );
    expect(row).not.toBeNull();
  });

  it("shows slug next to each category name", () => {
    render(<CategoryList initialCategories={testCategories} />);
    expect(screen.getByText("smartphones")).toBeDefined();
    expect(screen.getByText("tablettes")).toBeDefined();
    expect(screen.getByText("iphone")).toBeDefined();
    expect(screen.getByText("ipad")).toBeDefined();
  });

  it("renders edit and delete buttons for each category", () => {
    render(<CategoryList initialCategories={testCategories} />);
    // 4 categories => 4 edit + 4 delete = 8 icon buttons
    const buttons = screen.getAllByRole("button", { name: "" });
    // Filter to icon buttons (ghost variant, size icon)
    // Each category has 2 icon buttons (edit + delete)
    // Plus the "Nouvelle catégorie" button = total visible buttons
    const allButtons = screen.getAllByRole("button");
    // 1 "Nouvelle catégorie" + 4 * 2 icon buttons = 9
    expect(allButtons.length).toBe(9);
  });
});
