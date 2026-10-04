import type { Metadata } from "next"
import Link from "next/link"
import {
  Activity,
  ArrowRight,
  BarChart3,
  Gift,
  Megaphone,
  SearchX,
  ShieldCheck,
  Trophy,
  Users,
  UserPlus,
} from "lucide-react"
import { Navbar } from "@/components/site/navbar"
import { Footer } from "@/components/site/footer"
import { Button } from "@/components/ui/button"
import { getSourceDetailStats } from "@/lib/stats"
import { maskName, trackingPathFor } from "@/lib/constants"
import { MILESTONE_TIERS } from "@/lib/milestones"
import { AmbassadorShareTools } from "@/components/ambassador/share-tools"
import { AddToHomeScreenHint } from "@/components/ambassador/a2hs-hint"
import { ServiceWorkerRegister } from "@/components/site/service-worker-register"
import { OfflineIndicator } from "@/components/site/offline-indicator"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Your Channel Board — NxtWave Growth Engine",
  description:
    "Ambassadors, club leads and creators: check how many registrations your tracking code drove, live.",
}

// Badge tone per channel type (kept in sync with the admin drill-down board).
const TYPE_STYLES: Record<string, string> = {
  ambassador: "bg-violet-500/15 text-violet-300 ring-violet-400/25",
  club: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/25",
  social: "bg-fuchsia-500/15 text-fuchsia-300 ring-fuchsia-400/25",
  human: "bg-violet-500/15 text-violet-300 ring-violet-400/25",
  community: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/25",
  other: "bg-white/[0.06] text-slate-300 ring-white/10",
}

