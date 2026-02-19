import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetSession = vi.fn();
const mockListOrganizations = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      listOrganizations: (...args: unknown[]) => mockListOrganizations(...args),
    },
  },
}));

function createRequest(path: string) {
  return new NextRequest(new URL(path, "http://localhost:33000"));
}

describe("middleware config", () => {
  it("exports matcher for admin and compte routes", async () => {
    const { config } = await import("@/middleware");
    expect(config.matcher).toContain("/admin/:path*");
    expect(config.matcher).toContain("/compte/:path*");
  });

  it("uses nodejs runtime for better-sqlite3 compatibility", async () => {
    const { config } = await import("@/middleware");
    expect(config.runtime).toBe("nodejs");
  });
});

describe("middleware", () => {
  let middleware: (req: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/middleware");
    middleware = mod.middleware;
  });

  it("redirects to /connexion with callbackUrl when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await middleware(createRequest("/compte/profil"));
    const location = new URL(response.headers.get("location")!);

    expect(response.status).toBe(307);
    expect(location.pathname).toBe("/connexion");
    expect(location.searchParams.get("callbackUrl")).toBe("/compte/profil");
  });

  it("redirects to /email-non-verifie when authenticated user has unverified email", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "1", name: "Test", emailVerified: false } });

    const response = await middleware(createRequest("/compte/profil"));
    const location = new URL(response.headers.get("location")!);

    expect(response.status).toBe(307);
    expect(location.pathname).toBe("/email-non-verifie");
  });

  it("allows authenticated users through for /compte routes", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "1", name: "Test", emailVerified: true } });

    const response = await middleware(createRequest("/compte/profil"));

    expect(response.status).toBe(200);
  });

  it("redirects to / when authenticated user is not org member on /admin", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "1", name: "Test", emailVerified: true } });
    mockListOrganizations.mockResolvedValue([]);

    const response = await middleware(createRequest("/admin/dashboard"));
    const location = new URL(response.headers.get("location")!);

    expect(response.status).toBe(307);
    expect(location.pathname).toBe("/");
  });

  it("allows org members through on /admin routes", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "1", name: "Admin", emailVerified: true } });
    mockListOrganizations.mockResolvedValue([{ slug: "dbs-store" }]);

    const response = await middleware(createRequest("/admin/dashboard"));

    expect(response.status).toBe(200);
  });

  it("redirects to /connexion when getSession throws", async () => {
    mockGetSession.mockRejectedValue(new Error("service down"));

    const response = await middleware(createRequest("/compte/profil"));
    const location = new URL(response.headers.get("location")!);

    expect(response.status).toBe(307);
    expect(location.pathname).toBe("/connexion");
  });

  it("redirects to / when listOrganizations fails for admin routes", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "1", name: "Admin", emailVerified: true } });
    mockListOrganizations.mockRejectedValue(new Error("org service down"));

    const response = await middleware(createRequest("/admin/dashboard"));
    const location = new URL(response.headers.get("location")!);

    expect(response.status).toBe(307);
    expect(location.pathname).toBe("/");
  });
});
