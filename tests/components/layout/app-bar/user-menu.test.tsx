import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserMenu } from "@/components/layout/app-bar/user-menu";

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
});
