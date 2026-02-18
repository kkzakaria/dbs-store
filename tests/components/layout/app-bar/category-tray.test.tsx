import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryTray } from "@/components/layout/app-bar/category-tray";
import { getSubcategories } from "@/lib/data/categories";

describe("CategoryTray", () => {
  const subcategories = getSubcategories("smartphones");
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
