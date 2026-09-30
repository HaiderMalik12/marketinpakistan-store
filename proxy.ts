import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/app/lib/session-token";

// Optimistic check only: bounces logged-out visitors to the login page. Real
// authorization happens in requireAdmin()/isAdmin() inside pages, actions and
// route handlers.
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();

  const ok = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!ok) return NextResponse.redirect(new URL("/admin/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
