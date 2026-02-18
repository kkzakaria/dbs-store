import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserMenu } from "@/components/layout/app-bar/user-menu";

describe("UserMenu", () => {
  it("renders account link when not authenticated", () => {
    render(<UserMenu />);
    expect(screen.getByRole("link", { name: /compte/i })).toBeInTheDocument();
  });

  it("links to /connexion when not authenticated", () => {
    render(<UserMenu />);
    expect(screen.getByRole("link", { name: /compte/i })).toHaveAttribute("href", "/connexion");
  });
});
