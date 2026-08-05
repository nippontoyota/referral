import { NextResponse, type NextRequest } from "next/server";

import {
  SESSION_COOKIE,
  verifySessionToken,
} from "@/lib/session";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!(await verifySessionToken(token))) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
