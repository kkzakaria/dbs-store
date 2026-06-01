import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRequireOrgMember, mockGetContext, putMock } = vi.hoisted(() => ({
  mockRequireOrgMember: vi.fn().mockResolvedValue(undefined),
  mockGetContext: vi.fn(),
  putMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/actions/admin-auth", () => ({ requireOrgMember: mockRequireOrgMember }));
vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: mockGetContext }));

import { uploadBannerImage } from "@/lib/actions/admin-upload";

function form(file: File | null): FormData {
  const fd = new FormData();
  if (file) fd.append("file", file);
  return fd;
}

describe("uploadBannerImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireOrgMember.mockResolvedValue(undefined);
    mockGetContext.mockResolvedValue({ env: { MEDIA: { put: putMock } } });
  });

  it("lève UNAUTHORIZED si pas membre org", async () => {
    mockRequireOrgMember.mockRejectedValueOnce(new Error("UNAUTHORIZED"));
    await expect(
      uploadBannerImage(form(new File(["x"], "a.png", { type: "image/png" })))
    ).rejects.toThrow("UNAUTHORIZED");
  });

  it("retourne une erreur si aucun fichier", async () => {
    const res = await uploadBannerImage(form(null));
    expect(res).toHaveProperty("error");
    expect(putMock).not.toHaveBeenCalled();
  });

  it("rejette un type de fichier non autorisé", async () => {
    const res = await uploadBannerImage(
      form(new File(["x"], "a.js", { type: "application/javascript" }))
    );
    expect(res).toEqual({ error: expect.stringMatching(/type/i) });
    expect(putMock).not.toHaveBeenCalled();
  });

  it("écrit dans MEDIA et renvoie un chemin /api/media/banners/", async () => {
    const res = await uploadBannerImage(
      form(new File(["x"], "promo.png", { type: "image/png" }))
    );
    expect(putMock).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ path: expect.stringMatching(/^\/api\/media\/banners\//) });
  });
});
