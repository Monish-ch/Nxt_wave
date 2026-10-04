import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { isAdminAuthenticated } from "@/lib/admin-guard"
import { SNOOZE_DAYS } from "@/lib/nudge"

export const dynamic = "force-dynamic"

const snoozeSchema = z.object({
  registrationId: z.string().min(1),
  /** Snooze length in days; omit when undoing. */
  days: z.union([z.literal(SNOOZE_DAYS[0]), z.literal(SNOOZE_DAYS[1]), z.literal(SNOOZE_DAYS[2])]).optional(),
  /** Clear an active snooze and return the student to the live queue. */
  undo: z.boolean().optional(),
})

/**
 * POST /api/admin/nudges/snooze
 * Outreach hygiene for the reminder queue:
 *  - { registrationId, days } → skip this student in bulk pushes and deprioritise
 *    them in the queue until now + days (they "wake" automatically after that).
 *  - { registrationId, undo: true } → clear the snooze immediately.
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

  const parsed = snoozeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: `days must be one of ${SNOOZE_DAYS.join(", ")}, or pass undo: true.` },
      { status: 400 },
    )
  }
  const { registrationId, days, undo } = parsed.data

  const student = await db.registration.findUnique({
    where: { id: registrationId },
    select: { id: true, fullName: true, snoozedUntil: true },
  })
  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 })
  }

  if (undo) {
    await db.registration.update({
      where: { id: student.id },
      data: { snoozedUntil: null },
    })
    return NextResponse.json({ ok: true, snoozedUntil: null })
  }

  if (!days) {
    return NextResponse.json({ error: "days is required unless undo is true." }, { status: 400 })
  }

  const snoozedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  await db.registration.update({
    where: { id: student.id },
    data: { snoozedUntil },
  })

  return NextResponse.json({ ok: true, snoozedUntil: snoozedUntil.toISOString() }, { status: 201 })
}
