import { NextRequest, NextResponse } from "next/server"
import { loginAdmin, ADMIN_COOKIE, isValidAdminToken } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"

/** POST /api/admin/login — password -> HMAC-signed httpOnly session cookie. */
export async function POST(req: NextRequest) {
  let body: { password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  const password = String(body.password ?? "")
  const token = await loginAdmin(password)

  if (!token) {
    return NextResponse.json({ error: "Incorrect password. Please try again." }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
  return res
}

/** GET /api/admin/login — session probe used by the client login page. */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value
  const valid = await isValidAdminToken(token)
  return NextResponse.json({ authenticated: valid })
}
