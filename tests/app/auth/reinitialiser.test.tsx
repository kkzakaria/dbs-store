import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ResetPasswordPage from "@/app/(auth)/reinitialiser/page";

vi.mock("@/lib/auth-client", () => ({
  authClient: { resetPassword: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams("token=test-token"),
}));

describe("ResetPasswordPage", () => {
  it("renders heading", () => {
    render(<ResetPasswordPage />);
    expect(
      screen.getByText("Nouveau mot de passe", { selector: "[data-slot='card-title']" })
    ).toBeInTheDocument();
  });

  it("renders new password input", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByLabelText(/nouveau mot de passe/i)).toBeInTheDocument();
  });

  it("renders confirm password input", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByLabelText(/confirmer/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByRole("button", { name: /réinitialiser/i })).toBeInTheDocument();
  });
});
