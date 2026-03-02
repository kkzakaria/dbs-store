import { describe, it, expect, vi, beforeEach } from "vitest";

// Le middleware utilise l'API Edge (NextRequest/NextResponse) — on mocke next/server
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

import { middleware } from "@/middleware";
import { NextRequest, NextResponse } from "next/server";

function makeRequest(path: string, hasCookie = false) {
  const req = new NextRequest(`http://localhost:33000${path}`);
  (req.cookies.get as ReturnType<typeof vi.fn>).mockReturnValue(
    hasCookie ? { value: "token123" } : undefined
  );
  return req;
}

describe("middleware", () => {
  beforeEach(() => vi.clearAllMocks());

  it("laisse passer les routes publiques", async () => {
    await middleware(makeRequest("/"));
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it("redirige /admin vers /connexion sans cookie", async () => {
    await middleware(makeRequest("/admin", false));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/connexion" })
    );
  });

  it("laisse passer /admin avec cookie", async () => {
    await middleware(makeRequest("/admin", true));
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it("redirige /compte vers /connexion sans cookie", async () => {
    await middleware(makeRequest("/compte/profil", false));
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/connexion" })
    );
  });

  it("laisse passer /compte avec cookie", async () => {
    await middleware(makeRequest("/compte/profil", true));
    expect(NextResponse.next).toHaveBeenCalled();
  });
});
