import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route-level guard is defense-in-depth only: every admin API use case and
// every admin page re-checks membership server-side (see requireAdmin).
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin")) {
    const hasSession = req.cookies.has("studio_admin_session");
    if (!hasSession && pathname !== "/admin/sign-in") {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/sign-in";
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