export default async function AmbassadorPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const stats = await getSourceDetailStats(code)

  // Unknown or empty code → friendly recovery (no admin internals leaked).
  if (!stats) {
    return (
      <>
        <Navbar />
        <ServiceWorkerRegister />
        <OfflineIndicator />
        <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-20">
          <div className="glow-blob left-[-120px] top-[-80px] size-[360px] text-amber-500" aria-hidden />
          <div className="relative max-w-md rounded-2xl border border-amber-400/25 bg-white/[0.04] p-8 text-center shadow-sm backdrop-blur-sm">
            <SearchX className="mx-auto size-10 text-slate-600" aria-hidden />
            <h1 className="mt-4 font-display text-xl font-bold text-white">No channel data for this code</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              The tracking code <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs">{code}</code>{" "}
              isn&apos;t on the campaign list yet. If you just got your code, double-check it — or ask the
              growth team to add you.
            </p>
            <Button asChild variant="outline" className="mt-6 h-11 rounded-xl px-6">
              <Link href="/">Back to workshop page</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const { meta, funnel, trend, topReferrers } = stats
  const trackingPath = trackingPathFor(stats.code, meta.type)
  const typeLabel =
    meta.type === "ambassador" || meta.type === "human"
      ? "Campus Ambassador"
      : meta.type === "club" || meta.type === "community"
        ? "Club / Community"
        : meta.type === "social"
          ? "Social / Creator"
          : "Channel"
  const maxDaily = Math.max(...trend.map((t) => t.daily), 1)

  const metrics = [
    {
      icon: Users,
      label: "Registrations",
      value: funnel.registrations,
      hint: "students who used your link or QR",
      tint: "bg-violet-500/10 text-violet-300 ring-violet-400/25",
    },
    {
      icon: UserPlus,
      label: "Activated sharers",
      value: funnel.activatedReferrers,
      hint: "registrations who went on to refer a friend",
      tint: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/25",
    },
    {
      icon: Activity,
      label: "Referrals generated",
      value: funnel.referralsGenerated,
      hint: "total signups your channel's students drove",
      tint: "bg-amber-500/10 text-amber-300 ring-amber-400/25",
    },
    {
      icon: BarChart3,
      label: "Conversion rate",
      value: `${funnel.conversionRate}%`,
      hint: "referrals generated per registration",
      tint: "bg-fuchsia-500/10 text-fuchsia-300 ring-fuchsia-400/25",
    },
  ]

  return (
    <>
      <Navbar />
      <main id="main-content" className="flex-1">
        {/* ------------------------------ Hero ------------------------------ */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-grid-dots" aria-hidden />
          <div className="glow-blob left-[-80px] top-[-70px] size-[300px] text-violet-300" aria-hidden />
          <div className="glow-blob right-[-100px] top-[-30px] size-[280px] text-fuchsia-200" aria-hidden />
          <div className="relative mx-auto max-w-4xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1",
                  TYPE_STYLES[meta.type] ?? TYPE_STYLES.other,
                )}
              >
                <Megaphone className="size-3" aria-hidden />
                {typeLabel}
              </span>
              <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-400">
                Campaign day {stats.campaign.day} / {stats.campaign.totalDays}
              </span>
            </div>
            <h1 className="mt-4 text-balance font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {meta.ownerName ?? meta.name ?? "Channel"} board
            </h1>
            <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-slate-400 sm:text-base">
              Live numbers for tracking code{" "}
              <code className="rounded bg-violet-500/10 px-2 py-0.5 font-mono text-sm font-bold text-violet-300 ring-1 ring-violet-400/25">
                {stats.code}
              </code>
              . Everything updates the moment someone registers — bookmark this page and check it
              after every push.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
          {/* ------------------------------ Add-to-home-screen hint (mobile only) ------------------------------ */}
          <AddToHomeScreenHint />

          {/* ------------------------------ Metric cards ------------------------------ */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {metrics.map((m) => (
              <article
                key={m.label}
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-400/30 hover:shadow-md hover:shadow-violet-600/10"
              >
                <span
                  className={cn(
                    "inline-flex size-8 items-center justify-center rounded-lg ring-1 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3",
                    m.tint,
                  )}
                >
                  <m.icon className="size-4" aria-hidden />
                </span>
                <p className="mt-3 font-display text-2xl font-extrabold tabular-nums tracking-tight text-white">
                  {m.value}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-400">{m.label}</p>
                <p className="mt-1 text-[11px] leading-snug text-slate-500">{m.hint}</p>
              </article>
            ))}
          </div>

          {/* ------------------------------ 7-day trend ------------------------------ */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-sm font-bold text-white">Daily registrations</h2>
              <p className="text-[11px] text-slate-500">last {trend.length} days of the campaign</p>
            </div>
            <div className="mt-5 flex items-end gap-2" role="img" aria-label={`Daily registrations over the campaign: ${trend.map((t) => t.daily).join(", ")}`}>
              {trend.map((t, i) => (
                <div key={t.label} className="group/bar flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <span className="text-[11px] font-bold tabular-nums text-slate-400">{t.daily}</span>
                  <div
                    className={cn(
                      "w-full rounded-t-md transition-all duration-300 group-hover/bar:opacity-100",
                      i === trend.length - 1
                        ? "bg-gradient-to-t from-violet-600 to-fuchsia-500"
                        : "bg-gradient-to-t from-violet-400/80 to-fuchsia-400/70 opacity-80",
                    )}
                    style={{ height: `${Math.max((t.daily / maxDaily) * 88, t.daily > 0 ? 6 : 3)}px` }}
                  />
                  <span className="text-[10px] font-medium text-slate-500">{t.day}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ------------------------------ Top referrers (masked) ------------------------------ */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-sm font-bold text-white">Top sharers in your channel</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-slate-400 ring-1 ring-white/10">
                <ShieldCheck className="size-3" aria-hidden />
                Names privacy-masked
              </span>
            </div>
            {topReferrers.length === 0 ? (
              <p className="mt-4 rounded-xl bg-white/[0.06] p-4 text-xs text-slate-400">
                No one in your channel has referred a friend yet. Lead the way — share your own link
                from the toolkit below!
              </p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {topReferrers.map((r, i) => (
                  <li
                    key={r.referralCode}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <span
                      className={cn(
                        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold",
                        i === 0
                          ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25"
                          : "bg-white/[0.06] text-slate-400 ring-1 ring-white/10",
                      )}
                    >
                      {i === 0 ? <Trophy className="size-3.5" aria-hidden /> : `#${i + 1}`}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-100">{maskName(r.name)}</p>
                      <p className="truncate text-[11px] text-slate-500">{r.college ?? "—"}</p>
                    </div>
                    <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-violet-500/10 px-2.5 py-1 text-sm font-bold tabular-nums text-violet-300 ring-1 ring-violet-400/25">
                      {r.referralCount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ------------------------------ Share toolkit ------------------------------ */}
          <AmbassadorShareTools code={stats.code} trackingPath={trackingPath} />

          {/* ------------------------------ Milestone ladder teaser ------------------------------ */}
          <section className="rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-5 sm:p-6">
            <h2 className="inline-flex items-center gap-2 font-display text-sm font-bold text-white">
              <Gift className="size-4 text-amber-500" aria-hidden />
              What your sharers unlock
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              Students in your channel earn rewards as their own referrals climb — encourage them to
              share their personal dashboard links.
            </p>
            <div className="mt-3.5 flex flex-wrap gap-2">
              {MILESTONE_TIERS.map((tier) => (
                <span
                  key={tier.referralCount}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-slate-200 shadow-sm ring-1 ring-amber-400/25"
                >
                  <CheckDoodle />
                  {tier.referralCount} {tier.referralCount === 1 ? "referral" : "referrals"} → {tier.name}
                </span>
              ))}
            </div>
          </section>

          {/* ------------------------------ CTA ------------------------------ */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 via-white/[0.03] to-fuchsia-500/10 p-6 text-white sm:p-7">
            <h2 className="text-base font-bold">Want your own code on this board?</h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-300">
              Register for the workshop, start sharing your personal referral link, and the growth
              team will spotlight top students as official campus ambassadors.
            </p>
            <Button asChild variant="secondary" size="sm" className="mt-4 gap-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20">
              <Link href="/register">
                Join the workshop — it&apos;s free
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
      <ServiceWorkerRegister />
      <OfflineIndicator />
    </>
  )
}

function CheckDoodle() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 text-amber-500" fill="currentColor" aria-hidden>
      <path d="M6.2 11.4 3.4 8.6a1 1 0 0 1 1.4-1.4l1.4 1.38 4.4-4.4a1 1 0 1 1 1.4 1.42l-5.8 5.8a1 1 0 0 1-1.4 0Z" />
    </svg>
  )
}
