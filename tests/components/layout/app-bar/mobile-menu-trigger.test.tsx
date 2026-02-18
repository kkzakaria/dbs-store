import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileMenuTrigger } from "@/components/layout/app-bar/mobile-menu-trigger";

describe("MobileMenuTrigger", () => {
  it("renders the menu button", () => {
    render(<MobileMenuTrigger />);
    expect(screen.getByRole("button", { name: /menu/i })).toBeInTheDocument();
  });

  it("opens MobileMenu when button is clicked", async () => {
    const user = userEvent.setup();
    render(<MobileMenuTrigger />);

    await user.click(screen.getByRole("button", { name: /menu/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
