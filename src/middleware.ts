import { NextRequest, NextResponse } from "next/server";
import { getSecurityHeaders } from "./lib/security/csp";
export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const headers = new Headers(request.headers);
  const policy = getSecurityHeaders({
    nonce,
    development: process.env.NODE_ENV === "development",
  });
  for (const item of policy)
    if (item.key === "Content-Security-Policy")
      headers.set(item.key, item.value);
  headers.set("x-nonce", nonce);
  const response = NextResponse.next({ request: { headers } });
  for (const item of policy) response.headers.set(item.key, item.value);
  if (request.nextUrl.pathname.startsWith("/inspecciones"))
    response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|offline.html|icons/|manifest.webmanifest|robots.txt).*)",
  ],
};
