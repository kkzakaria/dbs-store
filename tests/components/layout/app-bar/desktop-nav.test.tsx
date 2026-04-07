import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DesktopNav } from "@/components/layout/app-bar/desktop-nav";
import type { Category } from "@/lib/db/schema";

const testCategories: Category[] = [
  { id: "smartphones", slug: "smartphones", name: "Smartphones", icon: "smartphone", image: null, parent_id: null, order: 0, created_at: new Date() },
  { id: "tablettes", slug: "tablettes", name: "Tablettes", icon: "tablet", image: null, parent_id: null, order: 1, created_at: new Date() },
  { id: "ordinateurs", slug: "ordinateurs", name: "Ordinateurs", icon: "laptop", image: null, parent_id: null, order: 2, created_at: new Date() },
  { id: "montres", slug: "montres-connectees", name: "Montres connectées", icon: "watch", image: null, parent_id: null, order: 3, created_at: new Date() },
  { id: "audio", slug: "audio", name: "Audio", icon: "headphones", image: null, parent_id: null, order: 4, created_at: new Date() },
  { id: "cameras", slug: "cameras-drones", name: "Caméras & Drones", icon: "camera", image: null, parent_id: null, order: 5, created_at: new Date() },
  { id: "gaming", slug: "gaming", name: "Gaming", icon: "gamepad-2", image: null, parent_id: null, order: 6, created_at: new Date() },
  { id: "imprimantes", slug: "imprimantes", name: "Imprimantes", icon: "printer", image: null, parent_id: null, order: 7, created_at: new Date() },
  { id: "accessoires", slug: "accessoires", name: "Accessoires", icon: "cable", image: null, parent_id: null, order: 8, created_at: new Date() },
  { id: "offres", slug: "offres", name: "Offres", icon: "percent", image: null, parent_id: null, order: 9, created_at: new Date() },
  { id: "support", slug: "support", name: "Support", icon: "life-buoy", image: null, parent_id: null, order: 10, created_at: new Date() },
  // Subcategories for Smartphones
  { id: "iphone", slug: "iphone", name: "iPhone", icon: "smartphone", image: null, parent_id: "smartphones", order: 0, created_at: new Date() },
  { id: "samsung-galaxy", slug: "samsung-galaxy", name: "Samsung Galaxy", icon: "smartphone", image: null, parent_id: "smartphones", order: 1, created_at: new Date() },
];

describe("DesktopNav", () => {
  it("renders 6 visible category links", () => {
    render(<DesktopNav categories={testCategories} />);
    expect(screen.getByText("Smartphones")).toBeInTheDocument();
    expect(screen.getByText("Tablettes")).toBeInTheDocument();
    expect(screen.getByText("Ordinateurs")).toBeInTheDocument();
    expect(screen.getByText("Montres connectées")).toBeInTheDocument();
    expect(screen.getByText("Audio")).toBeInTheDocument();
    expect(screen.getByText("Caméras & Drones")).toBeInTheDocument();
  });

  it("categories with subcategories have chevron buttons", () => {
    render(<DesktopNav categories={testCategories} />);
    const smartphonesButton = screen.getByRole("button", { name: /smartphones/i });
    expect(smartphonesButton).toBeInTheDocument();
  });

  it("shows overflow categories in Plus menu", async () => {
    const user = userEvent.setup();
    render(<DesktopNav categories={testCategories} />);

    await user.hover(screen.getByRole("button", { name: /plus de catégories/i }));

    // Hardcoded "Offres" link + overflow "Offres" category both match by name
    expect(screen.getAllByRole("link", { name: /offres/i }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("link", { name: /support/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /accessoires/i })).toBeInTheDocument();
  });

  it("opens category tray on hover", async () => {
    const user = userEvent.setup();
    render(<DesktopNav categories={testCategories} />);

    const smartphonesButton = screen.getByRole("button", { name: /smartphones/i });
    expect(smartphonesButton).toHaveAttribute("aria-expanded", "false");

    await user.hover(smartphonesButton);
    expect(smartphonesButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("iPhone")).toBeInTheDocument();
  });

  it("toggles category tray with keyboard", async () => {
    const user = userEvent.setup();
    render(<DesktopNav categories={testCategories} />);

    const smartphonesButton = screen.getByRole("button", { name: /smartphones/i });
    smartphonesButton.focus();

    await user.keyboard("{Enter}");
    expect(smartphonesButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("iPhone")).toBeInTheDocument();

    await user.keyboard("{Enter}");
    expect(smartphonesButton).toHaveAttribute("aria-expanded", "false");
  });
});
