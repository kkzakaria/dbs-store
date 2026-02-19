import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResetPasswordPage from "@/app/(auth)/reinitialiser/page";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    emailOtp: {
      sendVerificationOtp: vi.fn().mockResolvedValue({}),
      resetPassword: vi.fn().mockResolvedValue({ data: { success: true } }),
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

beforeEach(() => {
  sessionStorage.setItem("otp_email", "test@exemple.com");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ valid: true }),
    })
  );
});

async function advanceToPasswordStep() {
  const user = userEvent.setup();
  render(<ResetPasswordPage />);
  const inputs = screen.getAllByRole("textbox");
  for (let i = 0; i < 6; i++) {
    await user.type(inputs[i], String(i + 1));
  }
  await user.click(screen.getByRole("button", { name: /valider le code/i }));
  await waitFor(() =>
    expect(screen.getByLabelText(/nouveau mot de passe/i)).toBeInTheDocument()
  );
  return user;
}

describe("ResetPasswordPage", () => {
  it("renders OTP heading", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByText("Réinitialiser le mot de passe")).toBeInTheDocument();
  });

  it("renders 6 OTP input fields on step 1", () => {
    render(<ResetPasswordPage />);
    expect(screen.getAllByRole("textbox")).toHaveLength(6);
  });

  it("renders validate button on step 1", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByRole("button", { name: /valider le code/i })).toBeInTheDocument();
  });

  it("shows password fields after valid OTP", async () => {
    await advanceToPasswordStep();
    expect(screen.getByLabelText(/confirmer le mot de passe/i)).toBeInTheDocument();
  });

  it("renders reset button on step 2", async () => {
    await advanceToPasswordStep();
    expect(screen.getByRole("button", { name: /réinitialiser/i })).toBeInTheDocument();
  });

  it("shows error when passwords do not match", async () => {
    const user = await advanceToPasswordStep();
    await user.type(screen.getByLabelText(/nouveau mot de passe/i), "Abcdefg1!");
    await user.type(screen.getByLabelText(/confirmer le mot de passe/i), "Different1!");
    await user.click(screen.getByRole("button", { name: /réinitialiser/i }));
    expect(screen.getByText(/ne correspondent pas/i)).toBeInTheDocument();
  });

  it("shows error when OTP is invalid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ valid: false, reason: "invalid" }),
      })
    );
    const user = userEvent.setup();
    render(<ResetPasswordPage />);
    const inputs = screen.getAllByRole("textbox");
    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i], String(i + 1));
    }
    await user.click(screen.getByRole("button", { name: /valider le code/i }));
    await waitFor(() =>
      expect(screen.getByText(/code incorrect/i)).toBeInTheDocument()
    );
  });

  it("shows error when OTP is expired", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ valid: false, reason: "expired" }),
      })
    );
    const user = userEvent.setup();
    render(<ResetPasswordPage />);
    const inputs = screen.getAllByRole("textbox");
    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i], String(i + 1));
    }
    await user.click(screen.getByRole("button", { name: /valider le code/i }));
    await waitFor(() =>
      expect(screen.getByText(/expiré/i)).toBeInTheDocument()
    );
  });
});
