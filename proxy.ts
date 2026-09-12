import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

// Next 16 renamed `middleware.ts` to `proxy.ts`; it runs on the Node.js
// runtime by default.
//
// This is the OPTIMISTIC check only — it reads the signed cookie and nothing
// else. Per the Next.js auth guide, proxy runs on every request (including
// prefetches), so it must not hit the database. The authoritative check lives
// in lib/auth/dal.ts, which every data-touching route/action calls.
const PUBLIC_PATHS = ["/login"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const session = verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    if (isPublic) return NextResponse.next();
    const loginUrl = new URL("/login", request.nextUrl);
    // Remember where they were headed so login can send them back.
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already signed in — no reason to show the login form again.
  if (isPublic) {
    return NextResponse.redirect(new URL("/child-report", request.nextUrl));
  }

  if (pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL("/child-report", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  // Everything except Next's internals, static assets, and /api. API routes
  // are excluded on purpose: a fetch() should get a 401 from the handler, not
  // an HTML redirect to the login page. Those handlers check auth themselves.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|svg|gif|webp|ico|woff2?)$).*)"],
};
