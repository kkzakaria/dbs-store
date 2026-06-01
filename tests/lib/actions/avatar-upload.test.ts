import { describe, it, expect, vi, beforeEach } from "vitest";

const { getCachedSession, mockGetContext, putMock } = vi.hoisted(() => ({
  getCachedSession: vi.fn(),
  mockGetContext: vi.fn(),
  putMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/session", () => ({ getCachedSession: () => getCachedSession() }));
vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: mockGetContext }));

import { uploadAvatarImage } from "@/lib/actions/avatar-upload";

function form(file: File | null): FormData {
  const fd = new FormData();
  if (file) fd.append("file", file);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetContext.mockResolvedValue({ env: { MEDIA: { put: putMock } } });
});

describe("uploadAvatarImage", () => {
  it("rejette si aucun utilisateur connecté", async () => {
    getCachedSession.mockResolvedValue(null);
    const res = await uploadAvatarImage(form(new File(["x"], "a.png", { type: "image/png" })));
    expect(res.error).toMatch(/connecté/i);
    expect(putMock).not.toHaveBeenCalled();
  });

  it("rejette un type de fichier non autorisé", async () => {
    getCachedSession.mockResolvedValue({ user: { id: "u1" } });
    const res = await uploadAvatarImage(form(new File(["x"], "a.svg", { type: "image/svg+xml" })));
    expect(res.error).toMatch(/non autorisé/i);
    expect(putMock).not.toHaveBeenCalled();
  });

  it("écrit sous avatars/<userId> et renvoie un chemin /api/media/avatars/", async () => {
    getCachedSession.mockResolvedValue({ user: { id: "u1" } });
    const res = await uploadAvatarImage(form(new File(["x"], "a.png", { type: "image/png" })));
    expect(putMock).toHaveBeenCalledTimes(1);
    expect(putMock.mock.calls[0][0]).toMatch(/^avatars\/u1\//);
    expect(res.path).toMatch(/^\/api\/media\/avatars\/u1\//);
    expect(res.error).toBeUndefined();
  });
});
