import { db } from "@/lib/db"
import { normalizeReferralCode } from "@/lib/referral"
import { getMilestoneProgress } from "@/lib/milestones"
import { maskName } from "@/lib/constants"

// ---------------------------------------------------------------------------
// Shared referral lookup — used by the API route, the /r/[code] page and the
// /success dashboard. Computes live referral stats for a referral code.
// ---------------------------------------------------------------------------

export interface ReferralTimelineEntry {
  /** Privacy-masked name of the referred student ("Priya R."). */
  name: string
  college: string | null
  /** ISO timestamp of when the referral landed. */
  at: string
}

export interface ReferralInfo {
  valid: boolean
  reason?: "not_found" | "bad_format"
  referrer?: {
    fullName: string
    firstName: string
    college: string | null
    referralCode: string
    joinedAt: string
  }
  stats?: {
    referralCount: number
    rank: number | null
    totalActiveReferrers: number
    milestoneProgress: ReturnType<typeof getMilestoneProgress>
    /** When each referral landed, newest first — the student's own activity view. */
    timeline: ReferralTimelineEntry[]
  }
}

/**
 * Live rank among referrers: 1 + number of students with strictly more
 * referrals. Returns null when the student hasn't referred anyone yet.
 */
export async function getReferrerRank(referrerId: string): Promise<{ rank: number | null; total: number }> {
  const groups = await db.referral.groupBy({ by: ["referrerId"], _count: true })
  const total = groups.length
  const mine = groups.find((g) => g.referrerId === referrerId)
  if (!mine) return { rank: null, total }
  const ahead = groups.filter((g) => g._count > mine._count).length
  return { rank: ahead + 1, total }
}

export async function getReferralInfo(rawCode: string): Promise<ReferralInfo> {
  const code = normalizeReferralCode(rawCode)
  if (!code || !code.startsWith("NXW-")) {
    return { valid: false, reason: "bad_format" }
  }

  const registration = await db.registration.findUnique({ where: { referralCode: code } })
  if (!registration) {
    return { valid: false, reason: "not_found" }
  }

  const [referralCount, rankInfo, referralRows] = await Promise.all([
    db.referral.count({ where: { referrerId: registration.id } }),
    getReferrerRank(registration.id),
    db.referral.findMany({
      where: { referrerId: registration.id },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        referred: { select: { fullName: true, college: true } },
      },
      take: 25,
    }),
  ])

  return {
    valid: true,
    referrer: {
      fullName: registration.fullName,
      firstName: registration.fullName.split(" ")[0],
      college: registration.college,
      referralCode: registration.referralCode,
      joinedAt: registration.createdAt.toISOString(),
    },
    stats: {
      referralCount,
      rank: rankInfo.rank,
      totalActiveReferrers: rankInfo.total,
      milestoneProgress: getMilestoneProgress(referralCount),
      timeline: referralRows.map((r) => ({
        name: maskName(r.referred.fullName),
        college: r.referred.college,
        at: r.createdAt.toISOString(),
      })),
    },
  }
}
