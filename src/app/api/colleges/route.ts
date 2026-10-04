import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * GET /api/colleges
 * Distinct college names already on file, most-popular first, with registration
 * counts. Powers the register form's typeahead so students pick a canonical
 * spelling instead of inventing variants ("CBIT" vs "Chaitanya Bharathi
 * Institute of Technology...") — which keeps the college standings accurate.
 */
export async function GET() {
  const rows = await db.registration.groupBy({
    by: ["college"],
    _count: true,
    where: { college: { not: null } },
  })

  const colleges = rows
    .map((r) => ({ college: r.college as string, count: Number(r._count) }))
    .sort((a, b) => b.count - a.count || a.college.localeCompare(b.college))

  return NextResponse.json({ colleges })
}
