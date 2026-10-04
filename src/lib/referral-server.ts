import { db } from "@/lib/db"

/**
 * Generate a unique referral code for a student, retrying on collisions.
 * The DB unique constraint is the final guard; we retry a few times first.
 */
export async function createUniqueReferralCode(fullName: string): Promise<string> {
  for (let attempt = 0; attempt < 25; attempt++) {
    const code = generateAttempt(fullName, attempt)
    const existing = await db.registration.findUnique({ where: { referralCode: code } })
    if (!existing) return code
  }
  // Extremely unlikely fallback — random letters appended.
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  const base = fullName.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 5) || "STUD"
  return `NXW-${base}${rand}`
}

function generateAttempt(fullName: string, attempt: number): string {
  const base =
    fullName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 7) || "STUDENT"
  const digits = String(Math.floor(Math.random() * 90) + 10)
  const jitter = attempt > 5 ? String.fromCharCode(65 + attempt) : ""
  return `NXW-${base}${digits}${jitter}`
}
