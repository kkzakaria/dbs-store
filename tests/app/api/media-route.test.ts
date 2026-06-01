import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetContext, getMock } = vi.hoisted(() => ({
  mockGetContext: vi.fn(),
  getMock: vi.fn(),
}));
vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: mockGetContext }));

import { GET } from "@/app/api/media/[...key]/route";

function ctx(key: string[]) {
  return { params: Promise.resolve({ key }) };
}

describe("GET /api/media/[...key]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetContext.mockResolvedValue({ env: { MEDIA: { get: getMock } } });
  });

  it("404 pour un préfixe non autorisé", async () => {
    const res = await GET(new Request("http://x/api/media/secret/x"), ctx(["secret", "x"]));
    expect(res.status).toBe(404);
    expect(getMock).not.toHaveBeenCalled();
  });

  it("404 si l'objet est absent", async () => {
    getMock.mockResolvedValueOnce(null);
    const res = await GET(new Request("http://x/api/media/banners/x.png"), ctx(["banners", "x.png"]));
    expect(res.status).toBe(404);
  });

  it("200 + content-type + cache long quand l'objet existe", async () => {
    getMock.mockResolvedValueOnce({
      body: new ReadableStream(),
      httpEtag: '"abc"',
      writeHttpMetadata: (h: Headers) => h.set("content-type", "image/png"),
    });
    const res = await GET(new Request("http://x/api/media/banners/x.png"), ctx(["banners", "x.png"]));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("cache-control")).toContain("immutable");
    expect(getMock).toHaveBeenCalledWith("banners/x.png");
  });
});
