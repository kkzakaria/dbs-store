import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");

  // For admin routes, fire both checks in parallel (async-parallel)
  const sessionPromise = auth.api.getSession({ headers: request.headers });
  const orgsPromise = isAdminRoute
    ? auth.api.listOrganizations({ headers: request.headers })
    : null;

  let session: Awaited<ReturnType<typeof auth.api.getSession>>;
  try {
    session = await sessionPromise;
  } catch (err) {
    console.error(`[proxy] getSession failed (${pathname}):`, err);
    const url = new URL("/connexion", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Not authenticated — redirect to sign-in
  if (!session?.user) {
    const url = new URL("/connexion", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated but email not verified — redirect to email-non-verifie
  if (!session.user.emailVerified) {
    return NextResponse.redirect(new URL("/email-non-verifie", request.url));
  }

  // Admin routes — check org membership (already started in parallel)
  if (isAdminRoute) {
    let orgs: Awaited<ReturnType<typeof auth.api.listOrganizations>> | null;
    try {
      orgs = await orgsPromise;
    } catch (err) {
      console.error(`[proxy] listOrganizations failed (${pathname}):`, err);
      const url = new URL("/connexion", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

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
