// ---------------------------------------------------------------------------
// Nudge queue logic — WhatsApp reminder simulator for "near-miss" referrers.
//
// A near-miss is a student who is exactly ONE referral away from unlocking
// their next milestone tier. These students have already proven they can
// refer (count >= 1), so a well-timed reminder has the highest expected
// payoff. Students with 0 referrals are "dormant" — reported as a count,
// but not queued (too noisy to message everyone).
// ---------------------------------------------------------------------------

import { MILESTONE_TIERS } from "./milestones"
import type { CampusGapContext } from "./stats"

/** Referral counts that are exactly one away from a tier (2→3, 4→5, 9→10). */
export const NEAR_MISS_COUNTS: number[] = MILESTONE_TIERS.map((t) => t.referralCount - 1).filter(
  (c) => c > 0,
)

/** Snooze lengths offered in the queue UI (days). */
export const SNOOZE_DAYS = [1, 3, 7] as const
export type SnoozeDays = (typeof SNOOZE_DAYS)[number]

export interface NudgeTouch {
  /** ISO timestamp of the logged touch. */
  at: string
  channel: string
  /** Exact message copy sent (null for pre-capture logs). */
  message: string | null
  /** The student's referral count as of this touch — cause-effect context. */
  countAtTouch: number
}

export interface NudgeRow {
  registrationId: string
  fullName: string
  whatsapp: string | null
  college: string | null
  referralCode: string
  currentCount: number
  nextTier: {
    name: string
    referralCount: number
    rewardText: string
  }
  nudgedCount: number
  lastNudgedAt: string | null
  /** Exact message copy from the most recent logged touch (tooltip preview). */
  lastMessage: string | null
  /** Full outreach history, newest first — powers the per-row timeline. */
  history: NudgeTouch[]
  /** True when ≥1 referral landed within 24h after any of this student's nudges. */
  convertedAfterNudge: boolean
  /** Active snooze (ISO, in the future) — ops asked to skip this student until then. */
  snoozedUntil: string | null
  /** The student's campus-competition standing (null when college unknown) — sharpens the reminder copy. */
  campus: CampusGapContext | null
}

export interface NudgeSummary {
  queueSize: number
  dormantReferrers: number
  byTier: { tierName: string; tierAt: number; count: number }[]
  /** All-time outreach log size (every logged touch). */
  totalNudgesSent: number
  /** Logged touches after which a referral landed within 24h. */
  nudgesConverted24h: number
  /** Converted ÷ sent, as a whole-number percent. */
  effectivenessPercent: number
  /** Dormant students (0 referrals) with no nudge on record yet. */
  dormantNeverNudged: number
  /** Queued students with an active snooze — visible but excluded from bulk pushes. */
  snoozedCount: number
}

/** True when the snooze timestamp is set and still in the future. */
export function isSnoozeActive(snoozedUntil: string | null | undefined): boolean {
  if (!snoozedUntil) return false
  return new Date(snoozedUntil).getTime() > Date.now()
}

/**
 * The campus-competition line appended to reminder copy when the student's
 * college has a live standing. Team-sport framing: "your campus is 2 behind
 * MVSR — one more friend puts them ahead".
 */
export function buildCampusGapLine(campus: CampusGapContext | null | undefined): string | null {
  if (!campus) return null
  if (!campus.ahead) {
    return `🏫 Campus boost: ${campus.college} leads the whole college board (#1 of ${campus.totalColleges}) — help defend the top spot!`
  }
  const gap = campus.ahead.gap
  if (gap === 0) {
    return `🏫 Campus boost: ${campus.college} is TIED with ${campus.ahead.college} at #${campus.rank} of ${campus.totalColleges} campuses — one more friend breaks the tie and puts your campus ahead!`
  }
  return `🏫 Campus boost: ${campus.college} is #${campus.rank} of ${campus.totalColleges} campuses — just ${gap} ${gap === 1 ? "registration" : "registrations"} behind ${campus.ahead.college}. One more friend could put your campus ahead!`
}

/**
 * Pre-composed WhatsApp reminder. Personal, short, reward-led — mirrors the
 * tone of real campus-ambassador outreach. The referral link is appended so
 * the student can forward it with one tap.
 */
export function buildNudgeMessage(opts: {
  firstName: string
  currentCount: number
  tierName: string
  tierAt: number
  rewardText: string
  shareUrl: string
  /** Optional campus-competition line (from buildCampusGapLine). */
  campusGapLine?: string | null
}): string {
  const one = opts.currentCount + 1 === opts.tierAt
  const campus = opts.campusGapLine ? ["", opts.campusGapLine] : []
  return [
    `Hi ${opts.firstName}! 👋`,
    "",
    one
      ? `Quick update — you're just 1 referral away from the "${opts.tierName}" milestone (${opts.currentCount} so far, need ${opts.tierAt}).`
      : `Quick update — you're ${opts.tierAt - opts.currentCount} referrals away from the "${opts.tierName}" milestone (${opts.currentCount} so far, need ${opts.tierAt}).`,
    `Unlocked: ${opts.rewardText}`,
    ...campus,
    "",
    `One more friend just needs to register with your link:`,
    opts.shareUrl,
    "",
    "— NxtWave Growth Team",
  ].join("\n")
}

/** wa.me deep link with prefilled text (no API credentials needed). */
export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "")
  // Indian numbers: strip leading 0 or 91 if present, wa.me expects country code.
  const normalized = digits.replace(/^0/, "").replace(/^91(?=\d{10}$)/, "")
  return `https://wa.me/${normalized.length === 10 ? `91${normalized}` : normalized}?text=${encodeURIComponent(message)}`
}
