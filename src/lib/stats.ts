import { db } from "@/lib/db"
import { TARGET_REGISTRATIONS } from "@/lib/constants"
import { CampaignWindow, getCampaignWindow, getCampaignDays, formatDayLabel, startOfToday } from "@/lib/campaign"
import { sourceLabel } from "@/lib/constants"
import { SHARE_VARIANT_MAP, ShareVariantKey } from "@/lib/share-variants"

// ---------------------------------------------------------------------------
// Analytics engine — every dashboard metric is computed from live
// registration data. Nothing is hardcoded in the UI.
// ---------------------------------------------------------------------------

export interface PublicStats {
  totalRegistrations: number
  target: number
  percentFilled: number
  seatsLeft: number
  todayCount: number
  referralSharePercent: number
  campaignDay: number
  campaignTotalDays: number
  /** Days left in the campaign window (0 on the final day). */
  daysLeft: number
  /** Registrations/day the remaining window must average to hit the target. */
  neededPerDay: number
  /** Average registrations/day achieved so far. */
  actualPerDay: number
  /** True when the current average pace finishes short of the target. */
  behindPace: boolean
}

export interface LeaderboardEntry {
  rank: number
  name: string
  college: string | null
  referralCode: string
  referralCount: number
  registeredAt: string
  isCurrentUser?: boolean
}

/**
 * Public top-referrers leaderboard. Only includes students with >= 1 referral.
 * `highlightCode` marks one row (used to show "you" on the success page flow).
 */
export async function getLeaderboard(limit = 25, highlightCode?: string): Promise<{
  entries: LeaderboardEntry[]
  totalActiveReferrers: number
  totalReferralRegistrations: number
}> {
  const [allGroups, totalReferralRegistrations] = await Promise.all([
    db.referral.groupBy({ by: ["referrerId"], _count: true }),
    db.registration.count({ where: { referredById: { not: null } } }),
  ])
  const totalActiveReferrers = allGroups.length

  const sorted = [...allGroups].sort(
    (a, b) => Number(b._count) - Number(a._count) || a.referrerId.localeCompare(b.referrerId),
  )
  const topGroups = sorted.slice(0, limit)

  const details = await db.registration.findMany({
    where: { id: { in: topGroups.map((g) => g.referrerId) } },
    select: { id: true, fullName: true, college: true, referralCode: true, createdAt: true },
  })
  const detailMap = new Map(details.map((d) => [d.id, d]))

  const normalizedHighlight = highlightCode?.toUpperCase()
  // Competition ranking: rank = 1 + number of referrers strictly ahead
  // (consistent with getReferrerRank used on the student dashboard).
  const entries: LeaderboardEntry[] = topGroups.map((g) => {
    const d = detailMap.get(g.referrerId)
    const ahead = allGroups.filter((x) => Number(x._count) > Number(g._count)).length
    return {
      rank: ahead + 1,
      name: d?.fullName ?? "Anonymous Student",
      college: d?.college ?? null,
      referralCode: d?.referralCode ?? "",
      referralCount: Number(g._count),
      registeredAt: d?.createdAt.toISOString() ?? "",
      isCurrentUser: normalizedHighlight ? d?.referralCode === normalizedHighlight : false,
    }
  })

  return { entries, totalActiveReferrers, totalReferralRegistrations }
}

