import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppBar } from "@/components/layout/app-bar/app-bar";

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
