// tests/components/compte/edit-name-dialog.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditNameDialog } from "@/components/compte/edit-name-dialog";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("@/lib/auth-client", () => ({
  updateUser: vi.fn(),
}));
import { updateUser } from "@/lib/auth-client";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EditNameDialog", () => {
  it("bloque la soumission si le nom est vide", async () => {
    const user = userEvent.setup();
    render(<EditNameDialog open onOpenChange={() => {}} currentName="" />);
    await user.click(screen.getByRole("button", { name: /enregistrer/i }));
    expect(screen.getByText(/nom.*requis|saisir.*nom/i)).toBeInTheDocument();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("appelle updateUser puis refresh au succès", async () => {
    vi.mocked(updateUser).mockResolvedValue({ data: {}, error: null } as never);
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<EditNameDialog open onOpenChange={onOpenChange} currentName="Jean" />);
    const input = screen.getByLabelText("Nom");
    await user.clear(input);
    await user.type(input, "Jean Dupont");
    await user.click(screen.getByRole("button", { name: /enregistrer/i }));
    expect(updateUser).toHaveBeenCalledWith({ name: "Jean Dupont" });
    expect(mockRefresh).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
