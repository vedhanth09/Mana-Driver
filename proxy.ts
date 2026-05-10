import { NextResponse, type NextRequest } from "next/server";
import { verifyAccess } from "@/utils/jwt.utils";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearedCookieOptions,
} from "@/utils/cookies.utils";
import type { UserRole } from "@/lib/constants/enums";

const AUTH_PAGES = new Set<string>(["/login", "/signup"]);

const ROLE_HOME: Record<UserRole, string> = {
  driver: "/driver",
  customer: "/customer",
  admin: "/",
};

function clearAuthCookies(res: NextResponse): NextResponse {
  res.cookies.set(ACCESS_TOKEN_COOKIE, "", clearedCookieOptions());
  res.cookies.set(REFRESH_TOKEN_COOKIE, "", clearedCookieOptions());
  return res;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  let role: UserRole | null = null;
  let valid = false;
  if (token) {
    try {
      ({ role } = verifyAccess(token));
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (AUTH_PAGES.has(pathname)) {
    if (valid && role) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
    }
    if (token && !valid) {
      const res = NextResponse.next();
      return clearAuthCookies(res);
    }
    return NextResponse.next();
  }

  const isDriverArea = pathname === "/driver" || pathname.startsWith("/driver/");
  const isCustomerArea =
    pathname === "/customer" || pathname.startsWith("/customer/");

  if (!isDriverArea && !isCustomerArea) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!valid || !role) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    return clearAuthCookies(res);
  }

  if ((isDriverArea && role !== "driver") || (isCustomerArea && role !== "customer")) {
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/driver/:path*", "/customer/:path*", "/login", "/signup"],
};
