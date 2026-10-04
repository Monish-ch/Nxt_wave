// ---------------------------------------------------------------------------
// Campaign-level constants shared across the app.
// ---------------------------------------------------------------------------

export const TARGET_REGISTRATIONS = 500
export const CAMPAIGN_DURATION_DAYS = 7
export const WORKSHOP_NAME = "Build Your First AI Project in 60 Minutes"
export const BRAND = "NxtWave"

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true"

/** Source keys stored in `registrations.source`. */
export const SOURCES = [
  "ambassador",
  "club",
  "whatsapp",
  "referral",
  "instagram",
  "other",
] as const

export type SourceKey = (typeof SOURCES)[number]

export const SOURCE_LABELS: Record<SourceKey, string> = {
  ambassador: "Campus Ambassador",
  club: "College Club",
  whatsapp: "WhatsApp Group",
  referral: "Friend / Referral",
  instagram: "Instagram",
  other: "Other",
}

export const SOURCE_OPTIONS = SOURCES.map((value) => ({
  value,
  label: SOURCE_LABELS[value],
}))

/** Badge tones used across landing/admin for consistent source color-coding. */
export const SOURCE_STYLES: Record<SourceKey, string> = {
  ambassador: "bg-violet-500/15 text-violet-600 ring-violet-500/25",
  club: "bg-emerald-500/15 text-emerald-600 ring-emerald-500/25",
  whatsapp: "bg-teal-500/15 text-teal-600 ring-teal-500/25",
  referral: "bg-amber-500/15 text-amber-700 ring-amber-500/25",
  instagram: "bg-fuchsia-500/15 text-fuchsia-600 ring-fuchsia-500/25",
  other: "bg-slate-500/15 text-slate-600 ring-slate-500/25",
}

export const BRANCHES = [
  "CSE",
  "IT",
  "ECE",
  "EEE",
  "Mechanical",
  "Civil",
  "AI & ML",
  "Data Science",
  "Other",
] as const

export function sourceLabel(source?: string | null): string {
  if (!source) return "Unknown"
  return SOURCE_LABELS[source as SourceKey] ?? source
}

export function sourceStyle(source?: string | null): string {
  if (!source) return SOURCE_STYLES.other
  return SOURCE_STYLES[source as SourceKey] ?? SOURCE_STYLES.other
}

/**
 * Maps a CampaignSource type (human / community / social / other) to the
 * registration form's `source` key so captured attribution stays clean.
 * Shared by the admin link generator, channel drill-down and the public
 * ambassador page.
 */
export function sourceParamForType(type: string | null | undefined): SourceKey {
  if (type === "human" || type === "ambassador") return "ambassador"
  if (type === "community" || type === "club") return "club"
  if (type === "social") return "instagram"
  return "other"
}

/** Build the tracked registration path for a campaign code. */
export function trackingPathFor(code: string, type: string | null | undefined): string {
  return `/register?source=${sourceParamForType(type)}&code=${encodeURIComponent(code)}`
}

/** Privacy-safe display name: "Monisha Reddy" → "Monisha R." */
export function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1].slice(0, 1).toUpperCase()}.`
}
