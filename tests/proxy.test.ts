import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

describe("proxy config", () => {
  it("exports matcher for admin and compte routes", async () => {
    const { config } = await import("@/proxy");
    expect(config.matcher).toContain("/admin/:path*");
    expect(config.matcher).toContain("/compte/:path*");
  });
});

describe("proxy", () => {
  let proxy: (req: NextRequest) => Promise<Response>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const mod = await import("@/proxy");
    proxy = mod.proxy;
  });

  afterEach(() => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("redirects to /connexion with callbackUrl when not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await proxy(createRequest("/compte/profil"));
    const location = new URL(response.headers.get("location")!);

    expect(response.status).toBe(307);
    expect(location.pathname).toBe("/connexion");
    expect(location.searchParams.get("callbackUrl")).toBe("/compte/profil");
  });

  it("redirects to /email-non-verifie when authenticated user has unverified email", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "1", name: "Test", emailVerified: false } });

    const response = await proxy(createRequest("/compte/profil"));
    const location = new URL(response.headers.get("location")!);

    expect(response.status).toBe(307);
    expect(location.pathname).toBe("/email-non-verifie");
  });

  it("allows authenticated users through for /compte routes", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "1", name: "Test", emailVerified: true } });

    const response = await proxy(createRequest("/compte/profil"));

    expect(response.status).toBe(200);
    expect(mockListOrganizations).not.toHaveBeenCalled();
  });

  it("redirects to / when authenticated user is not org member on /admin", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "1", name: "Test", emailVerified: true } });
    mockListOrganizations.mockResolvedValue([]);

    const response = await proxy(createRequest("/admin/dashboard"));
    const location = new URL(response.headers.get("location")!);

    expect(response.status).toBe(307);
    expect(location.pathname).toBe("/");
  });

  it("allows org members through on /admin routes", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "1", name: "Admin", emailVerified: true } });
    mockListOrganizations.mockResolvedValue([{ slug: "dbs-store" }]);

    const response = await proxy(createRequest("/admin/dashboard"));

    expect(response.status).toBe(200);
  });

  it("redirects to /connexion and logs error when getSession throws", async () => {
    const err = new Error("service down");
    mockGetSession.mockRejectedValue(err);

    const response = await proxy(createRequest("/compte/profil"));
    const location = new URL(response.headers.get("location")!);

    expect(response.status).toBe(307);
    expect(location.pathname).toBe("/connexion");
    expect(location.searchParams.get("callbackUrl")).toBe("/compte/profil");
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      "[proxy] getSession failed (/compte/profil):",
      err
    );
  });

  it("redirects to /connexion and logs error when getSession throws on admin route", async () => {
    const err = new Error("service down");
    mockGetSession.mockRejectedValue(err);

    const response = await proxy(createRequest("/admin/dashboard"));
    const location = new URL(response.headers.get("location")!);

    expect(response.status).toBe(307);
    expect(location.pathname).toBe("/connexion");
    expect(location.searchParams.get("callbackUrl")).toBe("/admin/dashboard");
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      "[proxy] getSession failed (/admin/dashboard):",
      err
    );
    expect(mockListOrganizations).not.toHaveBeenCalled();
  });

  it("redirects to / and logs error when listOrganizations fails", async () => {
    const err = new Error("org service down");
    mockGetSession.mockResolvedValue({ user: { id: "1", name: "Admin", emailVerified: true } });
    mockListOrganizations.mockRejectedValue(err);

    const response = await proxy(createRequest("/admin/dashboard"));
    const location = new URL(response.headers.get("location")!);

    expect(response.status).toBe(307);
    expect(location.pathname).toBe("/");
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      "[proxy] listOrganizations failed (/admin/dashboard):",
      err
    );
  });

  it("redirects to / when listOrganizations returns null or non-array", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "1", name: "Admin", emailVerified: true } });
    mockListOrganizations.mockResolvedValue(null);

    const response = await proxy(createRequest("/admin/dashboard"));
    const location = new URL(response.headers.get("location")!);

    expect(response.status).toBe(307);
    expect(location.pathname).toBe("/");
  });
});
