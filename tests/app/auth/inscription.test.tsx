import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignUpPage from "@/app/(auth)/inscription/page";

vi.mock("@/lib/auth-client", () => ({
  signUp: { email: vi.fn() },
  signIn: { social: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("SignUpPage", () => {
  it("renders sign-up heading", () => {
    render(<SignUpPage />);
    expect(screen.getByText("Créer un compte")).toBeInTheDocument();
  });

  it("renders name input", () => {
    render(<SignUpPage />);
    expect(screen.getByLabelText(/nom/i)).toBeInTheDocument();
  });

  it("renders email input", () => {
    render(<SignUpPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("renders password input", () => {
    render(<SignUpPage />);
    expect(screen.getByLabelText(/^mot de passe$/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<SignUpPage />);
    expect(screen.getByRole("button", { name: /s'inscrire/i })).toBeInTheDocument();
  });

  it("renders link to connexion", () => {
    render(<SignUpPage />);
    expect(screen.getByRole("link", { name: /se connecter/i })).toHaveAttribute("href", "/connexion");
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<SignUpPage />);
    const passwordInput = screen.getByLabelText(/^mot de passe$/i) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");
    await user.click(screen.getByRole("button", { name: /afficher/i }));
    expect(passwordInput.type).toBe("text");
  });

  it("shows password strength indicator when typing", async () => {
    const user = userEvent.setup();
    render(<SignUpPage />);
    const passwordInput = screen.getByLabelText(/^mot de passe$/i);
    await user.type(passwordInput, "abc");
    expect(screen.getByText(/faible/i)).toBeInTheDocument();
  });
});
