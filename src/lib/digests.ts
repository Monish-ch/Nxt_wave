// ---------------------------------------------------------------------------
// Channel digests — the "scheduled report" step of the OPTIMIZE loop, in its
// demo-friendly form. Composes a WhatsApp-style weekly update per channel
// owner from the SAME live numbers the admin console shows. Delivery in the
// simulation = copy/paste (or the owner's public board link); in production
// this payload is what an email/WhatsApp sender would render.
// ---------------------------------------------------------------------------

import type { SourceDetailStats } from "./stats"

export interface DigestRow {
  code: string
  name: string | null
  ownerName: string | null
  type: string
  funnel: SourceDetailStats["funnel"]
  /** Signups so far today (last trend bucket). */
  todayCount: number
  /** Best referrer within the channel, privacy-masked. */
  topReferrer: { name: string; referralCount: number } | null
  /** Public owner-view board path (no login). */
  boardPath: string
  /** Admin CSV report path (session-authenticated). */
  csvPath: string
  /** Pre-composed, ready-to-send digest message. */
  message: string
  /** Audit trail: how many times this digest was handed off, and when last. */
  sent: {
    count: number
    lastAt: string | null
    lastMessage: string | null
  }
}

/**
 * WhatsApp-flavored owner digest. Short, numbers-first, with one clear
 * takeaway (top referrer) and one nudge-shaped close (keep pushing today).
 */
export function buildDigestMessage(opts: {
  ownerName: string | null
  code: string
  funnel: SourceDetailStats["funnel"]
  todayCount: number
  topReferrer: { name: string; referralCount: number } | null
  boardUrl: string
  campaignDay: number
  totalDays: number
}): string {
  const firstName = opts.ownerName?.trim().split(/\s+/)[0]
  const greeting = firstName ? `Hi ${firstName}!` : `Hi there!`
  const f = opts.funnel
  const top = opts.topReferrer
    ? `\n🏆 Top referrer in your channel: ${opts.topReferrer.name} (${opts.topReferrer.referralCount} ${opts.topReferrer.referralCount === 1 ? "friend" : "friends"})`
    : ""
  const today = opts.todayCount > 0 ? `\n📈 Today so far: +${opts.todayCount}` : ""

  return [
    greeting,
    `Here's your NxtWave Growth Engine channel update for ${opts.code}:`,
    "",
    `📊 ${f.registrations} registrations`,
    `🔥 ${f.activatedReferrers} started referring friends`,
    `🎯 ${f.referralsGenerated} registrations came via their links (${f.conversionRate}% conversion)`,
    top,
    today,
    "",
    `📅 Campaign day ${opts.campaignDay} of ${opts.totalDays} — every registration counts!`,
    `Watch your live board anytime (no login): ${opts.boardUrl}`,
    "",
    "— NxtWave Growth Team",
  ]
    .filter((line) => line !== "")
    .join("\n")
}
