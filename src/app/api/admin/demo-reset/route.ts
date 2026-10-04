import { NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-guard"
import { seedDemoData } from "@/lib/demo/seed"
import { DEMO_MODE } from "@/lib/constants"

export const dynamic = "force-dynamic"

/**
 * POST /api/admin/demo-reset — regenerate the demo dataset.
 * Only available in demo mode so production data can never be wiped.
 */
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }
  if (!DEMO_MODE) {
    return NextResponse.json(
      { error: "Demo reset is disabled outside demo mode." },
      { status: 403 },
    )
  }
  const result = await seedDemoData()
  return NextResponse.json({ ok: true, ...result })
}
