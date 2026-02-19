import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignInPage from "@/app/(auth)/connexion/page";
import { signIn } from "@/lib/auth-client";

vi.mock("@/lib/auth-client", () => ({
  signIn: { email: vi.fn(), social: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

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
    expect(screen.getByLabelText(/^mot de passe$/i)).toBeInTheDocument();
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

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<SignInPage />);
    const passwordInput = screen.getByLabelText(/^mot de passe$/i) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");
    await user.click(screen.getByRole("button", { name: /afficher/i }));
    expect(passwordInput.type).toBe("text");
  });

  it("calls signIn.email with credentials on submit", async () => {
    vi.mocked(signIn.email).mockImplementation((_data, callbacks: any) => {
      callbacks?.onSuccess?.();
      return Promise.resolve({});
    });

    const user = userEvent.setup();
    render(<SignInPage />);
    await user.type(screen.getByLabelText(/email/i), "test@exemple.com");
    await user.type(screen.getByLabelText(/^mot de passe$/i), "password123");
    await user.click(screen.getByRole("button", { name: /se connecter/i }));

    expect(signIn.email).toHaveBeenCalledWith(
      { email: "test@exemple.com", password: "password123" },
      expect.any(Object)
    );
  });

  it("shows error message on sign-in failure", async () => {
    vi.mocked(signIn.email).mockImplementation((_data, callbacks: any) => {
      callbacks?.onError?.({ error: { message: "Email ou mot de passe incorrect." } });
      return Promise.resolve({});
    });

    const user = userEvent.setup();
    render(<SignInPage />);
    await user.type(screen.getByLabelText(/email/i), "test@exemple.com");
    await user.type(screen.getByLabelText(/^mot de passe$/i), "password123");
    await user.click(screen.getByRole("button", { name: /se connecter/i }));

    expect(screen.getByText("Email ou mot de passe incorrect.")).toBeInTheDocument();
  });
});
