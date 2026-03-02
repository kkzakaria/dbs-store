import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "better-auth.session_token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/admin") || pathname.startsWith("/compte");

  if (!isProtected) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    const loginUrl = new URL("/connexion", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/compte/:path*"],
};
