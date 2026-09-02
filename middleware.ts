import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const protectedPrefixes = ["/settings", "/dashboard", "/agenda", "/patients", "/billing", "/estimates", "/migration", "/reports"];
export function middleware(request: NextRequest) {
  const needsAuth = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));
  if (needsAuth && !getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ["/settings/:path*", "/dashboard/:path*", "/agenda/:path*", "/patients/:path*", "/billing/:path*", "/estimates/:path*", "/migration/:path*", "/reports/:path*"] };
