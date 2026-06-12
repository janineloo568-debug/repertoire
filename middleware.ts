import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthSecret } from "@/lib/auth/config";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: getAuthSecret(),
  });

  // Match auth.ts session callback: only `valid === false` means signed out.
  // Edge middleware may not see custom JWT fields, so don't require `valid === true`.
  const isLoggedIn = Boolean(token?.sub && token.valid !== false);

  const isAppRoute =
    req.nextUrl.pathname.startsWith("/library") ||
    req.nextUrl.pathname.startsWith("/suggestions") ||
    req.nextUrl.pathname.startsWith("/settings") ||
    req.nextUrl.pathname.startsWith("/feed");

  if (isAppRoute && !isLoggedIn) {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  if (
    isLoggedIn &&
    (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/register")
  ) {
    return NextResponse.redirect(new URL("/library", req.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/library/:path*",
    "/suggestions/:path*",
    "/settings/:path*",
    "/feed/:path*",
    "/login",
    "/register",
  ],
};
