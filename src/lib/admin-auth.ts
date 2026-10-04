// ---------------------------------------------------------------------------
// Admin session — environment-variable password + HMAC-signed cookie token.
// Uses Web Crypto so the same code runs in middleware (edge) and API routes.
// ---------------------------------------------------------------------------

export const ADMIN_COOKIE = "nxw_admin_session"

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || "12345"
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message))
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/** The session token value derived from the current admin password. */
export async function computeAdminToken(): Promise<string> {
  return hmacHex(adminPassword(), "nxw-admin-session-v1")
}

/** Verify a candidate password and return the cookie token if correct. */
export async function loginAdmin(password: string): Promise<string | null> {
  if (password !== adminPassword()) return null
  return computeAdminToken()
}

/** Check whether a cookie value is a valid admin session token. */
export async function isValidAdminToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false
  const expected = await computeAdminToken()
  return token === expected
}

export function isDemoAdmin(): boolean {
  return !process.env.ADMIN_PASSWORD
}
