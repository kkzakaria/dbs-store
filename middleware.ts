import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { ORG_SLUG } from "@/lib/constants";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");

  const auth = await getAuth();

  let session: Awaited<ReturnType<typeof auth.api.getSession>>;
  try {
    session = await auth.api.getSession({ headers: request.headers });
  } catch (err) {
    console.error(`[proxy] getSession failed (${pathname}):`, err);
    const url = new URL("/connexion", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (!session?.user) {
    const url = new URL("/connexion", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (!session.user.emailVerified) {
    return NextResponse.redirect(new URL("/email-non-verifie", request.url));
  }

  if (isAdminRoute) {
    let orgs: Awaited<ReturnType<typeof auth.api.listOrganizations>>;
    try {
      orgs = await auth.api.listOrganizations({ headers: request.headers });
    } catch (err) {
      console.error(`[proxy] listOrganizations failed (${pathname}):`, err);
      return NextResponse.redirect(new URL("/", request.url));
    }

    const isMember =
      Array.isArray(orgs) &&
      orgs.some((org: { slug: string }) => org.slug === ORG_SLUG);

    if (!isMember) {
      console.warn(`[proxy] acces admin refuse (${pathname}): non membre de l'organisation`);
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/compte/:path*"],
};
