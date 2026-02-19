import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmailNotVerifiedPage from "@/app/(auth)/email-non-verifie/page";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    emailOtp: {
      sendVerificationOtp: vi.fn(),
    },
    useSession: vi.fn(),
  },
  signOut: vi.fn().mockResolvedValue({}),
}));

import { authClient, signOut } from "@/lib/auth-client";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(authClient.useSession).mockReturnValue({
    data: { user: { email: "test@exemple.com" } },
  } as any);
  vi.mocked(authClient.emailOtp.sendVerificationOtp).mockResolvedValue({ data: {}, error: null });
});

describe("EmailNotVerifiedPage", () => {
  it("renders heading", () => {
    render(<EmailNotVerifiedPage />);
    expect(screen.getByText("Vérifiez votre email")).toBeInTheDocument();
  });

  it("renders masked email in description", () => {
    render(<EmailNotVerifiedPage />);
    expect(screen.getByText(/t\*+@exemple\.com/)).toBeInTheDocument();
  });

  it("renders resend button", () => {
    render(<EmailNotVerifiedPage />);
    expect(screen.getByRole("button", { name: /renvoyer le code/i })).toBeInTheDocument();
  });

  it("renders sign out button", () => {
    render(<EmailNotVerifiedPage />);
    expect(screen.getByRole("button", { name: /se déconnecter/i })).toBeInTheDocument();
  });

  it("calls sendVerificationOtp and redirects to /verifier-email on resend", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.emailOtp.sendVerificationOtp).mockImplementation(function (_data, callbacks: any) {
      callbacks?.onSuccess?.();
      return Promise.resolve({ data: {}, error: null });
    });
    render(<EmailNotVerifiedPage />);
    await user.click(screen.getByRole("button", { name: /renvoyer le code/i }));
    expect(authClient.emailOtp.sendVerificationOtp).toHaveBeenCalledWith(
      { email: "test@exemple.com", type: "email-verification" },
      expect.any(Object)
    );
    expect(mockPush).toHaveBeenCalledWith("/verifier-email");
    expect(sessionStorage.getItem("otp_email")).toBe("test@exemple.com");
  });

  it("shows error when resend fails", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.emailOtp.sendVerificationOtp).mockImplementation(function (_data, callbacks: any) {
      callbacks?.onError?.({ error: { message: "Trop de tentatives" } });
      return Promise.resolve({ data: null, error: { message: "Trop de tentatives" } });
    });
    render(<EmailNotVerifiedPage />);
    await user.click(screen.getByRole("button", { name: /renvoyer le code/i }));
    expect(screen.getByText(/trop de tentatives/i)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("disables resend button when no session email", () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
    } as any);
    render(<EmailNotVerifiedPage />);
    expect(screen.getByRole("button", { name: /renvoyer le code/i })).toBeDisabled();
  });

  it("calls signOut and redirects to /connexion on sign out", async () => {
    const user = userEvent.setup();
    render(<EmailNotVerifiedPage />);
    await user.click(screen.getByRole("button", { name: /se déconnecter/i }));
    expect(signOut).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/connexion");
  });
});
