import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResetPasswordPage from "@/app/(auth)/reinitialiser/page";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    emailOtp: {
      resetPassword: vi.fn().mockResolvedValue({ data: { success: true } }),
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

beforeEach(() => {
  sessionStorage.setItem("otp_email", "test@exemple.com");
});

describe("ResetPasswordPage", () => {
  it("renders OTP heading", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByText("Réinitialiser le mot de passe")).toBeInTheDocument();
  });

  it("renders 6 OTP input fields", () => {
    render(<ResetPasswordPage />);
    expect(screen.getAllByRole("textbox")).toHaveLength(6);
  });

  it("renders new password field", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByLabelText(/nouveau mot de passe/i)).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByRole("button", { name: /réinitialiser/i })).toBeInTheDocument();
  });

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordPage />);
    await user.type(screen.getByLabelText(/nouveau mot de passe/i), "Abcdefg1!");
    await user.type(screen.getByLabelText(/confirmer/i), "Different1!");
    await user.click(screen.getByRole("button", { name: /réinitialiser/i }));
    expect(screen.getByText(/ne correspondent pas/i)).toBeInTheDocument();
  });
});
