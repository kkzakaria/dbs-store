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

const verifiedUser = { id: "1", email: "admin@dbs-store.ci", emailVerified: true };
const unverifiedUser = { id: "2", email: "user@test.ci", emailVerified: false };

describe("middleware", () => {
  let middleware: (req: NextRequest) => Promise<Response>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const mod = await import("@/middleware");
    middleware = mod.middleware;
  });

  afterEach(() => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("redirige vers /connexion avec callbackUrl si getSession échoue", async () => {
    mockGetSession.mockRejectedValue(new Error("DB error"));

    const response = await middleware(createRequest("/admin"));
    const redirectUrl = new URL(response.headers.get("location")!);

    expect(response.status).toBe(307);
    expect(redirectUrl.pathname).toBe("/connexion");
    expect(redirectUrl.searchParams.get("callbackUrl")).toBe("/admin");
  });

  it("redirige vers /connexion avec callbackUrl si non authentifié", async () => {
    mockGetSession.mockResolvedValue({ user: null });

    const response = await middleware(createRequest("/admin"));
    const redirectUrl = new URL(response.headers.get("location")!);

    expect(response.status).toBe(307);
    expect(redirectUrl.pathname).toBe("/connexion");
    expect(redirectUrl.searchParams.get("callbackUrl")).toBe("/admin");
  });

  it("redirige vers /connexion avec callbackUrl si non authentifié sur /compte", async () => {
    mockGetSession.mockResolvedValue(null);

    const response = await middleware(createRequest("/compte/profil"));
    const redirectUrl = new URL(response.headers.get("location")!);

    expect(response.status).toBe(307);
    expect(redirectUrl.pathname).toBe("/connexion");
    expect(redirectUrl.searchParams.get("callbackUrl")).toBe("/compte/profil");
  });

  it("redirige vers /email-non-verifie si email non vérifié", async () => {
    mockGetSession.mockResolvedValue({ user: unverifiedUser });

    const response = await middleware(createRequest("/compte/profil"));
    const redirectUrl = new URL(response.headers.get("location")!);

    expect(response.status).toBe(307);
    expect(redirectUrl.pathname).toBe("/email-non-verifie");
  });

  it("laisse passer /compte avec email vérifié", async () => {
    mockGetSession.mockResolvedValue({ user: verifiedUser });

    const response = await middleware(createRequest("/compte/profil"));

    expect(response.status).toBe(200);
    expect(mockListOrganizations).not.toHaveBeenCalled();
  });

  it("redirige vers / si non membre de l'organisation pour /admin", async () => {
    mockGetSession.mockResolvedValue({ user: verifiedUser });
    mockListOrganizations.mockResolvedValue([{ slug: "autre-org" }]);

    const response = await middleware(createRequest("/admin/produits"));
    const redirectUrl = new URL(response.headers.get("location")!);

    expect(response.status).toBe(307);
    expect(redirectUrl.pathname).toBe("/");
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("laisse passer /admin avec membre de l'organisation", async () => {
    mockGetSession.mockResolvedValue({ user: verifiedUser });
    mockListOrganizations.mockResolvedValue([{ slug: "dbs-store" }]);

    const response = await middleware(createRequest("/admin/produits"));

    expect(response.status).toBe(200);
  });

  it("redirige vers / si listOrganizations échoue", async () => {
    mockGetSession.mockResolvedValue({ user: verifiedUser });
    mockListOrganizations.mockRejectedValue(new Error("DB error"));

    const response = await middleware(createRequest("/admin"));
    const redirectUrl = new URL(response.headers.get("location")!);

    expect(response.status).toBe(307);
    expect(redirectUrl.pathname).toBe("/");
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
