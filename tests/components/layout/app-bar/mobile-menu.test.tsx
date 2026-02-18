import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileMenu } from "@/components/layout/app-bar/mobile-menu";

describe("MobileMenu", () => {
  const onClose = vi.fn();

  it("renders all top-level categories", () => {
    render(<MobileMenu open onClose={onClose} />);
    expect(screen.getByText("Smartphones")).toBeInTheDocument();
    expect(screen.getByText("Tablettes")).toBeInTheDocument();
    expect(screen.getByText("Ordinateurs")).toBeInTheDocument();
    expect(screen.getByText("Audio")).toBeInTheDocument();
    expect(screen.getByText("Accessoires")).toBeInTheDocument();
    expect(screen.getByText("Offres")).toBeInTheDocument();
    expect(screen.getByText("Support")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<MobileMenu open={false} onClose={onClose} />);
    expect(screen.queryByText("Smartphones")).not.toBeInTheDocument();
  });

  it("shows subcategories when category is tapped", async () => {
    const user = userEvent.setup();
    render(<MobileMenu open onClose={onClose} />);

    await user.click(screen.getByText("Smartphones"));

    expect(screen.getByText("iPhone")).toBeInTheDocument();
    expect(screen.getByText("Samsung Galaxy")).toBeInTheDocument();
  });

  it("shows back button in subcategory view", async () => {
    const user = userEvent.setup();
    render(<MobileMenu open onClose={onClose} />);

    await user.click(screen.getByText("Smartphones"));

    expect(screen.getByRole("button", { name: /retour/i })).toBeInTheDocument();
  });

  it("goes back to categories from subcategories", async () => {
    const user = userEvent.setup();
    render(<MobileMenu open onClose={onClose} />);

    await user.click(screen.getByText("Smartphones"));
    await user.click(screen.getByRole("button", { name: /retour/i }));

    expect(screen.getByText("Tablettes")).toBeInTheDocument();
  });
});
