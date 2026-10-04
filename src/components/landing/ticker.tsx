import { maskName } from "@/lib/constants"

export interface TickerItem {
  maskedName: string
  college: string | null
  minutesAgo: number
}

function agoLabel(minutes: number): string {
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

/** Shorten a canonical college name for the ticker strip. */
function shortCollege(college: string | null): string {
  if (!college) return "—"
  const base = college.split("(")[0].trim()
  return base.length > 26 ? `${base.slice(0, 25)}…` : base
}

/**
 * Seamless live-registration marquee. Items arrive server-rendered from the
 * real registration DB (privacy-masked, like the leaderboard). The sequence
 * is duplicated once so the CSS translate(-50%) loop is perfectly seamless.
 */
export function LiveTicker({ registrations }: { registrations: { fullName: string; college: string | null; createdAt: Date }[] }) {
  if (registrations.length === 0) return null

  const items: TickerItem[] = registrations.map((r) => ({
    maskedName: maskName(r.fullName),
    college: r.college,
    minutesAgo: Math.max(0, Math.floor((Date.now() - r.createdAt.getTime()) / 60000)),
  }))

  return (
    <div
      className="marquee-fade marquee-hover relative border-y border-white/[0.07] bg-white/[0.03] py-3 backdrop-blur-sm"
      role="marquee"
      aria-label="Live registration activity"
    >
      <div className="flex w-max animate-marquee items-center gap-8 pr-8">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center gap-8" aria-hidden={copy === 1}>
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-300" />
              </span>
              Live feed
            </span>
            {items.map((item, i) => (
              <span
                key={`${copy}-${i}`}
                className="inline-flex shrink-0 items-center gap-2 text-[13px] text-slate-400"
              >
                <span className="size-1 rounded-full bg-violet-400/70" aria-hidden />
                <span className="font-semibold text-slate-200">{item.maskedName}</span>
                <span>from</span>
                <span className="text-violet-300">{shortCollege(item.college)}</span>
                <span className="text-slate-500">· {agoLabel(item.minutesAgo)}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
