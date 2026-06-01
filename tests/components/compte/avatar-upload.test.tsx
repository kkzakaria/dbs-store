// tests/components/compte/avatar-upload.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AvatarUpload } from "@/components/compte/avatar-upload";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mockRefresh }) }));

vi.mock("@/lib/actions/avatar-upload", () => ({
  generateAvatarUploadUrl: vi.fn(),
}));
vi.mock("@/lib/auth-client", () => ({ updateUser: vi.fn() }));

import { generateAvatarUploadUrl } from "@/lib/actions/avatar-upload";
import { updateUser } from "@/lib/auth-client";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));
});

describe("AvatarUpload", () => {
  it("upload le fichier puis met à jour l'avatar et rafraîchit", async () => {
    vi.mocked(generateAvatarUploadUrl).mockResolvedValue({
      uploadUrl: "https://up",
      publicUrl: "https://pub/a.png",
    });
    vi.mocked(updateUser).mockResolvedValue({ data: {}, error: null } as never);

    const user = userEvent.setup();
    const { container } = render(<AvatarUpload name="Jean" image={null} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["x"], "a.png", { type: "image/png" });
    await user.upload(input, file);

    await waitFor(() => {
      expect(generateAvatarUploadUrl).toHaveBeenCalledWith("a.png", "image/png");
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://up",
      expect.objectContaining({ method: "PUT" })
    );
    expect(updateUser).toHaveBeenCalledWith({ image: "https://pub/a.png" });
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  });
});
