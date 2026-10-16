import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = () =>
  new TextEncoder().encode(
    process.env.AUTH_SECRET || "sorath-pg-secure-auth-secret-key-32chars-min!"
  );

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Public authentication routes
  const isPublicAuthRoute =
    pathname === "/admin/login" ||
    pathname === "/admin/verify-otp" ||
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/verify-otp" ||
    pathname === "/api/auth/logout";

  if (isPublicAuthRoute) {
    // If already officially logged in, visiting login or verify-otp redirects straight to /admin
    if (pathname === "/admin/login" || pathname === "/admin/verify-otp") {
      const token = req.cookies.get("sorath_admin")?.value;
      if (token) {
        try {
          await jwtVerify(token, secret());
          const dest = req.nextUrl.clone();
          dest.pathname = "/admin";
          dest.search = "";
          return NextResponse.redirect(dest);
        } catch {
          // Token is invalid/expired - allow viewing login page
        }
      }
    }
    return NextResponse.next();
  }

  // 2. Official JWT Authentication check for all /admin and /api/admin routes
  const token = req.cookies.get("sorath_admin")?.value;
  let authenticated = false;

  if (token) {
    try {
      await jwtVerify(token, secret());
      authenticated = true;
    } catch {
      authenticated = false;
    }
  }

  // Authorized - allow request with high-security headers
  if (authenticated) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.headers.set("X-XSS-Protection", "1; mode=block");
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return res;
  }

  // Unauthorized API call
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Unauthorized. Official admin session required." },
      { status: 401 }
    );
  }

  // Unauthorized page access - redirect strictly to official admin login
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.search = "";
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};

