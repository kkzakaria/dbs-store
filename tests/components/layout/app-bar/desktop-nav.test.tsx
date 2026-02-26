import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DesktopNav } from "@/components/layout/app-bar/desktop-nav";

describe("DesktopNav", () => {
  it("renders 6 visible category links", () => {
    render(<DesktopNav />);
    expect(screen.getByText("Smartphones")).toBeInTheDocument();
    expect(screen.getByText("Tablettes")).toBeInTheDocument();
    expect(screen.getByText("Ordinateurs")).toBeInTheDocument();
    expect(screen.getByText("Montres connectées")).toBeInTheDocument();
    expect(screen.getByText("Audio")).toBeInTheDocument();
    expect(screen.getByText("Caméras & Drones")).toBeInTheDocument();
  });

  it("categories with subcategories have chevron buttons", () => {
    render(<DesktopNav />);
    const smartphonesButton = screen.getByRole("button", { name: /smartphones/i });
    expect(smartphonesButton).toBeInTheDocument();
  });

  it("shows overflow categories in Plus menu", async () => {
    const user = userEvent.setup();
    render(<DesktopNav />);

    await user.hover(screen.getByRole("button", { name: /plus de catégories/i }));

    expect(screen.getByRole("link", { name: /offres/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /support/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /accessoires/i })).toBeInTheDocument();
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
