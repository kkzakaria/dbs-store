import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ForgotPasswordPage from "@/app/(auth)/mot-de-passe-oublie/page";

vi.mock("@/lib/auth-client", () => ({
  authClient: { forgetPassword: vi.fn() },
}));

describe("ForgotPasswordPage", () => {
  it("renders heading", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByText("Mot de passe oublié")).toBeInTheDocument();
  });

  it("renders email input", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole("button", { name: /envoyer/i })).toBeInTheDocument();
  });

  it("renders link back to connexion", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole("link", { name: /retour/i })).toHaveAttribute("href", "/connexion");
  });
});
