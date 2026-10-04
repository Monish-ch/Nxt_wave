import { NextResponse } from "next/server"
import { getAdminStats } from "@/lib/stats"
import { isAdminAuthenticated } from "@/lib/admin-guard"
import { DEMO_MODE } from "@/lib/constants"

export const dynamic = "force-dynamic"

/** GET /api/admin/stats — full growth dashboard payload (auth required). */
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }
  const stats = await getAdminStats()
  return NextResponse.json({ ...stats, demoMode: DEMO_MODE })
}
