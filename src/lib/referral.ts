// ---------------------------------------------------------------------------
// Referral code utilities — format: NXW-<NAME><2 digits> e.g. NXW-MONISH42
// ---------------------------------------------------------------------------

const CODE_PREFIX = "NXW-"

/**
 * Build a human-friendly referral code from a student's full name.
 * Deterministic for a given name+number pair so codes are reproducible in seeds.
 */
export function buildReferralCode(fullName: string, suffix: number): string {
  const base =
    fullName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 7) || "STUDENT"
  const twoDigit = String(suffix).padStart(2, "0").slice(-2)
  return `${CODE_PREFIX}${base}${twoDigit}`
}

/** Random referral code from a name (used at registration time). */
export function generateReferralCode(fullName: string): string {
  return buildReferralCode(fullName, Math.floor(Math.random() * 90) + 10)
}

export function normalizeReferralCode(raw: string | null | undefined): string {
  if (!raw) return ""
  return raw.trim().toUpperCase()
}

export function isValidReferralCodeFormat(code: string): boolean {
  return /^NXW-[A-Z0-9]{2,10}$/.test(code.trim().toUpperCase())
}
