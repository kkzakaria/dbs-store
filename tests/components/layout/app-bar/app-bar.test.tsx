import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppBar } from "@/components/layout/app-bar/app-bar";

vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: null, isPending: false }),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("AppBar", () => {
  it("renders the DBS logo link", () => {
    render(<AppBar />);
    expect(screen.getByRole("link", { name: /dbs/i })).toBeInTheDocument();
  });

  it("has sticky positioning", () => {
    render(<AppBar />);
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("sticky");
  });

  it("renders search button", () => {
    render(<AppBar />);
    expect(screen.getByRole("button", { name: /rechercher/i })).toBeInTheDocument();
  });

  it("renders cart link", () => {
    render(<AppBar />);
    expect(screen.getByRole("link", { name: /panier/i })).toBeInTheDocument();
  });
});
