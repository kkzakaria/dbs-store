import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
};

vi.mock("@/lib/db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue(true),
}));

const mockHeaders = vi.fn().mockResolvedValue(new Headers());
vi.mock("next/headers", () => ({
  headers: () => mockHeaders(),
}));

const { subscribeNewsletter } = await import("@/lib/actions/newsletter");
const { checkRateLimit } = await import("@/lib/rate-limit");

beforeEach(() => {
  vi.clearAllMocks();
  (checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(true);
});

describe("subscribeNewsletter", () => {
  it("returns error when data is not an object", async () => {
    const result = await subscribeNewsletter("string");
    expect((result as { error?: string }).error).toBeDefined();
  });

  it("returns error when email is missing", async () => {
    const result = await subscribeNewsletter({ email: "" });
    expect((result as { error?: string }).error).toBeDefined();
  });

  it("returns error when email format is invalid", async () => {
    const result = await subscribeNewsletter({ email: "not-email" });
    expect((result as { error?: string }).error).toBeDefined();
  });

  it("returns error when honeypot field is filled", async () => {
    const result = await subscribeNewsletter({ email: "test@example.ci", website: "spam" });
    expect((result as { error?: string }).error).toBeDefined();
  });

  it("returns error when rate limited", async () => {
    (checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    const result = await subscribeNewsletter({ email: "test@example.ci" });
    expect((result as { error?: string }).error).toBeDefined();
  });

  it("returns success silently when email already exists", async () => {
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: "existing" }]),
      }),
    });
    const result = await subscribeNewsletter({ email: "existing@test.ci" });
    expect(result.success).toBe(true);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("inserts new subscriber on valid input", async () => {
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });
    const result = await subscribeNewsletter({ email: "new@test.ci" });
    expect(result.success).toBe(true);
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("normalizes email to lowercase and trimmed", async () => {
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    });
    const mockValues = vi.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values: mockValues });
    await subscribeNewsletter({ email: "  TEST@Example.CI  " });
    const insertedData = mockValues.mock.calls[0][0];
    expect(insertedData.email).toBe("test@example.ci");
  });
});
