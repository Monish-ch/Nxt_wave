import { NextResponse } from "next/server"
import { getPublicStats } from "@/lib/stats"

export const dynamic = "force-dynamic"

/** GET /api/public/stats — live campaign counter for the landing page. */
export async function GET() {
  const stats = await getPublicStats()
  return NextResponse.json(stats)
}
