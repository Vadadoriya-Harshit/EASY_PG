import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { authSecretBytes } from "@/lib/secret";

const COOKIE = "sorath_admin";
const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const PUBLIC_ADMIN_PAGES = new Set(["/admin/login", "/admin/verify-otp"]);

async function hasValidToken(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, authSecretBytes(), { issuer: "luxora-pg", audience: "luxora-admin", algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

/** Blocks cross-site state-changing requests. SameSite=Strict cookies are the first layer; this is the second. */
function crossSite(req: NextRequest) {
  if (!UNSAFE.has(req.method)) return false;
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (origin) {
    try { return new URL(origin).host !== host; } catch { return true; }
  }
  return req.headers.get("sec-fetch-site") === "cross-site";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // HTTPS only in production (behind a proxy/CDN that sets x-forwarded-proto)
  const hostName = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(":")[0].toLowerCase();
  const isLocalHost = hostName === "localhost" || hostName === "127.0.0.1" || hostName === "[::1]" || hostName.endsWith(".localhost");
  if (
    process.env.NODE_ENV === "production" &&
    process.env.FORCE_HTTPS !== "false" &&
    !isLocalHost &&
    req.headers.get("x-forwarded-proto") === "http"
  ) {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  if (pathname.startsWith("/api/") && crossSite(req)) {
    return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const isAdminApi = pathname.startsWith("/api/admin");
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdminApi || (isAdminPage && !PUBLIC_ADMIN_PAGES.has(pathname))) {
    if (!(await hasValidToken(req))) {
      if (isAdminApi) {
        return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
      }
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }
  }

  // Let server layouts know which route is being rendered (used by the admin layout's session guard).
  const forwarded = new Headers(req.headers);
  forwarded.set("x-pathname", pathname);
  const res = NextResponse.next({ request: { headers: forwarded } });
  if (isAdminPage || pathname.startsWith("/api/admin") || pathname.startsWith("/api/auth")) {
    res.headers.set("Cache-Control", "no-store, max-age=0");
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  return res;
}

// Everything except build assets and static files: the HTTPS redirect must also cover public pages.
export const config = {
  matcher: ["/((?!_next/static|_next/image|images/|placeholders/|favicon\\.svg|icon\\.svg|robots\\.txt|sitemap\\.xml).*)"],
};