export async function getPublicStats(window?: CampaignWindow): Promise<PublicStats> {
  const campaignWindow = window ?? getCampaignWindow()
  const [total, todayCount, referralCount] = await Promise.all([
    db.registration.count(),
    db.registration.count({ where: { createdAt: { gte: startOfToday() } } }),
    db.registration.count({ where: { referredById: { not: null } } }),
  ])

  const seatsLeft = Math.max(TARGET_REGISTRATIONS - total, 0)
  const daysLeft = Math.max(campaignWindow.totalDays - campaignWindow.currentDay, 0)
  const actualPerDay = total / Math.max(campaignWindow.currentDay, 1)
  // Pace the REMAINING window must hold (today counts as a remaining day; on
  // the final day everything left lands "today").
  const neededPerDay = Math.ceil(seatsLeft / Math.max(daysLeft, 1))
  const behindPace = seatsLeft > 0 && actualPerDay < neededPerDay

  return {
    totalRegistrations: total,
    target: TARGET_REGISTRATIONS,
    percentFilled: Math.round((total / TARGET_REGISTRATIONS) * 1000) / 10,
    seatsLeft,
    todayCount,
    referralSharePercent: total > 0 ? Math.round((referralCount / total) * 1000) / 10 : 0,
    campaignDay: campaignWindow.currentDay,
    campaignTotalDays: campaignWindow.totalDays,
    daysLeft,
    neededPerDay,
    actualPerDay: Math.round(actualPerDay * 10) / 10,
    behindPace,
  }
}

export interface CollegeStanding {
  rank: number
  college: string
  total: number
  /** Share of ALL campaign registrations, as a whole-number percent. */
  sharePercent: number
  activeReferrers: number
  referralRegs: number
  /** Best referrer of this college (masked downstream, null if none active). */
  topReferrer: { name: string; referralCode: string; referralCount: number } | null
}

/**
 * College standings for the leaderboard's "club competition" view: every
 * college ranked by total registrations, with referral engagement per college
 * and that college's best referrer. Computed live from registration data.
 */
export async function getCollegeStandings(limit = 12): Promise<CollegeStanding[]> {
  const [totals, referralTotals, activeReferrers] = await Promise.all([
    db.registration.groupBy({ by: ["college"], _count: true, where: { college: { not: null } } }),
    db.registration.groupBy({
      by: ["college"],
      _count: true,
      where: { college: { not: null }, referredById: { not: null } },
    }),
    db.registration.findMany({
      where: { college: { not: null }, directReferrals: { some: {} } },
      select: {
        fullName: true,
        college: true,
        referralCode: true,
        _count: { select: { directReferrals: true } },
      },
    }),
  ])

  const grandTotal = totals.reduce((sum, t) => sum + Number(t._count), 0)
  const referralByCollege = new Map(
    referralTotals.map((r) => [r.college as string, Number(r._count)]),
  )

  // Best referrer per college (ties broken alphabetically for determinism).
  const topByCollege = new Map<
    string,
    { name: string; referralCode: string; referralCount: number }
  >()
  for (const s of activeReferrers) {
    const key = s.college as string
    const count = Number(s._count.directReferrals)
    const current = topByCollege.get(key)
    if (
      !current ||
      count > current.referralCount ||
      (count === current.referralCount && s.fullName < current.name)
    ) {
      topByCollege.set(key, { name: s.fullName, referralCode: s.referralCode, referralCount: count })
    }
  }

  return totals
    .map((t) => ({
      college: t.college as string,
      total: Number(t._count),
    }))
    .sort((a, b) => b.total - a.total || a.college.localeCompare(b.college))
    .slice(0, limit)
    .map((t, i) => ({
      rank: i + 1,
      college: t.college,
      total: t.total,
      sharePercent: grandTotal > 0 ? Math.round((t.total / grandTotal) * 1000) / 10 : 0,
      activeReferrers: activeReferrers.filter((s) => s.college === t.college).length,
      referralRegs: referralByCollege.get(t.college) ?? 0,
      topReferrer: topByCollege.get(t.college) ?? null,
    }))
}

export interface CollegePosition {
  college: string
  /** Competition rank among all colleges (1 = most registrations). */
  rank: number
  totalColleges: number
  total: number
  referralRegs: number
  activeReferrers: number
  /** The nearest college ABOVE this one — the actionable “beat them next” target. */
  ahead: { college: string; total: number; gap: number } | null
  /** Best referrer of THIS college (raw name — mask at display time). */
  topReferrer: { name: string; referralCount: number } | null
}

