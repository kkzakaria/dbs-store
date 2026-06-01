// tests/lib/actions/avatar-upload.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const getCachedSession = vi.fn();
const createPresignedUpload = vi.fn();

vi.mock("@/lib/session", () => ({ getCachedSession: () => getCachedSession() }));
vi.mock("@/lib/r2", () => ({
  ALLOWED_CONTENT_TYPES: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  createPresignedUpload: (...args: unknown[]) => createPresignedUpload(...args),
}));

import { generateAvatarUploadUrl } from "@/lib/actions/avatar-upload";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateAvatarUploadUrl", () => {
  it("rejette si aucun utilisateur connecté", async () => {
    getCachedSession.mockResolvedValue(null);
    await expect(
      generateAvatarUploadUrl("a.png", "image/png")
    ).rejects.toThrow(/connecté/i);
    expect(createPresignedUpload).not.toHaveBeenCalled();
  });

  it("rejette un type de fichier non autorisé", async () => {
    getCachedSession.mockResolvedValue({ user: { id: "u1" } });
    await expect(
      generateAvatarUploadUrl("a.svg", "image/svg+xml")
    ).rejects.toThrow(/non autorisé/i);
    expect(createPresignedUpload).not.toHaveBeenCalled();
  });

  it("génère une URL préfixée par l'id utilisateur", async () => {
    getCachedSession.mockResolvedValue({ user: { id: "u1" } });
    createPresignedUpload.mockResolvedValue({
      uploadUrl: "https://up",
      publicUrl: "https://pub",
    });
    const res = await generateAvatarUploadUrl("a.png", "image/png");
    expect(createPresignedUpload).toHaveBeenCalledWith("avatars/u1", "a.png", "image/png");
    expect(res).toEqual({ uploadUrl: "https://up", publicUrl: "https://pub" });
  });
});
