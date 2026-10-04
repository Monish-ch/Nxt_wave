import { NextRequest, NextResponse } from "next/server"
import { ADMIN_COOKIE, isValidAdminToken } from "@/lib/admin-auth"

/**
 * Admin route protection (Next.js 16 `proxy` convention, formerly `middleware`).
 * - /admin/** (except /admin/login) redirects to the login page when unauthenticated.
 * - /api/admin/** (except /api/admin/login) returns 401 when unauthenticated.
 */
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(ADMIN_COOKIE)?.value
  const authenticated = await isValidAdminToken(token)

  if (pathname.startsWith("/api/admin")) {
    if (pathname === "/api/admin/login") return NextResponse.next()
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
    }
    return NextResponse.next()
  }

  if (pathname === "/admin/login") {
    // Already signed in? Skip the login form.
    if (authenticated) {
      return NextResponse.redirect(new URL("/admin", req.url))
    }
    return NextResponse.next()
  }

  if (!authenticated) {
    const loginUrl = new URL("/admin/login", req.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}
