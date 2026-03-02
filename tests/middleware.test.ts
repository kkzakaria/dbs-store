import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => {
  const redirect = vi.fn((url: URL) => ({ type: "redirect", url: url.toString() }));
  const next = vi.fn(() => ({ type: "next" }));
  return {
    NextResponse: { redirect, next },
    NextRequest: class {
      constructor(public url: string) {}
      get nextUrl() { return new URL(this.url); }
      get headers() { return new Headers(); }
      cookies = { get: vi.fn() };
    },
  };
});

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
      listOrganizations: vi.fn(),
    },
  },
}));

import { proxy } from "@/proxy";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>;
const mockListOrgs = auth.api.listOrganizations as ReturnType<typeof vi.fn>;

const verifiedUser = { id: "1", email: "admin@dbs-store.ci", emailVerified: true };
const unverifiedUser = { id: "2", email: "user@test.ci", emailVerified: false };

function makeRequest(path: string) {
  return new NextRequest(`http://localhost:33000${path}`);
}

describe("proxy", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirige vers /connexion si getSession échoue", async () => {
    mockGetSession.mockRejectedValue(new Error("DB error"));
    await proxy(makeRequest("/admin"));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/connexion" })
    );
  });

  it("redirige vers /connexion si non authentifié", async () => {
    mockGetSession.mockResolvedValue({ user: null });
    await proxy(makeRequest("/admin"));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/connexion" })
    );
  });

  it("redirige vers /email-non-verifie si email non vérifié", async () => {
    mockGetSession.mockResolvedValue({ user: unverifiedUser });
    await proxy(makeRequest("/compte/profil"));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/email-non-verifie" })
    );
  });

  it("laisse passer /compte avec email vérifié", async () => {
    mockGetSession.mockResolvedValue({ user: verifiedUser });
    await proxy(makeRequest("/compte/profil"));
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it("redirige vers / si non membre de l'organisation pour /admin", async () => {
    mockGetSession.mockResolvedValue({ user: verifiedUser });
    mockListOrgs.mockResolvedValue([{ slug: "autre-org" }]);
    await proxy(makeRequest("/admin/produits"));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/" })
    );
  });

  it("laisse passer /admin avec membre de l'organisation", async () => {
    mockGetSession.mockResolvedValue({ user: verifiedUser });
    mockListOrgs.mockResolvedValue([{ slug: "dbs-store" }]);
    await proxy(makeRequest("/admin/produits"));
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it("redirige vers / si listOrganizations échoue", async () => {
    mockGetSession.mockResolvedValue({ user: verifiedUser });
    mockListOrgs.mockRejectedValue(new Error("DB error"));
    await proxy(makeRequest("/admin"));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/" })
    );
  });
});
