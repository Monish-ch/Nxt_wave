import { cookies } from "next/headers"
import { ADMIN_COOKIE, isValidAdminToken } from "@/lib/admin-auth"

/**
 * Server-side guard for admin API routes and admin pages.
 * Reads the httpOnly session cookie and verifies its HMAC signature.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies()
  const token = store.get(ADMIN_COOKIE)?.value
  return isValidAdminToken(token)
}
