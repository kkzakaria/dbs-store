import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPasswordPage from "@/app/(auth)/mot-de-passe-oublie/page";
import { authClient } from "@/lib/auth-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    emailOtp: {
      sendVerificationOtp: vi.fn().mockResolvedValue({}),
    },
  },
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

  it("calls sendVerificationOtp and redirects on success", async () => {
    const mockSendVerificationOtp = vi.mocked(authClient.emailOtp.sendVerificationOtp);
    mockSendVerificationOtp.mockImplementation((_data, callbacks: any) => {
      callbacks?.onSuccess?.();
      return Promise.resolve({});
    });

    const user = userEvent.setup();
    render(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText(/email/i), "test@exemple.com");
    await user.click(screen.getByRole("button", { name: /envoyer/i }));

    expect(mockSendVerificationOtp).toHaveBeenCalledWith(
      { email: "test@exemple.com", type: "forget-password" },
      expect.any(Object)
    );
  });
});
