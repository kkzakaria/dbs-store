import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");

  try {
    // For admin routes, fire both checks in parallel (async-parallel)
    const sessionPromise = auth.api.getSession({
      headers: request.headers,
    });
    const orgsPromise = isAdminRoute
      ? auth.api.listOrganizations({ headers: request.headers }).catch((err) => {
          console.error(`[proxy] listOrganizations failed (${pathname}):`, err);
          return null;
        })
      : null;

    const session = await sessionPromise;

    // Not authenticated — redirect to sign-in
    if (!session?.user) {
      const signInUrl = new URL("/connexion", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Authenticated but email not verified — redirect to email-non-verifie
    if (!session.user.emailVerified) {
      return NextResponse.redirect(new URL("/email-non-verifie", request.url));
    }

    // Admin routes — check org membership (already started in parallel)
    if (isAdminRoute) {
      const orgs = await orgsPromise;

      const isMember =
        Array.isArray(orgs) &&
        orgs.some((org: { slug: string }) => org.slug === "dbs-store");

      if (!isMember) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    return NextResponse.next();
  } catch (err) {
    console.error(`[proxy] Auth check failed (${pathname}):`, err);
    const signInUrl = new URL("/connexion", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }
}

export const config = {
  matcher: ["/admin/:path*", "/compte/:path*"],
};
