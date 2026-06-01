import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRequireOrgMember, mockGetContext, putMock } = vi.hoisted(() => ({
  mockRequireOrgMember: vi.fn().mockResolvedValue(undefined),
  mockGetContext: vi.fn(),
  putMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/actions/admin-auth", () => ({ requireOrgMember: mockRequireOrgMember }));
vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: mockGetContext }));

import { uploadProductImage } from "@/lib/actions/admin-upload";

function form(file: File | null): FormData {
  const fd = new FormData();
  if (file) fd.append("file", file);
  return fd;
}

describe("uploadProductImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireOrgMember.mockResolvedValue(undefined);
    mockGetContext.mockResolvedValue({ env: { MEDIA: { put: putMock } } });
  });

  it("lève UNAUTHORIZED si pas membre org", async () => {
    mockRequireOrgMember.mockRejectedValueOnce(new Error("UNAUTHORIZED"));
    await expect(
      uploadProductImage(form(new File(["x"], "a.png", { type: "image/png" })))
    ).rejects.toThrow("UNAUTHORIZED");
  });

  it("rejette un type de fichier non autorisé", async () => {
    const res = await uploadProductImage(
      form(new File(["x"], "a.js", { type: "application/javascript" }))
    );
    expect(res).toEqual({ error: expect.stringMatching(/type/i) });
    expect(putMock).not.toHaveBeenCalled();
  });

  it("rejette un fichier trop volumineux (> 5 Mo) sans écrire", async () => {
    const big = new File(["x"], "big.png", { type: "image/png" });
    Object.defineProperty(big, "size", { value: 6 * 1024 * 1024 });
    const res = await uploadProductImage(form(big));
    expect(res).toEqual({ error: expect.stringMatching(/volumineux/i) });
    expect(putMock).not.toHaveBeenCalled();
  });

  it("écrit dans MEDIA et renvoie un chemin /api/media/products/", async () => {
    const res = await uploadProductImage(
      form(new File(["x"], "phone.png", { type: "image/png" }))
    );
    expect(putMock).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ path: expect.stringMatching(/^\/api\/media\/products\//) });
  });
});
