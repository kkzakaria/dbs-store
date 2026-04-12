import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileMenu } from "@/components/layout/app-bar/mobile-menu";
import type { Category } from "@/lib/db/schema";

const testCategories: Category[] = [
  { id: "smartphones", slug: "smartphones", name: "Smartphones", icon: "smartphone", image: null, parent_id: null, order: 0, created_at: new Date() },
  { id: "tablettes", slug: "tablettes", name: "Tablettes", icon: "tablet", image: null, parent_id: null, order: 1, created_at: new Date() },
  { id: "ordinateurs", slug: "ordinateurs", name: "Ordinateurs", icon: "laptop", image: null, parent_id: null, order: 2, created_at: new Date() },
  { id: "audio", slug: "audio", name: "Audio", icon: "headphones", image: null, parent_id: null, order: 4, created_at: new Date() },
  { id: "accessoires", slug: "accessoires", name: "Accessoires", icon: "cable", image: null, parent_id: null, order: 8, created_at: new Date() },
  { id: "offres", slug: "offres", name: "Offres", icon: "percent", image: null, parent_id: null, order: 9, created_at: new Date() },
  // Subcategories for Smartphones
  { id: "iphone", slug: "iphone", name: "iPhone", icon: "smartphone", image: null, parent_id: "smartphones", order: 0, created_at: new Date() },
  { id: "samsung-galaxy", slug: "samsung-galaxy", name: "Samsung Galaxy", icon: "smartphone", image: null, parent_id: "smartphones", order: 1, created_at: new Date() },
];

describe("MobileMenu", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
  });

  it("renders with dialog role", () => {
    render(<MobileMenu categories={testCategories} onClose={onClose} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders all top-level categories", () => {
    render(<MobileMenu categories={testCategories} onClose={onClose} />);
    expect(screen.getByText("Smartphones")).toBeInTheDocument();
    expect(screen.getByText("Tablettes")).toBeInTheDocument();
    expect(screen.getByText("Ordinateurs")).toBeInTheDocument();
    expect(screen.getByText("Audio")).toBeInTheDocument();
    expect(screen.getByText("Accessoires")).toBeInTheDocument();
    // "offres" slug is filtered out (hardcoded "Offres & Promotions" entry handles it)
    expect(screen.getByText("Offres & Promotions")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();
  });

  it("shows subcategories when category is tapped", async () => {
    const user = userEvent.setup();
    render(<MobileMenu categories={testCategories} onClose={onClose} />);

    await user.click(screen.getByText("Smartphones"));

    expect(screen.getByText("iPhone")).toBeInTheDocument();
    expect(screen.getByText("Samsung Galaxy")).toBeInTheDocument();
  });

  it("shows back button in subcategory view", async () => {
    const user = userEvent.setup();
    render(<MobileMenu categories={testCategories} onClose={onClose} />);

    await user.click(screen.getByText("Smartphones"));

    expect(screen.getByRole("button", { name: /retour/i })).toBeInTheDocument();
  });

  it("goes back to categories from subcategories", async () => {
    const user = userEvent.setup();
    render(<MobileMenu categories={testCategories} onClose={onClose} />);

    await user.click(screen.getByText("Smartphones"));
    await user.click(screen.getByRole("button", { name: /retour/i }));

    expect(screen.getByText("Tablettes")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<MobileMenu categories={testCategories} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /fermer/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Escape is pressed", () => {
    render(<MobileMenu categories={testCategories} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
