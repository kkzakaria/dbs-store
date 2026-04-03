import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppBar } from "@/components/layout/app-bar/app-bar";
import type { Category } from "@/lib/db/schema";

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: null, isPending: false }),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const testCategories: Category[] = [
  { id: "smartphones", slug: "smartphones", name: "Smartphones", icon: "smartphone", image: null, parent_id: null, order: 0, created_at: new Date() },
  { id: "tablettes", slug: "tablettes", name: "Tablettes", icon: "tablet", image: null, parent_id: null, order: 1, created_at: new Date() },
];

describe("AppBar", () => {
  it("renders the DBS logo link", () => {
    render(<AppBar categories={testCategories} />);
    expect(screen.getByRole("link", { name: /dbs store/i })).toBeInTheDocument();
  });

  it("has sticky positioning", () => {
    render(<AppBar categories={testCategories} />);
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("sticky");
  });

  it("renders search button", () => {
    render(<AppBar categories={testCategories} />);
    expect(screen.getByRole("button", { name: /rechercher/i })).toBeInTheDocument();
  });

  it("renders cart button", () => {
    render(<AppBar categories={testCategories} />);
    expect(screen.getByRole("button", { name: /panier/i })).toBeInTheDocument();
  });
});
