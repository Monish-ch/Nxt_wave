// ---------------------------------------------------------------------------
// Invite-message A/B variants — the success dashboard lets each student pick
// one of three message styles to share. The chosen style is embedded in the
// link as ?v=<key>, travels through the referral landing page into the
// registration record (registrations.shareVariant), and is aggregated on the
// admin dashboard so the team can see which copy actually converts friends.
// ---------------------------------------------------------------------------

export const SHARE_VARIANTS = ["friendly", "achievement", "urgent"] as const

export type ShareVariantKey = (typeof SHARE_VARIANTS)[number]

export interface ShareVariant {
  key: ShareVariantKey
  label: string
  tagline: string
  emoji: string
  /** Chip/badge tone classes. */
  accent: string
  activeAccent: string
  message: (link: string) => string
}

export const DEFAULT_SHARE_VARIANT: ShareVariantKey = "friendly"

export const SHARE_VARIANT_MAP: Record<ShareVariantKey, ShareVariant> = {
  friendly: {
    key: "friendly",
    label: "Friendly",
    tagline: "Warm & personal — works best with classmates you know",
    emoji: "👋",
    accent: "text-violet-700 ring-violet-200 bg-violet-50",
    activeAccent: "bg-violet-600 text-white ring-violet-600",
    message: (link) =>
      `Hey! I just reserved my free spot for NxtWave's "Build Your First AI Project in 60 Minutes" workshop. It's 100% free and you actually build an AI project live — registering here: ${link}`,
  },
  achievement: {
    key: "achievement",
    label: "Achievement",
    tagline: "Leads with the outcome — great for group chats & class groups",
    emoji: "🏆",
    accent: "text-amber-700 ring-amber-200 bg-amber-50",
    activeAccent: "bg-amber-500 text-white ring-amber-500",
    message: (link) =>
      `Just built my first AI project in ONE hour at NxtWave's free workshop 🤯 — this is going straight on my resume. Final-year folks, grab a spot and build yours too: ${link}`,
  },
  urgent: {
    key: "urgent",
    label: "Urgent",
    tagline: "Scarcity-driven — best for big groups where seats run out fast",
    emoji: "⚡",
    accent: "text-fuchsia-700 ring-fuchsia-200 bg-fuchsia-50",
    activeAccent: "bg-fuchsia-600 text-white ring-fuchsia-600",
    message: (link) =>
      `⏳ NxtWave's free "Build Your First AI Project in 60 Minutes" workshop is capped at 500 students and spots are filling fast. Final-years — lock yours before they're gone: ${link}`,
  },
}

export const SHARE_VARIANT_LIST: ShareVariant[] = SHARE_VARIANTS.map((k) => SHARE_VARIANT_MAP[k])

/** Safe parse of an incoming ?v= / payload value → valid variant key or null. */
export function parseShareVariant(raw?: string | null): ShareVariantKey | null {
  if (!raw) return null
  const key = raw.toLowerCase().trim()
  return (SHARE_VARIANTS as readonly string[]).includes(key) ? (key as ShareVariantKey) : null
}

export function isShareVariantKey(value: unknown): value is ShareVariantKey {
  return typeof value === "string" && (SHARE_VARIANTS as readonly string[]).includes(value)
}
