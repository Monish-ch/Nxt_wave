import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { isAdminAuthenticated } from "@/lib/admin-guard"

export const dynamic = "force-dynamic"

const logSchema = z.object({
  code: z.string().min(1).max(64),
  /** Exact copy handed to the owner (null = legacy/uncaptured handoff). */
  message: z.string().max(4000).optional().nullable(),
})

/**
 * POST /api/admin/digests/log
 * Audit trail for channel digests: records one "handoff" of a digest copy to
 * a channel owner (the demo's stand-in for an actual email/WhatsApp send).
 * Mirrors the nudge log so digest outreach is measurable the same way.
 */
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const parsed = logSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "code is required." }, { status: 400 })
  }

  const source = await db.campaignSource.findUnique({
    where: { code: parsed.data.code },
    select: { code: true },
  })
  if (!source) {
    return NextResponse.json({ error: "Unknown campaign code." }, { status: 404 })
  }

  await db.digestLog.create({
    data: {
      code: parsed.data.code,
      message: parsed.data.message ?? null,
    },
  })

  const sentCount = await db.digestLog.count({ where: { code: parsed.data.code } })
  return NextResponse.json({ ok: true, sentCount }, { status: 201 })
}
