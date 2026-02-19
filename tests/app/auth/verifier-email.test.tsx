import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VerifyEmailPage from "@/app/(auth)/verifier-email/page";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    emailOtp: {
      verifyEmail: vi.fn(),
      sendVerificationOtp: vi.fn(),
    },
  },
}));

import { authClient } from "@/lib/auth-client";

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("otp_email", "test@exemple.com");
  vi.mocked(authClient.emailOtp.verifyEmail).mockResolvedValue({ data: {}, error: null });
  vi.mocked(authClient.emailOtp.sendVerificationOtp).mockResolvedValue({ data: {}, error: null });
});

describe("VerifyEmailPage", () => {
  it("renders heading", () => {
    render(<VerifyEmailPage />);
    expect(screen.getByText("Vérifiez votre email")).toBeInTheDocument();
  });

  it("renders 6 OTP input fields", () => {
    render(<VerifyEmailPage />);
    expect(screen.getAllByRole("textbox", { name: /chiffre/i })).toHaveLength(6);
  });

  it("renders submit button", () => {
    render(<VerifyEmailPage />);
    expect(screen.getByRole("button", { name: /vérifier/i })).toBeInTheDocument();
  });

  it("renders resend button", () => {
    render(<VerifyEmailPage />);
    expect(screen.getByRole("button", { name: /renvoyer/i })).toBeInTheDocument();
  });

  it("redirects to /inscription when email not in sessionStorage", async () => {
    sessionStorage.removeItem("otp_email");
    render(<VerifyEmailPage />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/inscription");
    });
  });

  it("calls verifyEmail with email and otp on submit", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.emailOtp.verifyEmail).mockImplementation(function (_data, callbacks: any) {
      callbacks?.onSuccess?.();
      return Promise.resolve({ data: {}, error: null });
    });
    render(<VerifyEmailPage />);
    const inputs = screen.getAllByRole("textbox", { name: /chiffre/i });
    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i], String(i + 1));
    }
    await user.click(screen.getByRole("button", { name: /vérifier/i }));
    expect(authClient.emailOtp.verifyEmail).toHaveBeenCalledWith(
      { email: "test@exemple.com", otp: "123456" },
      expect.any(Object)
    );
  });

  it("shows error when OTP is invalid", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.emailOtp.verifyEmail).mockImplementation(function (_data, callbacks: any) {
      callbacks?.onError?.({ error: { message: "Code incorrect ou expiré" } });
      return Promise.resolve({ data: null, error: { message: "Code incorrect ou expiré" } });
    });
    render(<VerifyEmailPage />);
    const inputs = screen.getAllByRole("textbox", { name: /chiffre/i });
    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i], "1");
    }
    await user.click(screen.getByRole("button", { name: /vérifier/i }));
    expect(screen.getByText(/incorrect ou expiré/i)).toBeInTheDocument();
  });

  it("redirects to / and clears sessionStorage on success", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.emailOtp.verifyEmail).mockImplementation(function (_data, callbacks: any) {
      callbacks?.onSuccess?.();
      return Promise.resolve({ data: {}, error: null });
    });
    render(<VerifyEmailPage />);
    const inputs = screen.getAllByRole("textbox", { name: /chiffre/i });
    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i], "1");
    }
    await user.click(screen.getByRole("button", { name: /vérifier/i }));
    expect(mockPush).toHaveBeenCalledWith("/");
    expect(sessionStorage.getItem("otp_email")).toBeNull();
  });
});
