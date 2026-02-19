import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignUpPage from "@/app/(auth)/inscription/page";
import { signUp } from "@/lib/auth-client";

vi.mock("@/lib/auth-client", () => ({
  signUp: { email: vi.fn() },
  signIn: { social: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

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

  it("calls signUp.email with credentials on submit", async () => {
    vi.mocked(signUp.email).mockImplementation((_data, callbacks: any) => {
      callbacks?.onSuccess?.();
      return Promise.resolve({});
    });

    const user = userEvent.setup();
    render(<SignUpPage />);
    await user.type(screen.getByLabelText(/nom/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "test@exemple.com");
    await user.type(screen.getByLabelText(/^mot de passe$/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(signUp.email).toHaveBeenCalledWith(
      { name: "Test User", email: "test@exemple.com", password: "Password123!" },
      expect.any(Object)
    );
  });

  it("shows error message on sign-up failure", async () => {
    vi.mocked(signUp.email).mockImplementation((_data, callbacks: any) => {
      callbacks?.onError?.({ error: { message: "Un compte existe déjà avec cette adresse email." } });
      return Promise.resolve({});
    });

    const user = userEvent.setup();
    render(<SignUpPage />);
    await user.type(screen.getByLabelText(/nom/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "test@exemple.com");
    await user.type(screen.getByLabelText(/^mot de passe$/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /s'inscrire/i }));

    expect(screen.getByText("Un compte existe déjà avec cette adresse email.")).toBeInTheDocument();
  });
});
