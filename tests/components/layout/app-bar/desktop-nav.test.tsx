import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DesktopNav } from "@/components/layout/app-bar/desktop-nav";

describe("DesktopNav", () => {
  it("renders all 8 category links", () => {
    render(<DesktopNav />);
    expect(screen.getByText("Smartphones")).toBeInTheDocument();
    expect(screen.getByText("Tablettes")).toBeInTheDocument();
    expect(screen.getByText("Ordinateurs")).toBeInTheDocument();
    expect(screen.getByText("Montres connectées")).toBeInTheDocument();
    expect(screen.getByText("Audio")).toBeInTheDocument();
    expect(screen.getByText("Accessoires")).toBeInTheDocument();
    expect(screen.getByText("Offres")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();
  });

  it("categories with subcategories have chevron buttons", () => {
    render(<DesktopNav />);
    const smartphonesButton = screen.getByRole("button", { name: /smartphones/i });
    expect(smartphonesButton).toBeInTheDocument();
  });

  it("offres links directly (no chevron)", () => {
    render(<DesktopNav />);
    const offresLink = screen.getByRole("link", { name: /offres/i });
    expect(offresLink).toBeInTheDocument();
    expect(offresLink).toHaveAttribute("href", "/offres");
  });

  it("support links directly (no chevron)", () => {
    render(<DesktopNav />);
    const supportLink = screen.getByRole("link", { name: /support/i });
    expect(supportLink).toBeInTheDocument();
    expect(supportLink).toHaveAttribute("href", "/support");
  });

  it("opens category tray on hover", async () => {
    const user = userEvent.setup();
    render(<DesktopNav />);

    const smartphonesButton = screen.getByRole("button", { name: /smartphones/i });
    expect(smartphonesButton).toHaveAttribute("aria-expanded", "false");

    await user.hover(smartphonesButton);
    expect(smartphonesButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("iPhone")).toBeInTheDocument();
  });

  it("toggles category tray with keyboard", async () => {
    const user = userEvent.setup();
    render(<DesktopNav />);

    const smartphonesButton = screen.getByRole("button", { name: /smartphones/i });
    smartphonesButton.focus();

    await user.keyboard("{Enter}");
    expect(smartphonesButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("iPhone")).toBeInTheDocument();

    await user.keyboard("{Enter}");
    expect(smartphonesButton).toHaveAttribute("aria-expanded", "false");
  });
});
