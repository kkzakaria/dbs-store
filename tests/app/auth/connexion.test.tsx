import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SignInPage from "@/app/(auth)/connexion/page";

vi.mock("@/lib/auth-client", () => ({
  signIn: { email: vi.fn(), social: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("SignInPage", () => {
  it("renders sign-in heading", () => {
    render(<SignInPage />);
    expect(screen.getByText("Connexion")).toBeInTheDocument();
  });

  it("renders email input", () => {
    render(<SignInPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("renders password input", () => {
    render(<SignInPage />);
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<SignInPage />);
    expect(screen.getByRole("button", { name: /se connecter/i })).toBeInTheDocument();
  });

  it("renders link to inscription", () => {
    render(<SignInPage />);
    expect(screen.getByRole("link", { name: /créer un compte/i })).toHaveAttribute("href", "/inscription");
  });

  it("renders link to forgot password", () => {
    render(<SignInPage />);
    expect(screen.getByRole("link", { name: /mot de passe oublié/i })).toHaveAttribute("href", "/mot-de-passe-oublie");
  });

  it("renders social login buttons", () => {
    render(<SignInPage />);
    expect(screen.getByRole("button", { name: /google/i })).toBeInTheDocument();
  });
});
