import { NextRequest, NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-guard"
import { getSourceDetailStats } from "@/lib/stats"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/sources/[code]
 * Full funnel for one campaign code (ambassador / club / social):
 * registrations → activated referrers → referral conversions, plus daily
 * trend, branch mix, top referrers within the code and recent signups.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const { code } = await params

  if (!/^[A-Za-z0-9_-]{2,32}$/.test(code)) {
    return NextResponse.json({ error: "Invalid source code." }, { status: 400 })
  }

  const detail = await getSourceDetailStats(code)
  if (!detail) {
    return NextResponse.json(
      { error: "No registrations found for this source code." },
      { status: 404 },
    )
  }

  return NextResponse.json(detail)
}
