import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { isAdminAuthenticated } from "@/lib/admin-guard"
import { buildDigestMessage, DigestRow } from "@/lib/digests"
import { getSourceDetailStats } from "@/lib/stats"
import { maskName } from "@/lib/constants"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/digests
 * One composed, ready-to-send digest per campaign code that has driven at
 * least one registration — the delivery-ready payload for the (simulated)
 * weekly owner outreach. Numbers come from the same live stats engine as the
 * admin console; messages are pre-composed server-side so the UI is a pure
 * copy/paste surface.
 */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const sources = await db.campaignSource.findMany({
    orderBy: { createdAt: "asc" },
    select: { code: true, name: true, ownerName: true, type: true },
  })

  // Digest audit trail: handoff count + most recent handoff per code.
  const [statsList, logs] = await Promise.all([
    Promise.all(sources.map((s) => getSourceDetailStats(s.code))),
    db.digestLog.findMany({
      orderBy: { createdAt: "desc" },
      select: { code: true, createdAt: true, message: true },
    }),
  ])
  const sentMap = new Map<string, { count: number; lastAt: Date; lastMessage: string | null }>()
  for (const log of logs) {
    const entry = sentMap.get(log.code)
    if (entry) {
      entry.count += 1
    } else {
      sentMap.set(log.code, { count: 1, lastAt: log.createdAt, lastMessage: log.message })
    }
  }
  const origin = "" // relative paths; the UI prepends window.location.origin

  const rows: DigestRow[] = sources
    .map<DigestRow | null>((s, i) => {
      const stats = statsList[i]
      if (!stats || stats.funnel.registrations === 0) return null
      const rawTop = stats.topReferrers[0]
      const topReferrer = rawTop
        ? { name: maskName(rawTop.name), referralCount: rawTop.referralCount }
        : null
      const boardPath = `/ambassador/${encodeURIComponent(s.code)}`
      const message = buildDigestMessage({
        ownerName: s.ownerName,
        code: s.code,
        funnel: stats.funnel,
        todayCount: stats.trend.at(-1)?.daily ?? 0,
        topReferrer,
        boardUrl: `${origin}${boardPath}`,
        campaignDay: stats.campaign.day,
        totalDays: stats.campaign.totalDays,
      })
      return {
        code: s.code,
        name: s.name,
        ownerName: s.ownerName,
        type: s.type,
        funnel: stats.funnel,
        todayCount: stats.trend.at(-1)?.daily ?? 0,
        topReferrer,
        boardPath,
        csvPath: `/api/admin/sources/${encodeURIComponent(s.code)}/export`,
        message,
        sent: {
          count: sentMap.get(s.code)?.count ?? 0,
          lastAt: sentMap.get(s.code)?.lastAt.toISOString() ?? null,
          lastMessage: sentMap.get(s.code)?.lastMessage ?? null,
        },
      }
    })
    .filter((r): r is DigestRow => r !== null)
    .sort((a, b) => b.funnel.registrations - a.funnel.registrations)

  const summary = {
    ownerCount: rows.length,
    registrationsCovered: rows.reduce((acc, r) => acc + r.funnel.registrations, 0),
    conversionsCovered: rows.reduce((acc, r) => acc + r.funnel.referralsGenerated, 0),
    sentToday: rows.filter((r) => r.todayCount > 0).length,
    /** Channels whose digest has been handed off at least once. */
    loggedCount: rows.filter((r) => r.sent.count > 0).length,
    /** Total digest handoffs across all channels. */
    loggedTotal: rows.reduce((acc, r) => acc + r.sent.count, 0),
  }

  return NextResponse.json({ rows, summary })
}
