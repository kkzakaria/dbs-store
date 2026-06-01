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

  it("200 avec content-type, etag et cache long (sans writeHttpMetadata/body)", async () => {
    // En dev, @opennextjs/cloudflare proxifie le binding : writeHttpMetadata(Headers)
    // et object.body échouent (DevalueError). On lit via arrayBuffer + httpMetadata.
    const arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(3));
    getMock.mockResolvedValueOnce({
      httpMetadata: { contentType: "image/png" },
      httpEtag: '"abc"',
      arrayBuffer,
      // pièges à éviter : présents mais NON utilisés par la route
      body: new ReadableStream(),
      writeHttpMetadata: () => {
        throw new Error("writeHttpMetadata ne doit pas être appelé");
      },
    });
    const res = await GET(new Request("http://x/api/media/banners/x.png"), ctx(["banners", "x.png"]));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("etag")).toBe('"abc"');
    expect(res.headers.get("cache-control")).toContain("immutable");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(arrayBuffer).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledWith("banners/x.png");
    expect(await res.arrayBuffer()).toBeInstanceOf(ArrayBuffer);
  });

  it("500 (sans throw) si la lecture de l'objet échoue", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    getMock.mockResolvedValueOnce({
      httpMetadata: { contentType: "image/png" },
      httpEtag: '"e"',
      arrayBuffer: vi.fn().mockRejectedValue(new Error("read failed")),
    });
    const res = await GET(new Request("http://x/api/media/banners/x.png"), ctx(["banners", "x.png"]));
    expect(res.status).toBe(500);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("content-type par défaut si httpMetadata absent", async () => {
    getMock.mockResolvedValueOnce({
      httpMetadata: undefined,
      httpEtag: '"x"',
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1)),
    });
    const res = await GET(new Request("http://x/api/media/products/y.bin"), ctx(["products", "y.bin"]));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/octet-stream");
  });
});