/**
 * One college's standing in the campus competition — powers the "Your campus"
 * panel on the student dashboard. Computed live; null-safe for unknown colleges.
 */
export async function getCollegePosition(college: string): Promise<CollegePosition | null> {
  const trimmed = college.trim()
  if (!trimmed) return null

  const [totals, referralTotals, activeReferrers] = await Promise.all([
    db.registration.groupBy({ by: ["college"], _count: true, where: { college: { not: null } } }),
    db.registration.groupBy({
      by: ["college"],
      _count: true,
      where: { college: { not: null }, referredById: { not: null } },
    }),
    db.registration.findMany({
      where: { college: { not: null }, directReferrals: { some: {} } },
      select: { fullName: true, college: true, _count: { select: { directReferrals: true } } },
    }),
  ])

  const mine = totals.find((t) => (t.college as string).toLowerCase() === trimmed.toLowerCase())
  if (!mine) return null
  const myTotal = Number(mine._count)

  const above = totals
    .map((t) => ({ college: t.college as string, total: Number(t._count) }))
    .filter((t) => t.total > myTotal)
    .sort((a, b) => a.total - b.total || a.college.localeCompare(b.college))

  const myTopReferrer = activeReferrers
    .filter((s) => s.college === mine.college)
    .map((s) => ({ name: s.fullName, referralCount: Number(s._count.directReferrals) }))
    .sort((a, b) => b.referralCount - a.referralCount || a.name.localeCompare(b.name))[0]

  return {
    college: mine.college as string,
    rank: above.length + 1,
    totalColleges: totals.length,
    total: myTotal,
    referralRegs: Number(referralTotals.find((r) => r.college === mine.college)?._count ?? 0),
    activeReferrers: activeReferrers.filter((s) => s.college === mine.college).length,
    ahead: above[0] ? { ...above[0], gap: above[0].total - myTotal } : null,
    topReferrer: myTopReferrer ?? null,
  }
}

export interface CampusGapContext {
  college: string
  /** Competition rank among all colleges (1 = most registrations). */
  rank: number
  totalColleges: number
  total: number
  /** The nearest college ABOVE — the actionable "help your campus beat them" target. */
  ahead: { college: string; total: number; gap: number } | null
}

/**
 * College-gap context for every known college in one query set — keyed by
 * lowercase college name. Powers the nudge queue's per-row "their campus is
 * 2 behind #4" competition angle without N+1 queries.
 */
export async function getCollegeGapMap(): Promise<Map<string, CampusGapContext>> {
  const map = new Map<string, CampusGapContext>()
  const standings = await getCollegeStandings(1000)
  standings.forEach((s, i) => {
    const above = i > 0 ? standings[i - 1] : null
    map.set(s.college.toLowerCase(), {
      college: s.college,
      rank: s.rank,
      totalColleges: standings.length,
      total: s.total,
      ahead: above ? { college: above.college, total: above.total, gap: above.total - s.total } : null,
    })
  })
  return map
}

export interface AdminStats {
  target: number
  totalRegistrations: number
  registrationsToday: number
  referralRegistrations: number
  directRegistrations: number
  referralPercent: number
  percentOfTarget: number
  collegeCount: number
  activeReferrers: number
  campaign: {
    day: number
    totalDays: number
    startISO: string
    endISO: string
    pacePerDay: number
    projectedFinal: number
    neededPerRemainingDay: number
    daysLeft: number
    spotsLeft: number
  }
  overTime: Array<{ label: string; day: string; daily: number; cumulative: number }>
  bySource: Array<{ source: string; label: string; count: number; percent: number }>
  referralVsDirect: Array<{ name: string; value: number }>
  topColleges: Array<{ college: string; count: number }>
  topReferrers: Array<{
    name: string
    college: string | null
    referralCode: string
    referralCount: number
    registeredAt: string
  }>
  shareVariants: Array<{
    variant: string
    label: string
    emoji: string
    registrations: number
    percent: number
    isWinner: boolean
  }>
  shareVariantUnknown: number
  recentRegistrations: Array<{
    fullName: string
    college: string | null
    source: string | null
    createdAt: string
  }>
}

