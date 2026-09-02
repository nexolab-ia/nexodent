import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/settings", "/agenda", "/patients", "/billing", "/estimates", "/migration", "/reports"];
export function middleware(request: NextRequest) {
  if (protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix)) && !request.cookies.has("better-auth.session_token")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ["/settings/:path*", "/agenda/:path*", "/patients/:path*", "/billing/:path*", "/estimates/:path*", "/migration/:path*", "/reports/:path*"] };
