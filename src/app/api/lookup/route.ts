import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { clientIp, rateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

const lookupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
})

/**
 * POST /api/lookup
 * Lets a registered student recover their referral dashboard by email.
 * Returns only the referral code (no PII beyond what they already know).
 * Rate-limited: 5 attempts / minute / IP (brute-force guard).
 */
export async function POST(req: NextRequest) {
  const rl = rateLimit(`lookup:${clientIp(req.headers)}`, 5, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const parsed = lookupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." },
      { status: 400 },
    )
  }

  const registration = await db.registration.findUnique({
    where: { email: parsed.data.email },
    select: { referralCode: true, fullName: true },
  })

  if (!registration) {
    return NextResponse.json(
      { error: "No registration found for that email. Double-check it or register first." },
      { status: 404 },
    )
  }

  return NextResponse.json({
    ok: true,
    referralCode: registration.referralCode,
    firstName: registration.fullName.split(" ")[0],
  })
}
