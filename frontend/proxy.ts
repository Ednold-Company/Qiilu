import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const authRoutes = new Set(["/login", "/signup"]);
const adminRoute = "/admin";
const passengerRoute = "/passenger";
const driverRoute = "/driver";

function getDashboardForRole(role: string | undefined) {
  if (role === "ADMIN") {
    return adminRoute;
  }

  if (role === "DRIVER") {
    return driverRoute;
  }

  if (role === "PASSENGER") {
    return passengerRoute;
  }

  return "/login";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("qiilu-role")?.value;
  const hasAuth = request.cookies.get("qiilu-auth")?.value === "1";

  if (authRoutes.has(pathname) && hasAuth) {
    return NextResponse.redirect(new URL(getDashboardForRole(role), request.url));
  }

  if (pathname.startsWith(passengerRoute)) {
    if (!hasAuth) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (role !== "PASSENGER") {
      return NextResponse.redirect(new URL(getDashboardForRole(role), request.url));
    }
  }

  if (pathname.startsWith(driverRoute)) {
    if (!hasAuth) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (role !== "DRIVER") {
      return NextResponse.redirect(new URL(getDashboardForRole(role), request.url));
    }
  }

  if (pathname.startsWith(adminRoute)) {
    if (!hasAuth) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL(getDashboardForRole(role), request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/signup", "/passenger/:path*", "/driver/:path*", "/admin/:path*"]
};
