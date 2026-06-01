// tests/components/compte/change-password-dialog.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChangePasswordDialog } from "@/components/compte/change-password-dialog";

vi.mock("@/lib/auth-client", () => ({
  changePassword: vi.fn(),
}));
import { changePassword } from "@/lib/auth-client";

beforeEach(() => {
  vi.clearAllMocks();
});

async function fill(label: RegExp, value: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(label), value);
}

describe("ChangePasswordDialog", () => {
  it("bloque si le nouveau mot de passe fait moins de 8 caractères", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordDialog open onOpenChange={() => {}} />);
    await fill(/mot de passe actuel/i, "ancien123");
    await fill(/^nouveau mot de passe/i, "court");
    await fill(/confirmer/i, "court");
    await user.click(screen.getByRole("button", { name: /changer|enregistrer/i }));
    expect(screen.getByText(/8 caractères/i)).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("bloque si la confirmation ne correspond pas", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordDialog open onOpenChange={() => {}} />);
    await fill(/mot de passe actuel/i, "ancien123");
    await fill(/^nouveau mot de passe/i, "nouveau123");
    await fill(/confirmer/i, "different123");
    await user.click(screen.getByRole("button", { name: /changer|enregistrer/i }));
    expect(screen.getByText(/ne correspondent pas/i)).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  it("appelle changePassword au succès", async () => {
    vi.mocked(changePassword).mockResolvedValue({ data: {}, error: null } as never);
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ChangePasswordDialog open onOpenChange={onOpenChange} />);
    await fill(/mot de passe actuel/i, "ancien123");
    await fill(/^nouveau mot de passe/i, "nouveau123");
    await fill(/confirmer/i, "nouveau123");
    await user.click(screen.getByRole("button", { name: /changer|enregistrer/i }));
    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: "ancien123",
      newPassword: "nouveau123",
      revokeOtherSessions: true,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
