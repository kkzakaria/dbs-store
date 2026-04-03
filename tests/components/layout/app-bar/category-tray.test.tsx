import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryTray } from "@/components/layout/app-bar/category-tray";
import type { Category } from "@/lib/db/schema";

const subcategories: Category[] = [
  { id: "iphone", slug: "iphone", name: "iPhone", icon: "smartphone", image: null, parent_id: "smartphones", order: 0, created_at: new Date() },
  { id: "samsung-galaxy", slug: "samsung-galaxy", name: "Samsung Galaxy", icon: "smartphone", image: null, parent_id: "smartphones", order: 1, created_at: new Date() },
  { id: "google-pixel", slug: "google-pixel", name: "Google Pixel", icon: "smartphone", image: null, parent_id: "smartphones", order: 2, created_at: new Date() },
  { id: "xiaomi", slug: "xiaomi", name: "Xiaomi", icon: "smartphone", image: null, parent_id: "smartphones", order: 3, created_at: new Date() },
  { id: "autres-marques", slug: "autres-marques", name: "Autres marques", icon: "smartphone", image: null, parent_id: "smartphones", order: 4, created_at: new Date() },
];

describe("CategoryTray", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
  });

  it("renders all subcategories", () => {
    render(
      <CategoryTray
        categorySlug="smartphones"
        subcategories={subcategories}
        onClose={onClose}
      />
    );
    expect(screen.getByText("iPhone")).toBeInTheDocument();
    expect(screen.getByText("Samsung Galaxy")).toBeInTheDocument();
    expect(screen.getByText("Google Pixel")).toBeInTheDocument();
    expect(screen.getByText("Xiaomi")).toBeInTheDocument();
    expect(screen.getByText("Autres marques")).toBeInTheDocument();
  });

  it("renders a 'Tout voir' link to parent category", () => {
    render(
      <CategoryTray
        categorySlug="smartphones"
        subcategories={subcategories}
        onClose={onClose}
      />
    );
    const seeAllLink = screen.getByRole("link", { name: /tout voir/i });
    expect(seeAllLink).toHaveAttribute("href", "/categorie/smartphones");
  });

  it("subcategory links point to correct paths", () => {
    render(
      <CategoryTray
        categorySlug="smartphones"
        subcategories={subcategories}
        onClose={onClose}
      />
    );
    const iphoneLink = screen.getByRole("link", { name: /iphone/i });
    expect(iphoneLink).toHaveAttribute("href", "/categorie/smartphones/iphone");
  });

  it("calls onClose when Escape is pressed", () => {
    render(
      <CategoryTray
        categorySlug="smartphones"
        subcategories={subcategories}
        onClose={onClose}
      />
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose on click outside", () => {
    render(
      <CategoryTray
        categorySlug="smartphones"
        subcategories={subcategories}
        onClose={onClose}
      />
    );
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalled();
  });
});
