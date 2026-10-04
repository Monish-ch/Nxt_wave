import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { parseRegistrationPayload, flattenZodErrors } from "@/lib/validation"
import { createUniqueReferralCode } from "@/lib/referral-server"
import { normalizeReferralCode } from "@/lib/referral"
import { getMilestoneProgress } from "@/lib/milestones"
import { canonicalizeCollege } from "@/lib/college-normalize"
import { clientIp, rateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

/**
 * POST /api/register
 *
 * Rate-limited to 12 submissions / minute / IP (permitted bursts from shared
 * campus Wi-Fi NATs still work, bots don't).
 *
 * Registration flow:
 *  1. Validate input (zod)
 *  2. Check duplicate email
 *  3. Validate referral code if present (and block self-referral)
 *  4. Generate unique referral code
 *  5. Insert registration
 *  6. Create referral record if applicable
 *  7. Return registration + referral information
 */
export async function POST(req: NextRequest) {
  const rl = rateLimit(`register:${clientIp(req.headers)}`, 12, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: `Too many registration attempts. Please wait ${rl.retryAfterSeconds}s and try again.`,
        code: "RATE_LIMITED",
      },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    )
  }

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body.", code: "BAD_REQUEST" }, { status: 400 })
  }

  // 1. Validate input ----------------------------------------------------------
  const parsed = parseRegistrationPayload(payload)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please fix the highlighted fields.",
        code: "VALIDATION_ERROR",
        fields: flattenZodErrors(parsed.error),
      },
      { status: 400 },
    )
  }
  const input = parsed.data
  const email = input.email.toLowerCase().trim()
  const refCode = normalizeReferralCode(input.refCode || "")

  try {
    // 2. Duplicate email check ---------------------------------------------------
    const existing = await db.registration.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        {
          error: "This email is already registered for the workshop.",
          code: "DUPLICATE_EMAIL",
          referralCode: existing.referralCode,
        },
        { status: 409 },
      )
    }

    // 3. Validate referral code --------------------------------------------------
    let referrer: { id: string; fullName: string; email: string; referralCode: string } | null = null
    if (refCode) {
      const found = await db.registration.findUnique({ where: { referralCode: refCode } })
      if (!found) {
        return NextResponse.json(
          {
            error: `Referral code "${refCode}" is not valid. Clear it or continue without it.`,
            code: "INVALID_REFERRAL",
          },
          { status: 400 },
        )
      }
      if (found.email === email) {
        return NextResponse.json(
          { error: "You can't use your own referral code.", code: "SELF_REFERRAL" },
          { status: 400 },
        )
      }
      referrer = found
    }

    // Source hygiene: "referral" source without a valid referrer downgrades to other.
    let source = input.source
    if (source === "referral" && !referrer) source = "other"

    // College data hygiene: merge free-typed spellings into the canonical form
    // the college standings already rank ("cbit hyderabad" → "(CBIT)" entry).
    let college = input.college.trim()
    const collegeIndex = await db.registration.groupBy({
      by: ["college"],
      _count: true,
      where: { college: { not: null } },
      orderBy: { _count: { college: "desc" } },
    })
    college = canonicalizeCollege(
      college,
      collegeIndex.map((c) => c.college as string),
    ).value

    // 4. Generate unique referral code ------------------------------------------
    const myCode = await createUniqueReferralCode(input.fullName)

    // 5 + 6. Insert registration + referral record -------------------------------
    const registration = await db.$transaction(async (tx) => {
      const created = await tx.registration.create({
        data: {
          fullName: input.fullName.trim(),
          email,
          whatsapp: input.whatsapp.trim(),
          college,
          branch: input.branch.trim(),
          graduationYear: input.graduationYear,
          source,
          sourceCode: input.sourceCode || (referrer ? referrer.referralCode : null),
          shareVariant: input.shareVariant ?? null,
          referralCode: myCode,
          referredById: referrer ? referrer.id : null,
        },
      })

      if (referrer) {
        await tx.referral.create({
          data: {
            referrerId: referrer.id,
            referredId: created.id,
            referralCode: referrer.referralCode,
            status: "completed",
          },
        })
      }
      return created
    })

    // 7. Respond with referral information ----------------------------------------
    const referralCount = await db.referral.count({ where: { referrerId: registration.id } })
    const milestoneProgress = getMilestoneProgress(referralCount)

    return NextResponse.json(
      {
        ok: true,
        registration: {
          id: registration.id,
          fullName: registration.fullName,
          email: registration.email,
          referralCode: registration.referralCode,
          source: registration.source,
          createdAt: registration.createdAt,
        },
        referredBy: referrer
          ? { firstName: referrer.fullName.split(" ")[0], referralCode: referrer.referralCode }
          : null,
        referralStats: milestoneProgress,
      },
      { status: 201 },
    )
  } catch (err: unknown) {
    // Handle race-condition unique constraint on email or referral code.
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes("email")) {
      return NextResponse.json(
        { error: "This email is already registered for the workshop.", code: "DUPLICATE_EMAIL" },
        { status: 409 },
      )
    }
    console.error("[register] unexpected error:", err)
    return NextResponse.json(
      { error: "Something went wrong on our side. Please try again.", code: "SERVER_ERROR" },
      { status: 500 },
    )
  }
}
