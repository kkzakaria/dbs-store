import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const { pathname } = request.nextUrl;

  // Not authenticated — redirect to sign-in
  if (!session?.user) {
    const signInUrl = new URL("/connexion", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Admin routes — check org membership
  if (pathname.startsWith("/admin")) {
    const orgs = await auth.api
      .listOrganizations({
        headers: request.headers,
      })
      .catch(() => null);

    const isMember =
      Array.isArray(orgs) &&
      orgs.some((org: { slug: string }) => org.slug === "dbs-store");

    if (!isMember) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/compte/:path*"],
};
