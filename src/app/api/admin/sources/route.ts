import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { isAdminAuthenticated } from "@/lib/admin-guard"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/sources
 * Ambassador / campaign-code drill-down: registrations grouped by `sourceCode`
 * (e.g. RAHUL01, CSECLUB01), enriched with CampaignSource metadata.
 * Referral-chain rows (source="referral") are excluded — that attribution
 * already lives in the referral ledger and Top referrers table.
 * Powers the "Channel drill-down" board in the admin dashboard.
 */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const CAMPAIGN_ONLY = { sourceCode: { not: null }, source: { not: "referral" } }

  const [total, groups, sourceMeta, referralGroups] = await Promise.all([
    db.registration.count(),
    db.registration.groupBy({
      by: ["sourceCode"],
      _count: true,
      where: CAMPAIGN_ONLY,
    }),
    db.campaignSource.findMany({
      select: { code: true, name: true, ownerName: true, type: true },
    }),
    db.registration.groupBy({
      by: ["sourceCode"],
      _count: true,
      where: { AND: [{ sourceCode: { not: null } }, { referredById: { not: null } }, { source: { not: "referral" } }] },
    }),
  ])

  const metaMap = new Map(sourceMeta.map((m) => [m.code.toUpperCase(), m]))
  const referralMap = new Map(
    referralGroups.map((g) => [g.sourceCode ?? "", g._count]),
  )

  // Latest registration timestamp per source code.
  const latestRows = await db.registration.groupBy({
    by: ["sourceCode"],
    _max: { createdAt: true },
    where: CAMPAIGN_ONLY,
  })
  const latestMap = new Map(
    latestRows.map((r) => [r.sourceCode ?? "", r._max.createdAt?.toISOString() ?? null]),
  )

  const rows = groups
    .map((g) => {
      const code = g.sourceCode ?? "—"
      const meta = metaMap.get(code.toUpperCase())
      return {
        code,
        name: meta?.name ?? null,
        ownerName: meta?.ownerName ?? null,
        type: meta?.type ?? "uncatalogued",
        count: g._count,
        percent: total > 0 ? Math.round((g._count / total) * 1000) / 10 : 0,
        referralCount: referralMap.get(code) ?? 0,
        lastAt: latestMap.get(code) ?? null,
      }
    })
    .sort((a, b) => b.count - a.count)

  return NextResponse.json({
    rows,
    totalCodes: rows.length,
    totalAttributed: rows.reduce((acc, r) => acc + r.count, 0),
  })
}
