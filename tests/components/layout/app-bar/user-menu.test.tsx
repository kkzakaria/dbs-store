import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserMenu } from "@/components/layout/app-bar/user-menu";
import * as useIsAdminModule from "@/hooks/use-is-admin";

const { mockUseSession, mockSignOut } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  useSession: () => mockUseSession(),
  signOut: mockSignOut,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/hooks/use-is-admin", () => ({
  useIsAdmin: vi.fn(() => false),
}));

describe("UserMenu", () => {
  it("renders login link when not authenticated", () => {
    mockUseSession.mockReturnValue({ data: null, isPending: false });
    render(<UserMenu />);
    expect(screen.getByRole("link", { name: /compte/i })).toHaveAttribute("href", "/connexion");
  });

  it("renders user button when authenticated", () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Test User", email: "test@example.com" } },
      isPending: false,
    });
    render(<UserMenu />);
    expect(screen.getByRole("button", { name: /compte/i })).toBeInTheDocument();
  });

  it("affiche le lien Administration pour les membres org", async () => {
    vi.mocked(useIsAdminModule.useIsAdmin).mockReturnValue(true);
    mockUseSession.mockReturnValue({
      data: { user: { name: "Admin", email: "admin@dbs.ci" } },
      isPending: false,
    });
    const user = userEvent.setup();
    render(<UserMenu />);
    await user.click(screen.getByRole("button", { name: /compte/i }));
    expect(screen.getByRole("menuitem", { name: /administration/i })).toBeInTheDocument();
  });
});
