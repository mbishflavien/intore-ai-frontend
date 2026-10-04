import { NextResponse, type NextRequest } from "next/server";

/**
 * Same-origin API proxy: /api/* → the backend (API_ORIGIN).
 *
 * Serving the API from the app's own origin is what lets the session cookie be
 * HttpOnly + SameSite=Strict (a cross-site cookie to *.onrender.com would need
 * SameSite=None and is blocked outright by browsers that drop third-party cookies).
 *
 * The backend sees Vercel's IP on every proxied request, so the real client IP is
 * forwarded in x-intore-client-ip, taken from headers Vercel itself sets (clients can't
 * forge them). When PROXY_SECRET is configured on both sides, the backend only trusts
 * that header alongside the matching x-intore-proxy-secret.
 */
export function middleware(request: NextRequest) {
  const origin = process.env.API_ORIGIN;
  if (!origin) {
    return NextResponse.json({ error: "API_ORIGIN is not configured" }, { status: 503 });
  }

  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, origin);
  const headers = new Headers(request.headers);
  // Never pass through client-supplied values for the trusted headers.
  headers.delete("x-intore-client-ip");
  headers.delete("x-intore-proxy-secret");

  const clientIp = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (clientIp) headers.set("x-intore-client-ip", clientIp);
  if (process.env.PROXY_SECRET) headers.set("x-intore-proxy-secret", process.env.PROXY_SECRET);

  return NextResponse.rewrite(target, { request: { headers } });
}

export const config = {
  matcher: "/api/:path*",
};
