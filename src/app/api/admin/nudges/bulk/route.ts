import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { isAdminAuthenticated } from "@/lib/admin-guard"
import { buildCampusGapLine, buildNudgeMessage, NEAR_MISS_COUNTS } from "@/lib/nudge"
import { MILESTONE_TIERS } from "@/lib/milestones"
import { getCollegeGapMap } from "@/lib/stats"

export const dynamic = "force-dynamic"

/** Hard cap per click — keeps the simulated outreach believable and rate-safe. */
const BULK_CAP = 25

const bulkSchema = z.object({
  mode: z.enum(["near_miss", "dormant"]),
  channel: z.enum(["whatsapp", "other"]).default("whatsapp"),
})

/**
 * POST /api/admin/nudges/bulk
 * One-click "remind everyone who hasn't been reminded yet":
 *  - mode "near_miss": all queued near-miss students with zero logged nudges
 *  - mode "dormant":   registered-but-never-referred students with zero logged nudges
 * Actively snoozed students are always skipped — snooze exists precisely so
 * bulk pushes don't double-touch someone ops asked us to leave alone.
 * Capped at BULK_CAP per call; the response reports how many remain for a
 * follow-up click so the operator stays in control.
 */
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const parsed = bulkSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "mode must be 'near_miss' or 'dormant'." }, { status: 400 })
  }
  const { mode, channel } = parsed.data

  // Students already reminded at least once are skipped — bulk = first touch only.
  const alreadyNudged = await db.nudge.groupBy({ by: ["registrationId"], _count: true })
  const nudgedIds = new Set(alreadyNudged.map((n) => n.registrationId))

  // Actively snoozed students are excluded at the query level (snoozedUntil
  // null, or already in the past = woken up).
  const notSnoozed = { OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: new Date() } }] }

  let candidates: {
    id: string
    fullName: string
    referralCode: string
    college: string | null
    directReferrals: number
  }[]
  if (mode === "near_miss") {
    const referrers = await db.registration.findMany({
      where: { directReferrals: { some: {} }, ...notSnoozed },
      select: {
        id: true,
        fullName: true,
        referralCode: true,
        college: true,
        _count: { select: { directReferrals: true } },
      },
    })
    candidates = referrers
      .filter((s) => NEAR_MISS_COUNTS.includes(s._count.directReferrals) && !nudgedIds.has(s.id))
      .map((s) => ({
        id: s.id,
        fullName: s.fullName,
        referralCode: s.referralCode,
        college: s.college,
        directReferrals: s._count.directReferrals,
      }))
  } else {
    const dormant = await db.registration.findMany({
      where: { directReferrals: { none: {} }, ...notSnoozed },
      select: { id: true, fullName: true, referralCode: true, college: true },
    })
    candidates = dormant
      .filter((s) => !nudgedIds.has(s.id))
      .map((s) => ({
        id: s.id,
        fullName: s.fullName,
        referralCode: s.referralCode,
        college: s.college,
        directReferrals: 0,
      }))
  }

  const batch = candidates.slice(0, BULK_CAP)
  if (batch.length === 0) {
    return NextResponse.json({ ok: true, count: 0, remaining: 0 })
  }

  const tiersByCount = new Map(MILESTONE_TIERS.map((t) => [t.referralCount, t]))
  const fallbackTier = MILESTONE_TIERS[0]
  const collegeGaps = await getCollegeGapMap()
  await db.nudge.createMany({
    data: batch.map((s) => {
      const tier =
        (s.directReferrals > 0 ? tiersByCount.get(s.directReferrals + 1) : undefined) ?? fallbackTier
      return {
        registrationId: s.id,
        channel,
        message: buildNudgeMessage({
          firstName: s.fullName.split(" ")[0],
          currentCount: s.directReferrals,
          tierName: tier.name,
          tierAt: tier.referralCount,
          rewardText: tier.rewardText,
          shareUrl: `/r/${s.referralCode}`, // relative in the audit log; the real send links the deploy origin
          campusGapLine: buildCampusGapLine(
            s.college ? (collegeGaps.get(s.college.toLowerCase()) ?? null) : null,
          ),
        }),
      }
    }),
  })

  return NextResponse.json({ ok: true, count: batch.length, remaining: candidates.length - batch.length })
}
