import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { isAdminAuthenticated } from "@/lib/admin-guard"
import { getSourceDetailStats } from "@/lib/stats"
import { SHARE_VARIANT_MAP, isShareVariantKey } from "@/lib/share-variants"

export const dynamic = "force-dynamic"

/** RFC-4180-safe CSV field escaping (quotes, commas, newlines). */
function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(",")
}

/**
 * GET /api/admin/sources/[code]/export
 * Offline channel review kit — one CSV containing:
 *   1. header block (code / channel meta / campaign day / generated at)
 *   2. funnel summary
 *   3. invite-style mix (variant × channel cross-tab)
 *   4. daily trend
 *   5. per-registration rows (name, contact, college, branch, year,
 *      attribution, share style, own referrals)
 * Powers the "Export report" action on the admin source-detail page so
 * channel reviews can be shared with stakeholders who don't have console
 * access.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { code: rawCode } = await params
  if (!/^[A-Za-z0-9_-]{2,32}$/.test(rawCode)) {
    return NextResponse.json({ error: "Invalid source code." }, { status: 400 })
  }

  const detail = await getSourceDetailStats(rawCode)
  if (!detail) {
    return NextResponse.json(
      { error: "No registrations found for this source code." },
      { status: 404 },
    )
  }

  const code = detail.code
  const rows = await db.registration.findMany({
    where: { sourceCode: code, source: { not: "referral" } },
    orderBy: { createdAt: "asc" },
    select: {
      fullName: true,
      email: true,
      whatsapp: true,
      college: true,
      branch: true,
      graduationYear: true,
      referredById: true,
      shareVariant: true,
      referralCode: true,
      createdAt: true,
      _count: { select: { directReferrals: true } },
    },
  })

  const lines: string[] = []
  const meta = detail.meta

  // --- 1. Header block --------------------------------------------------------
  lines.push("NxtWave AI Workshop Growth Engine — channel report")
  lines.push(csvRow(["Code", code]))
  lines.push(csvRow(["Channel", meta.name ?? "Uncatalogued channel"]))
  lines.push(csvRow(["Owner", meta.ownerName ?? "—"]))
  lines.push(csvRow(["Type", meta.type]))
  lines.push(csvRow(["Campaign day", `${detail.campaign.day} of ${detail.campaign.totalDays}`]))
  lines.push(csvRow(["Generated", new Date().toISOString()]))
  lines.push("")

  // --- 2. Funnel ---------------------------------------------------------------
  lines.push("FUNNEL")
  lines.push(csvRow(["Registrations", detail.funnel.registrations]))
  lines.push(csvRow(["Activated referrers", detail.funnel.activatedReferrers]))
  lines.push(csvRow(["Referral conversions", detail.funnel.referralsGenerated]))
  lines.push(csvRow(["Activation rate %", detail.funnel.activationRate]))
  lines.push(csvRow(["Conversion rate %", detail.funnel.conversionRate]))
  lines.push("")

  // --- 3. Invite-style mix ------------------------------------------------------
  lines.push("INVITE STYLE MIX")
  lines.push(csvRow(["Style", "Signups", "Percent of tagged"]))
  for (const v of detail.variantMix) {
    lines.push(csvRow([v.label, v.count, `${v.percent}%`]))
  }
  lines.push(csvRow(["Untagged (outside test)", detail.variantUntagged, ""]))
  lines.push("")

  // --- 4. Daily trend ------------------------------------------------------------
  lines.push("DAILY TREND")
  lines.push(csvRow(["Day", "Registrations", "Cumulative"]))
  for (const t of detail.trend) {
    lines.push(csvRow([t.label, t.daily, t.cumulative]))
  }
  lines.push("")

  // --- 5. Registrations ------------------------------------------------------------
  lines.push("REGISTRATIONS")
  lines.push(
    csvRow([
      "Name",
      "Email",
      "WhatsApp",
      "College",
      "Branch",
      "Grad year",
      "Via referral",
      "Share style",
      "Own referrals",
      "Referral code",
      "Registered at",
    ]),
  )
  for (const r of rows) {
    lines.push(
      csvRow([
        r.fullName,
        r.email,
        r.whatsapp ?? "",
        r.college ?? "",
        r.branch ?? "",
        r.graduationYear ?? "",
        r.referredById ? "yes" : "no",
        r.shareVariant && isShareVariantKey(r.shareVariant)
          ? `${SHARE_VARIANT_MAP[r.shareVariant].emoji} ${SHARE_VARIANT_MAP[r.shareVariant].label}`
          : "untagged",
        r._count.directReferrals,
        r.referralCode,
        r.createdAt.toISOString(),
      ]),
    )
  }

  const csv = lines.join("\r\n")
  const filename = `nxtwave-channel-${code.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
