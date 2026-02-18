import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CartIndicator } from "@/components/layout/app-bar/cart-indicator";

describe("CartIndicator", () => {
  it("renders cart link", () => {
    render(<CartIndicator count={0} />);
    expect(screen.getByRole("link", { name: /panier/i })).toBeInTheDocument();
  });

  it("links to /panier", () => {
    render(<CartIndicator count={0} />);
    expect(screen.getByRole("link", { name: /panier/i })).toHaveAttribute("href", "/panier");
  });

  it("shows badge when count > 0", () => {
    render(<CartIndicator count={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("hides badge when count is 0", () => {
    render(<CartIndicator count={0} />);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
