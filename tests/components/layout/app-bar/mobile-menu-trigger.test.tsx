import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileMenuTrigger } from "@/components/layout/app-bar/mobile-menu-trigger";
import type { Category } from "@/lib/db/schema";

vi.mock("@/components/layout/app-bar/mobile-menu", () => ({
  MobileMenu: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-modal="true">
      <button onClick={onClose}>Fermer</button>
    </div>
  ),
}));

const testCategories: Category[] = [
  { id: "smartphones", slug: "smartphones", name: "Smartphones", icon: "smartphone", image: null, parent_id: null, order: 0, created_at: new Date() },
];

describe("MobileMenuTrigger", () => {
  it("renders the menu button", () => {
    render(<MobileMenuTrigger categories={testCategories} />);
    expect(screen.getByRole("button", { name: /menu/i })).toBeInTheDocument();
  });

  it("opens MobileMenu when button is clicked", async () => {
    const user = userEvent.setup();
    render(<MobileMenuTrigger categories={testCategories} />);

    await user.click(screen.getByRole("button", { name: /menu/i }));

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
