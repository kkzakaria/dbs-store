import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SocialButtons } from "@/components/auth/social-buttons";

const mockSocial = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  signIn: { social: (...args: unknown[]) => mockSocial(...args) },
}));

describe("SocialButtons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocial.mockResolvedValue({});
  });

  it("renders Google button", () => {
    render(<SocialButtons />);
    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
  });

  it("renders Facebook button", () => {
    render(<SocialButtons />);
    expect(screen.getByRole("button", { name: /facebook/i })).toBeInTheDocument();
  });

  it("renders Apple button", () => {
    render(<SocialButtons />);
    expect(screen.getByRole("button", { name: /apple/i })).toBeInTheDocument();
  });

  it("calls signIn.social with correct provider on click", async () => {
    const user = userEvent.setup();
    render(<SocialButtons callbackURL="/compte" />);

    await user.click(screen.getByRole("button", { name: /google/i }));

    expect(mockSocial).toHaveBeenCalledWith(
      { provider: "google", callbackURL: "/compte" },
      expect.objectContaining({ onError: expect.any(Function) })
    );
  });

  it("disables all buttons while a provider is loading", async () => {
    let resolveSignIn: () => void;
    mockSocial.mockReturnValue(new Promise((resolve) => { resolveSignIn = resolve; }));

    const user = userEvent.setup();
    render(<SocialButtons />);

    await user.click(screen.getByRole("button", { name: /google/i }));

    expect(screen.getByRole("button", { name: /connexion/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /facebook/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /apple/i })).toBeDisabled();

    resolveSignIn!();
  });

  it("shows error when signIn.social throws", async () => {
    mockSocial.mockRejectedValue(new Error("network error"));

    const user = userEvent.setup();
    render(<SocialButtons />);

    await user.click(screen.getByRole("button", { name: /google/i }));

    expect(screen.getByText(/impossible de se connecter/i)).toBeInTheDocument();
  });
});
