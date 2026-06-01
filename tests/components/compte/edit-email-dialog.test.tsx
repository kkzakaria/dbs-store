// tests/components/compte/edit-email-dialog.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditEmailDialog } from "@/components/compte/edit-email-dialog";

vi.mock("@/lib/auth-client", () => ({
  changeEmail: vi.fn(),
}));
import { changeEmail } from "@/lib/auth-client";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EditEmailDialog", () => {
  it("bloque un email invalide", async () => {
    const user = userEvent.setup();
    render(<EditEmailDialog open onOpenChange={() => {}} currentEmail="a@b.com" />);
    await user.type(screen.getByLabelText(/nouvel email/i), "pasunemail");
    await user.click(screen.getByRole("button", { name: /envoyer|confirmer/i }));
    expect(screen.getByText(/email.*invalide|adresse.*invalide/i)).toBeInTheDocument();
    expect(changeEmail).not.toHaveBeenCalled();
  });

  it("appelle changeEmail et affiche le message de confirmation", async () => {
    vi.mocked(changeEmail).mockResolvedValue({ data: {}, error: null } as never);
    const user = userEvent.setup();
    render(<EditEmailDialog open onOpenChange={() => {}} currentEmail="a@b.com" />);
    await user.type(screen.getByLabelText(/nouvel email/i), "nouveau@exemple.com");
    await user.click(screen.getByRole("button", { name: /envoyer|confirmer/i }));
    expect(changeEmail).toHaveBeenCalledWith({
      newEmail: "nouveau@exemple.com",
      callbackURL: "/compte/profil",
    });
    expect(await screen.findByText(/lien de confirmation/i)).toBeInTheDocument();
  });

  it("affiche l'erreur traduite quand la vérification email n'est pas activée et ne passe pas en état 'envoyé'", async () => {
    vi.mocked(changeEmail).mockResolvedValue({
      data: null,
      error: { message: "Verification email isn't enabled" },
    } as never);
    const user = userEvent.setup();
    render(<EditEmailDialog open onOpenChange={() => {}} currentEmail="a@b.com" />);
    await user.type(screen.getByLabelText(/nouvel email/i), "nouveau@exemple.com");
    await user.click(screen.getByRole("button", { name: /envoyer|confirmer/i }));
    expect(
      await screen.findByText(/Vous devez d'abord vérifier votre adresse email actuelle\./i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/lien de confirmation/i)).not.toBeInTheDocument();
  });
});