export async function getAdminStats(): Promise<AdminStats> {
  const window = getCampaignWindow()
  const days = getCampaignDays(window)
  const today = startOfToday()

  const [
    total,
    todayCount,
    referralCount,
    collegeGroups,
    referrerGroups,
    recent,
  ] = await Promise.all([
    db.registration.count(),
    db.registration.count({ where: { createdAt: { gte: today } } }),
    db.registration.count({ where: { referredById: { not: null } } }),
    db.registration.groupBy({ by: ["college"], _count: true, where: { college: { not: null } } }),
    db.referral.groupBy({ by: ["referrerId"], _count: true }),
    db.registration.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { fullName: true, college: true, source: true, createdAt: true },
    }),
  ])

  // --- Registrations over time (campaign window) -------------------------------
  const allRegistrations = await db.registration.findMany({
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  const dayBuckets = days.map((d) => {
    const start = new Date(d)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  })

  let cumulative = 0
  const overTime = dayBuckets.map(({ start, end }, i) => {
    const daily = allRegistrations.filter((r) => r.createdAt >= start && r.createdAt <= end).length
    cumulative += daily
    return {
      label: `Day ${i + 1} · ${formatDayLabel(start)}`,
      day: formatDayLabel(start),
      daily,
      cumulative,
    }
  })

  // --- By source -----------------------------------------------------------------
  const sourceGroups = await db.registration.groupBy({
    by: ["source"],
    _count: true,
  })
  const bySource = sourceGroups
    .map((g) => ({
      source: g.source ?? "other",
      label: sourceLabel(g.source),
      count: g._count,
      percent: total > 0 ? Math.round((g._count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count)

  // --- Referral velocity over time (share of each day that came from referrals) ---
  const referralVsDirect = [
    { name: "Direct registrations", value: total - referralCount },
    { name: "Referral registrations", value: referralCount },
  ]

  // --- Top colleges -----------------------------------------------------------------
  const topColleges = collegeGroups
    .map((g) => ({ college: g.college ?? "Unknown", count: g._count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // --- Top referrers -----------------------------------------------------------------
  const topReferrerIds = referrerGroups.sort((a, b) => b._count - a._count).slice(0, 8)
  const referrerDetails = await db.registration.findMany({
    where: { id: { in: topReferrerIds.map((r) => r.referrerId) } },
    select: { id: true, fullName: true, college: true, referralCode: true, createdAt: true },
  })
  const detailMap = new Map(referrerDetails.map((r) => [r.id, r]))
  const topReferrers = topReferrerIds
    .map((g) => {
      const detail = detailMap.get(g.referrerId)
      return {
        name: detail?.fullName ?? "Unknown",
        college: detail?.college ?? null,
        referralCode: detail?.referralCode ?? "",
        referralCount: g._count,
        registeredAt: detail?.createdAt.toISOString() ?? "",
      }
    })
    .sort((a, b) => b.referralCount - a.referralCount)

  // --- Invite-message A/B test (which share style converts friends) ------------------
  // shareVariant is set on registrations that landed via a variant-tagged
  // referral link (?v=friendly|achievement|urgent). Direct registrations have
  // no variant, so the test population = referred registrations.
  const variantGroups = await db.registration.groupBy({
    by: ["shareVariant"],
    _count: true,
    where: { referredById: { not: null } },
  })
  const variantUnknown = variantGroups.find((g) => g.shareVariant === null)?._count ?? 0
  const variantTotal = referralCount - variantUnknown
  const knownVariants = variantGroups
    .filter((g): g is typeof g & { shareVariant: string } => g.shareVariant !== null)
    .sort((a, b) => b._count - a._count)
  const maxVariantCount = knownVariants[0]?._count ?? 0
  const shareVariants = knownVariants.map((g) => {
    const meta = SHARE_VARIANT_MAP[g.shareVariant as ShareVariantKey]
    return {
      variant: g.shareVariant,
      label: meta?.label ?? g.shareVariant,
      emoji: meta?.emoji ?? "✉️",
      registrations: g._count,
      percent: variantTotal > 0 ? Math.round((g._count / variantTotal) * 1000) / 10 : 0,
      isWinner: g._count === maxVariantCount && maxVariantCount > 0,
    }
  })

  // --- Campaign pacing ----------------------------------------------------------------
  const elapsedDays = window.campaignOver ? window.totalDays : window.currentDay
  const pacePerDay = elapsedDays > 0 ? Math.round((total / elapsedDays) * 10) / 10 : 0
  const remainingDays = Math.max(window.totalDays - elapsedDays, 0)
  const spotsLeft = Math.max(TARGET_REGISTRATIONS - total, 0)
  const projectedFinal = Math.round(total + pacePerDay * remainingDays)
  // On the final day (0 days left) the whole remaining gap must land TODAY,
  // so neededPerRemainingDay degrades to "spots left" — never a false 0,
  // which the UI previously mis-read as "On track ✓".
  const neededPerRemainingDay = Math.ceil(spotsLeft / Math.max(remainingDays, 1))

  return {
    target: TARGET_REGISTRATIONS,
    totalRegistrations: total,
    registrationsToday: todayCount,
    referralRegistrations: referralCount,
    directRegistrations: total - referralCount,
    referralPercent: total > 0 ? Math.round((referralCount / total) * 1000) / 10 : 0,
    percentOfTarget: Math.round((total / TARGET_REGISTRATIONS) * 1000) / 10,
    collegeCount: collegeGroups.length,
    activeReferrers: referrerGroups.length,
    campaign: {
      day: window.currentDay,
      totalDays: window.totalDays,
      startISO: window.start.toISOString(),
      endISO: window.end.toISOString(),
      pacePerDay,
      projectedFinal,
      neededPerRemainingDay,
      daysLeft: remainingDays,
      spotsLeft,
    },
    overTime,
    bySource,
    referralVsDirect,
    topColleges,
    topReferrers,
    shareVariants,
    shareVariantUnknown: variantUnknown,
    recentRegistrations: recent.map((r) => ({
      fullName: r.fullName,
      college: r.college,
      source: r.source,
      createdAt: r.createdAt.toISOString(),
    })),
  }
}

// ---------------------------------------------------------------------------
// Per-code channel detail (ambassador / club / social drill-down).
// Powers /admin/sources/[code] — one campaign code's full funnel.
// ---------------------------------------------------------------------------

export interface SourceDetailStats {
  code: string
  meta: {
    name: string | null
    ownerName: string | null
    type: string
  }
  funnel: {
    registrations: number
    activatedReferrers: number // students from this code who referred ≥1 friend
    referralsGenerated: number // total registrations those referrals drove
    activationRate: number // % of students who referred at least once
    conversionRate: number // referral conversions ÷ registrations
  }
  trend: Array<{ label: string; day: string; daily: number; cumulative: number }>
  branches: Array<{ branch: string; count: number }>
  /** Invite-style mix within this channel (?v= tagged registrations only). */
  variantMix: Array<{ variant: string; label: string; emoji: string; count: number; percent: number }>
  variantUntagged: number
  topReferrers: Array<{
    name: string
    referralCode: string
    referralCount: number
    college: string | null
  }>
  recent: Array<{
    fullName: string
    college: string | null
    branch: string | null
    viaReferral: boolean
    createdAt: string
  }>
  campaign: {
    day: number
    totalDays: number
  }
}

export async function getSourceDetailStats(rawCode: string): Promise<SourceDetailStats | null> {
  const code = rawCode.toUpperCase()
  const window = getCampaignWindow()
  const days = getCampaignDays(window)

  const meta = await db.campaignSource.findFirst({
    where: { code: { equals: code } },
    select: { name: true, ownerName: true, type: true },
  })

  // Referral-chain rows are excluded (same convention as the drill-down board):
  // this board measures what the CAMPAIGN CODE drove directly.
  const baseWhere = { sourceCode: code, source: { not: "referral" } }

  const [registrations, rows] = await Promise.all([
    db.registration.count({ where: baseWhere }),
    db.registration.findMany({
      where: baseWhere,
      select: {
        fullName: true,
        referralCode: true,
        college: true,
        branch: true,
        referredById: true,
        shareVariant: true,
        createdAt: true,
        _count: { select: { directReferrals: true } },
      },
    }),
  ])

  if (registrations === 0 && !meta) return null

  const activated = rows.filter((r) => r._count.directReferrals > 0)
  const referralsGenerated = activated.reduce((acc, r) => acc + r._count.directReferrals, 0)

  // Daily trend across the campaign window.
  const dayBuckets = days.map((d) => {
    const start = new Date(d)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  })
  let cumulative = 0
  const trend = dayBuckets.map(({ start, end }, i) => {
    const daily = rows.filter((r) => r.createdAt >= start && r.createdAt <= end).length
    cumulative += daily
    return {
      label: `Day ${i + 1} · ${formatDayLabel(start)}`,
      day: formatDayLabel(start),
      daily,
      cumulative,
    }
  })

  // Branch mix.
  const branchMap = new Map<string, number>()
  for (const r of rows) {
    const key = r.branch ?? "Other"
    branchMap.set(key, (branchMap.get(key) ?? 0) + 1)
  }
  const branches = [...branchMap.entries()]
    .map(([branch, count]) => ({ branch, count }))
    .sort((a, b) => b.count - a.count)

  // Invite-style mix within this channel (variant × channel cross-tab).
  const variantCounts = new Map<string, number>()
  let variantUntagged = 0
  for (const r of rows) {
    if (r.shareVariant) variantCounts.set(r.shareVariant, (variantCounts.get(r.shareVariant) ?? 0) + 1)
    else variantUntagged += 1
  }
  const variantTaggedTotal = rows.length - variantUntagged
  const variantMix = [...variantCounts.entries()]
    .map(([key, count]) => {
      const meta = SHARE_VARIANT_MAP[key as ShareVariantKey]
      return {
        variant: key,
        label: meta?.label ?? key,
        emoji: meta?.emoji ?? "✉️",
        count,
        percent: variantTaggedTotal > 0 ? Math.round((count / variantTaggedTotal) * 1000) / 10 : 0,
      }
    })
    .sort((a, b) => b.count - a.count)

  // Top referrers within this code.
  const topReferrers = activated
    .sort((a, b) => b._count.directReferrals - a._count.directReferrals)
    .slice(0, 5)
    .map((r) => ({
      name: r.fullName,
      referralCode: r.referralCode,
      referralCount: r._count.directReferrals,
      college: r.college,
    }))

  const recent = await db.registration.findMany({
    where: baseWhere,
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      fullName: true,
      college: true,
      branch: true,
      referredById: true,
      createdAt: true,
    },
  })

  return {
    code,
    meta: {
      name: meta?.name ?? null,
      ownerName: meta?.ownerName ?? null,
      type: meta?.type ?? "uncatalogued",
    },
    funnel: {
      registrations,
      activatedReferrers: activated.length,
      referralsGenerated,
      activationRate: registrations > 0 ? Math.round((activated.length / registrations) * 1000) / 10 : 0,
      conversionRate: registrations > 0 ? Math.round((referralsGenerated / registrations) * 1000) / 10 : 0,
    },
    trend,
    branches,
    variantMix,
    variantUntagged,
    topReferrers,
    recent: recent.map((r) => ({
      fullName: r.fullName,
      college: r.college,
      branch: r.branch,
      viaReferral: r.referredById !== null,
      createdAt: r.createdAt.toISOString(),
    })),
    campaign: { day: window.currentDay, totalDays: window.totalDays },
  }
}


