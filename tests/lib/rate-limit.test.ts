import { describe, it, expect, vi, beforeEach } from "vitest";

const mockKvStore = {
  get: vi.fn(),
  put: vi.fn(),
};

vi.mock("@/lib/kv", () => ({
  getKv: vi.fn().mockResolvedValue(mockKvStore),
}));

const { checkRateLimit } = await import("@/lib/rate-limit");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkRateLimit", () => {
  it("allows the first request (no existing key)", async () => {
    mockKvStore.get.mockResolvedValue(null);
    const allowed = await checkRateLimit("test-key", 3, 3600);
    expect(allowed).toBe(true);
    expect(mockKvStore.put).toHaveBeenCalledWith("test-key", "1", { expirationTtl: 3600 });
  });

  it("allows requests under the limit", async () => {
    mockKvStore.get.mockResolvedValue("2");
    const allowed = await checkRateLimit("test-key", 3, 3600);
    expect(allowed).toBe(true);
    expect(mockKvStore.put).toHaveBeenCalledWith("test-key", "3", { expirationTtl: 3600 });
  });

  it("blocks requests at the limit", async () => {
    mockKvStore.get.mockResolvedValue("3");
    const allowed = await checkRateLimit("test-key", 3, 3600);
    expect(allowed).toBe(false);
    expect(mockKvStore.put).not.toHaveBeenCalled();
  });

  it("blocks requests over the limit", async () => {
    mockKvStore.get.mockResolvedValue("5");
    const allowed = await checkRateLimit("test-key", 3, 3600);
    expect(allowed).toBe(false);
  });
});
