import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { isAdminAuthenticated } from "@/lib/admin-guard"
import { SOURCES, sourceLabel } from "@/lib/constants"

export const dynamic = "force-dynamic"

const SORTABLE_FIELDS = {
  fullName: "fullName",
  email: "email",
  college: "college",
  branch: "branch",
  source: "source",
  createdAt: "createdAt",
  referralCount: "referralCount",
} as const

type SortField = keyof typeof SORTABLE_FIELDS

/**
 * GET /api/admin/registrations
 * Paginated, searchable, filterable, sortable registration table.
 * Query params: q, source, sourceCode, college, sort, order, page, pageSize
 */
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const sp = req.nextUrl.searchParams
  const q = (sp.get("q") ?? "").trim()
  const source = sp.get("source") ?? ""
  const sourceCode = (sp.get("sourceCode") ?? "").trim()
  const college = sp.get("college") ?? ""
  const sortParam = (sp.get("sort") ?? "createdAt") as SortField
  const sort: SortField = sortParam in SORTABLE_FIELDS ? sortParam : "createdAt"
  const order = sp.get("order") === "asc" ? "asc" : "desc"
  const page = Math.max(parseInt(sp.get("page") ?? "1", 10) || 1, 1)
  const pageSize = Math.min(Math.max(parseInt(sp.get("pageSize") ?? "10", 10) || 10, 5), 100)

  const where = {
    AND: [
      q
        ? {
            OR: [
              { fullName: { contains: q } },
              { email: { contains: q } },
              { college: { contains: q } },
              { referralCode: { contains: q } },
            ],
          }
        : {},
      source ? { source } : {},
      sourceCode ? { sourceCode } : {},
      college ? { college } : {},
    ],
  }

  const [total, rows, colleges] = await Promise.all([
    db.registration.count({ where }),
    db.registration.findMany({
      where,
      orderBy: sort === "referralCount" ? { directReferrals: { _count: order } } : { [SORTABLE_FIELDS[sort]]: order },
      include: {
        _count: { select: { directReferrals: true } },
        referredBy: { select: { fullName: true, referralCode: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.registration.groupBy({ by: ["college"], _count: true, where: { college: { not: null } } }),
  ])

  const sourceFacets = await db.registration.groupBy({ by: ["source"], _count: true })

  return NextResponse.json({
    rows: rows.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      email: r.email,
      whatsapp: r.whatsapp,
      college: r.college,
      branch: r.branch,
      graduationYear: r.graduationYear,
      source: r.source,
      sourceCode: r.sourceCode,
      shareVariant: r.shareVariant,
      referralCode: r.referralCode,
      referrer: r.referredBy ? { fullName: r.referredBy.fullName, referralCode: r.referredBy.referralCode } : null,
      referralCount: r._count.directReferrals,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
    facets: {
      colleges: colleges.map((c) => c.college ?? "Unknown").sort((a, b) => a.localeCompare(b)),
      sources: sourceFacets
        .sort((a, b) => b._count - a._count)
        .map((s) => ({ value: s.source ?? "other", label: sourceLabel(s.source), count: s._count })),
      allSources: SOURCES.map((value) => ({ value, label: sourceLabel(value) })),
    },
  })
}
