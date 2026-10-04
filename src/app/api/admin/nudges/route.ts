import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { isAdminAuthenticated } from "@/lib/admin-guard"
import { MILESTONE_TIERS } from "@/lib/milestones"
import { getCollegeGapMap } from "@/lib/stats"
import {
  isSnoozeActive,
  NEAR_MISS_COUNTS,
  type NudgeRow,
  type NudgeSummary,
  type NudgeTouch,
} from "@/lib/nudge"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/nudges
 * Near-miss queue: students exactly one referral away from their next
 * milestone, with their WhatsApp number, pre-composable reminder context and
 * prior nudge history. Powers the "WhatsApp reminder simulator" board.
 */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const tiersByCount = new Map(MILESTONE_TIERS.map((t) => [t.referralCount, t]))

  const [referrers, dormantCount, dormantNeverNudged, nudgeLogs, collegeGaps] = await Promise.all([
    // Everyone who has referred at least once, with live referral counts.
    db.registration.findMany({
      where: { directReferrals: { some: {} } },
      select: {
        id: true,
        fullName: true,
        whatsapp: true,
        college: true,
        referralCode: true,
        createdAt: true,
        snoozedUntil: true,
        _count: { select: { directReferrals: true } },
        directReferrals: { select: { id: true, createdAt: true } },
        nudgeLogs: { select: { id: true, createdAt: true, channel: true, message: true } },
      },
    }),
    db.registration.count({
      where: { directReferrals: { none: {} } },
    }),
    db.registration.count({
      where: { directReferrals: { none: {} }, nudgeLogs: { none: {} } },
    }),
    db.nudge.findMany({
      orderBy: { createdAt: "desc" },
      select: { registrationId: true, createdAt: true, channel: true, message: true },
    }),
    getCollegeGapMap(),
  ])

  // Group nudge history per student (count, last time, last message copy,
  // full timeline for the expandable audit panel). Each touch also records the
  // student's referral count AS OF that touch, so the timeline reads as
  // cause-effect ("reminded them at 2 → a referral followed").
  const nudgeMap = new Map<
    string,
    { count: number; last: Date | null; lastMessage: string | null; history: NudgeTouch[] }
  >()
  for (const log of nudgeLogs) {
    const entry = nudgeMap.get(log.registrationId) ?? {
      count: 0,
      last: null,
      lastMessage: null,
      history: [],
    }
    entry.count += 1
    if (!entry.last || log.createdAt > entry.last) {
      entry.last = log.createdAt
      entry.lastMessage = log.message
    }
    entry.history.push({
      at: log.createdAt.toISOString(),
      channel: log.channel,
      message: log.message,
      countAtTouch: 0, // filled in per student below
    })
    nudgeMap.set(log.registrationId, entry)
  }

  // Fill countAtTouch: referrals that existed before each touch.
  for (const s of referrers) {
    const entry = nudgeMap.get(s.id)
    if (!entry) continue
    const refTimes = (s.directReferrals ?? []).map((r) => r.createdAt.getTime())
    for (const touch of entry.history) {
      const at = new Date(touch.at).getTime()
      touch.countAtTouch = refTimes.filter((t) => t <= at).length
    }
  }

  // Near-miss = referral count exactly one below a tier threshold
  // (2→Momentum(3), 4→Campus Influencer(5), 9→Growth Champion(10)).
  const rows: NudgeRow[] = referrers
    .filter((s) => NEAR_MISS_COUNTS.includes(s._count.directReferrals))
    .map((s) => {
      const count = s._count.directReferrals
      const tier = tiersByCount.get(count + 1)!
      const history = nudgeMap.get(s.id)
      // Effectiveness read: did any referral land within 24h after any nudge
      // we sent this student? (Referral must postdate the touch by ≤24h.)
      const DAY_MS = 24 * 60 * 60 * 1000
      const convertedAfterNudge = (s.nudgeLogs ?? []).some((nudge) =>
        (s.directReferrals ?? []).some(
          (ref) => ref.createdAt > nudge.createdAt && ref.createdAt.getTime() - nudge.createdAt.getTime() <= DAY_MS,
        ),
      )
      return {
        registrationId: s.id,
        fullName: s.fullName,
        whatsapp: s.whatsapp,
        college: s.college,
        referralCode: s.referralCode,
        currentCount: count,
        nextTier: { name: tier.name, referralCount: tier.referralCount, rewardText: tier.rewardText },
        nudgedCount: history?.count ?? 0,
        lastNudgedAt: history?.last?.toISOString() ?? null,
        lastMessage: history?.lastMessage ?? null,
        history: history?.history ?? [],
        convertedAfterNudge,
        snoozedUntil: s.snoozedUntil?.toISOString() ?? null,
        campus: s.college ? (collegeGaps.get(s.college.toLowerCase()) ?? null) : null,
      }
    })
    // Snoozed students sink to the bottom of the queue (still visible/wakeable,
    // just not in ops' face) and wake automatically once snoozedUntil passes.
    .sort(
      (a, b) =>
        Number(isSnoozeActive(a.snoozedUntil)) - Number(isSnoozeActive(b.snoozedUntil)) ||
        b.nextTier.referralCount - a.nextTier.referralCount ||
        b.currentCount - a.currentCount,
    )

  // Campaign-wide nudge effectiveness: for EVERY logged touch (any student),
  // count the ones after which a referral landed within 24h.
  const allLogs = await db.nudge.findMany({
    select: { registrationId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })
  const referredRows = await db.registration.findMany({
    where: { directReferrals: { some: {} } },
    select: { id: true, directReferrals: { select: { createdAt: true } } },
  })
  const referralsByStudent = new Map(referredRows.map((r) => [r.id, r.directReferrals.map((d) => d.createdAt)]))
  const DAY_MS = 24 * 60 * 60 * 1000
  const nudgesConverted24h = allLogs.filter((log) =>
    (referralsByStudent.get(log.registrationId) ?? []).some(
      (refAt) => refAt > log.createdAt && refAt.getTime() - log.createdAt.getTime() <= DAY_MS,
    ),
  ).length

  const byTier = MILESTONE_TIERS.filter((t) => NEAR_MISS_COUNTS.includes(t.referralCount - 1)).map(
    (t) => ({
      tierName: t.name,
      tierAt: t.referralCount,
      count: rows.filter((r) => r.nextTier.referralCount === t.referralCount).length,
    }),
  )

  const summary: NudgeSummary = {
    queueSize: rows.length,
    dormantReferrers: dormantCount,
    byTier,
    totalNudgesSent: allLogs.length,
    nudgesConverted24h,
    effectivenessPercent:
      allLogs.length > 0 ? Math.round((nudgesConverted24h / allLogs.length) * 100) : 0,
    dormantNeverNudged,
    snoozedCount: rows.filter((r) => isSnoozeActive(r.snoozedUntil)).length,
  }

  return NextResponse.json({ rows, summary })
}

const nudgePostSchema = z.object({
  registrationId: z.string().min(1),
  channel: z.enum(["whatsapp", "other"]).default("whatsapp"),
  /** Exact copy that was (simulated) sent — stored for the audit trail. */
  message: z.string().max(2000).optional().nullable(),
})

/**
 * POST /api/admin/nudges
 * Logs one outreach touch for a student (simulated send). The UI uses this to
 * track who has already been reminded and how recently.
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

  const parsed = nudgePostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "registrationId is required." }, { status: 400 })
  }

  const student = await db.registration.findUnique({
    where: { id: parsed.data.registrationId },
    select: { id: true, fullName: true },
  })
  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 })
  }

  const nudgedCount = await db.nudge.count({ where: { registrationId: student.id } })
  await db.nudge.create({
    data: {
      registrationId: student.id,
      channel: parsed.data.channel,
      message: parsed.data.message ?? null,
    },
  })

  return NextResponse.json({ ok: true, nudgedCount: nudgedCount + 1 }, { status: 201 })
}
