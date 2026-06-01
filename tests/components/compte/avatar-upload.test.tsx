// tests/components/compte/avatar-upload.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AvatarUpload } from "@/components/compte/avatar-upload";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mockRefresh }) }));

vi.mock("@/lib/actions/avatar-upload", () => ({
  uploadAvatarImage: vi.fn(),
}));
vi.mock("@/lib/auth-client", () => ({ updateUser: vi.fn() }));

import { uploadAvatarImage } from "@/lib/actions/avatar-upload";
import { updateUser } from "@/lib/auth-client";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AvatarUpload", () => {
  it("upload le fichier puis met à jour l'avatar et rafraîchit", async () => {
    vi.mocked(uploadAvatarImage).mockResolvedValue({ path: "/api/media/avatars/u1/a.png" });
    vi.mocked(updateUser).mockResolvedValue({ data: {}, error: null } as never);

    const user = userEvent.setup();
    const { container } = render(<AvatarUpload name="Jean" image={null} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["x"], "a.png", { type: "image/png" });
    await user.upload(input, file);

    await waitFor(() => {
      expect(uploadAvatarImage).toHaveBeenCalledTimes(1);
    });
    const fd = vi.mocked(uploadAvatarImage).mock.calls[0][0] as FormData;
    expect(fd.get("file")).toBeInstanceOf(File);
    expect(updateUser).toHaveBeenCalledWith({ image: "/api/media/avatars/u1/a.png" });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });

  it("affiche l'erreur et ne rafraîchit pas si updateUser échoue après l'upload", async () => {
    vi.mocked(uploadAvatarImage).mockResolvedValue({ path: "/api/media/avatars/u1/a.png" });
    vi.mocked(updateUser).mockResolvedValue({
      data: null,
      error: { message: "Mise à jour refusée" },
    } as never);

    const user = userEvent.setup();
    const { container, findByText } = render(<AvatarUpload name="Jean" image={null} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, new File(["x"], "a.png", { type: "image/png" }));

    expect(await findByText("Mise à jour refusée")).toBeDefined();
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
