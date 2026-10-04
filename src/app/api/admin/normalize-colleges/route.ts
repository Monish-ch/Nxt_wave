import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { isAdminAuthenticated } from "@/lib/admin-guard"
import { canonicalizeCollege } from "@/lib/college-normalize"

export const dynamic = "force-dynamic"

/**
 * POST /api/admin/normalize-colleges
 * Retroactive sweep of the college fuzzy-merge: every distinct college value
 * that isn't already "canonical" (most-popular spelling of its own fuzzy
 * cluster) gets its rows migrated to the canonical spelling, so the college
 * standings don't split one campus across near-duplicate spellings.
 *
 * Returns the per-merge report so the UI can toast exactly what changed.
 */
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const groups = await db.registration.groupBy({
    by: ["college"],
    _count: true,
    where: { college: { not: null } },
    orderBy: { _count: { college: "desc" } },
  })
  const index = groups.map((g) => g.college as string)

  const merges: { from: string; to: string; count: number }[] = []
  for (const value of index) {
    const result = canonicalizeCollege(value, index)
    if (result.merged && result.canonical) {
      const updated = await db.registration.updateMany({
        where: { college: value },
        data: { college: result.canonical },
      })
      merges.push({ from: value, to: result.canonical, count: updated.count })
    }
  }

  return NextResponse.json({
    ok: true,
    changed: merges.reduce((acc, m) => acc + m.count, 0),
    merges,
    distinctBefore: index.length,
  })
}
