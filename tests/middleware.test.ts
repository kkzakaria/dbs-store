import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

describe("middleware config", () => {
  it("exports matcher for admin and compte routes", async () => {
    const { config } = await import("@/middleware");
    expect(config.matcher).toContain("/admin/:path*");
    expect(config.matcher).toContain("/compte/:path*");
  });
});
