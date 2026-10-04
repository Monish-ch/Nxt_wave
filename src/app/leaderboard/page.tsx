import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Building2,
  Crown,
  Flame,
  Medal,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react"
import { Navbar } from "@/components/site/navbar"
import { Footer } from "@/components/site/footer"
import { Button } from "@/components/ui/button"
import { getCollegeStandings, getLeaderboard, getPublicStats } from "@/lib/stats"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Campus Leaderboard — Top Referrers",
  description:
    "Students driving the most registrations for NxtWave's free AI workshop. Share your referral link and climb the board.",
}

/** Privacy-friendly public display: first name + last initial. */
function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1].slice(0, 1).toUpperCase()}.`
}

const PODIUM_STYLES = [
  { ring: "ring-amber-300", chip: "from-amber-400 to-orange-500", label: "text-amber-300", medal: Crown },
  { ring: "ring-slate-300", chip: "from-slate-400 to-slate-500", label: "text-slate-300", medal: Medal },
  { ring: "ring-orange-300", chip: "from-orange-400 to-amber-600", label: "text-orange-300", medal: Medal },
]

const COLLEGE_PODIUM_STYLES = [
  { chip: "from-amber-400 to-orange-500", card: "border-amber-400/25 bg-gradient-to-b from-amber-500/15 to-transparent shadow-amber-500/20", medal: Crown },
  { chip: "from-slate-400 to-slate-500", card: "border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent", medal: Medal },
  { chip: "from-orange-400 to-amber-600", card: "border-orange-400/25 bg-gradient-to-b from-orange-500/10 to-transparent", medal: Medal },
]

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const ref = typeof sp.ref === "string" ? sp.ref : undefined
  const view = sp.view === "colleges" ? "colleges" : "students"

  const [{ entries, totalActiveReferrers, totalReferralRegistrations }, stats, colleges] =
    await Promise.all([getLeaderboard(25, ref), getPublicStats(), getCollegeStandings(10)])

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)
  const collegeTop3 = colleges.slice(0, 3)
  const collegeRest = colleges.slice(3)
  const maxCollegeTotal = colleges[0]?.total ?? 1

  // Segmented-control hrefs keep the ?ref= highlight param intact.
  function viewHref(v: "students" | "colleges") {
    const params = new URLSearchParams()
    if (v !== "students") params.set("view", v)
    if (ref) params.set("ref", ref)
    const qs = params.toString()
    return qs ? `/leaderboard?${qs}` : "/leaderboard"
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-dots" aria-hidden />
          <div className="glow-blob left-[-100px] top-[-70px] size-[340px] text-amber-400" aria-hidden />
          <div className="glow-blob right-[-120px] top-[30px] size-[380px] text-violet-400" aria-hidden />
          <div className="relative mx-auto max-w-4xl px-4 pb-10 pt-14 text-center sm:px-6 sm:pt-16">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-300">
              <Trophy className="size-3.5" aria-hidden />
              Campus Growth Leaderboard
            </p>
            <h1 className="mt-4 text-balance font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Students who move fastest,{" "}
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                rank first
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-slate-400 sm:text-base">
              Every friend who registers through a referral link counts here. Share yours, climb
              the board, unlock rewards at 1, 3, 5 and 10 referrals.
            </p>

            <dl className="mx-auto mt-8 grid max-w-lg grid-cols-3 divide-x divide-white/10 rounded-2xl border border-violet-400/25 bg-[#120e1f]/85 py-4 text-center shadow-lg shadow-violet-600/20 backdrop-blur">
              <div className="px-2">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Referral signups</dt>
                <dd className="mt-1 text-xl font-extrabold tabular-nums text-violet-300">{totalReferralRegistrations}</dd>
              </div>
              <div className="px-2">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Active referrers</dt>
                <dd className="mt-1 text-xl font-extrabold tabular-nums text-fuchsia-300">{totalActiveReferrers}</dd>
              </div>
              <div className="px-2">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Campaign day</dt>
                <dd className="mt-1 text-xl font-extrabold tabular-nums text-slate-100">
                  {stats.campaignDay}/{stats.campaignTotalDays}
                </dd>
              </div>
            </dl>

            {/* View toggle — students vs colleges (server-rendered, shareable URLs) */}
            <nav
              aria-label="Leaderboard view"
              className="mx-auto mt-6 inline-flex rounded-full border border-white/10 bg-white/[0.06] p-1 shadow-sm backdrop-blur"
            >
              <Link
                href={viewHref("students")}
                aria-current={view === "students" ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors sm:text-sm",
                  view === "students"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white",
                )}
              >
                <Users className="size-3.5" aria-hidden />
                Students
              </Link>
              <Link
                href={viewHref("colleges")}
                aria-current={view === "colleges" ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-colors sm:text-sm",
                  view === "colleges"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white",
                )}
              >
                <Building2 className="size-3.5" aria-hidden />
                Colleges
              </Link>
            </nav>
          </div>
        </section>

        {/* Board */}
        <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6" aria-label={view === "colleges" ? "College standings" : "Top referrers"}>
          {view === "students" && entries.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center shadow-sm">
              <Users className="mx-auto size-10 text-slate-500" aria-hidden />
              <h2 className="mt-4 font-display text-lg font-bold text-white">No referrals yet — the board is wide open</h2>
              <p className="mt-2 text-sm text-slate-400">
                Register, grab your link, and be the first name on this leaderboard.
              </p>
              <Button asChild className="mt-6 h-11 rounded-xl px-6 shadow-md shadow-violet-600/20">
                <Link href="/register">Register & get my link</Link>
              </Button>
            </div>
          ) : view === "students" ? (
            <>
              {/* Podium */}
              <div className="grid gap-4 sm:grid-cols-3">
                {top3.map((entry, i) => {
                  const style = PODIUM_STYLES[i]
                  const MedalIcon = style.medal
                  return (
                    <article
                      key={entry.referralCode}
                      className={cn(
                        "relative rounded-2xl border border-white/10 bg-white/[0.04] p-5 pt-7 text-center shadow-lg ring-2 backdrop-blur transition-transform duration-200 hover:-translate-y-1",
                        style.ring,
                        i === 0 ? "shadow-amber-500/20 sm:-mt-3" : "",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-md",
                          style.chip,
                          i === 0 ? "animate-float-y" : "",
                        )}
                      >
                        <MedalIcon className="size-3" aria-hidden />
                        Rank {entry.rank}
                      </span>
                      <p className="text-lg font-extrabold text-white">{maskName(entry.name)}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400" title={entry.college ?? undefined}>
                        {entry.college ?? "—"}
                      </p>
                      <p className={cn("mt-3 text-3xl font-extrabold tabular-nums", style.label)}>
                        {entry.referralCount}
                      </p>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">referrals</p>
                    </article>
                  )
                })}
              </div>

              {/* Rest of the board */}
              {rest.length > 0 && (
                <ol className="mt-6 space-y-2">
                  {rest.map((entry) => (
                    <li
                      key={entry.referralCode}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm transition-colors",
                        entry.isCurrentUser ? "border-violet-400/40 bg-violet-500/10 ring-1 ring-violet-400/25" : "border-white/10 bg-white/[0.04]",
                      )}
                    >
                      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-extrabold tabular-nums text-slate-400">
                        {entry.rank}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 truncate text-sm font-bold text-slate-100">
                          {maskName(entry.name)}
                          {entry.isCurrentUser && (
                            <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                              That&apos;s you
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-slate-400">{entry.college ?? "—"}</p>
                      </div>
                      <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-violet-500/10 px-2.5 py-1 text-sm font-bold tabular-nums text-violet-300 ring-1 ring-violet-400/25">
                        {entry.referralCount}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </>
          ) : (
            <>
              {/* College podium */}
              {colleges.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center shadow-sm">
                  <Building2 className="mx-auto size-10 text-slate-500" aria-hidden />
                  <h2 className="mt-4 font-display text-lg font-bold text-white">No colleges on the board yet</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Registrations will be grouped by college as they come in.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {collegeTop3.map((c, i) => {
                      const style = COLLEGE_PODIUM_STYLES[i]
                      const MedalIcon = style.medal
                      return (
                        <article
                          key={c.college}
                          className={cn(
                            "relative rounded-2xl border p-5 pt-7 text-center shadow-lg ring-2 ring-violet-400/25 transition-transform duration-200 hover:-translate-y-1 backdrop-blur",
                            style.card,
                            i === 0 ? "sm:-mt-3" : "",
                          )}
                        >
                          <span
                            className={cn(
                              "absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-md",
                              style.chip,
                              i === 0 ? "animate-float-y" : "",
                            )}
                          >
                            <MedalIcon className="size-3" aria-hidden />
                            #{c.rank} campus
                          </span>
                          <p className="truncate text-sm font-extrabold text-white" title={c.college}>
                            {c.college}
                          </p>
                          <p className="mt-3 text-3xl font-extrabold tabular-nums text-violet-300">{c.total}</p>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">registrations</p>
                          <p className="mt-2 text-[11px] font-medium text-slate-400">
                            {c.activeReferrers} active referrer{c.activeReferrers === 1 ? "" : "s"} ·{" "}
                            <span className="tabular-nums text-amber-300">{c.referralRegs} via referral</span>
                          </p>
                        </article>
                      )
                    })}
                  </div>

                  {/* College table */}
                  {collegeRest.length > 0 && (
                    <ol className="mt-6 space-y-2.5">
                      {collegeRest.map((c) => (
                        <li
                          key={c.college}
                          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-extrabold tabular-nums text-slate-400">
                              {c.rank}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-slate-100" title={c.college}>
                                {c.college}
                              </p>
                              <p className="truncate text-[11px] text-slate-500">
                                {c.activeReferrers} referrer{c.activeReferrers === 1 ? "" : "s"} ·{" "}
                                {c.referralRegs} via referral
                                {c.topReferrer && <> · best: {maskName(c.topReferrer.name)} ({c.topReferrer.referralCount})</>}
                              </p>
                            </div>
                            <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-violet-500/10 px-2.5 py-1 text-sm font-bold tabular-nums text-violet-300 ring-1 ring-violet-400/25">
                              {c.total}
                            </span>
                          </div>
                          {/* Share-of-leader bar */}
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]" aria-hidden>
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-[width] duration-500"
                              style={{ width: `${Math.max((c.total / maxCollegeTotal) * 100, 4)}%` }}
                            />
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}

                  {/* Club-competition note */}
                  <p className="mt-5 flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3.5 text-xs leading-relaxed text-amber-200">
                    <Flame className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden />
                    College standings use every registration from that campus — referrals push your
                    college up the board faster. Campus clubs can compete on this view even when
                    their best individuals don&apos;t top the student board.
                  </p>
                </>
              )}
            </>
          )}

          {/* CTA */}
          <div className="mt-10 rounded-2xl border border-white/10 bg-[#120e1f]/90 p-7 text-center shadow-[0_24px_90px_-24px] shadow-violet-950/70 backdrop-blur-xl">
            <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-400">
              <TrendingUp className="size-3.5" aria-hidden />
              {stats.seatsLeft} spots still open
            </p>
            <h2 className="mt-3 text-balance font-display text-xl font-extrabold text-white sm:text-2xl">
              {view === "colleges" ? "Put your campus on the map" : "Your name belongs on this board"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
              Register free, share your link on WhatsApp, and watch{" "}
              {view === "colleges" ? "your college climb" : "yourself climb"}. Rewards unlock
              automatically as you go.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
              <Button asChild size="lg" className="h-11 w-full rounded-xl bg-white px-6 font-semibold text-slate-950 hover:bg-violet-100 sm:w-auto">
                <Link href="/register">
                  <Sparkles className="size-4" aria-hidden />
                  Reserve My Free Spot
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 w-full rounded-xl border-white/20 bg-white/5 px-6 text-white hover:bg-white/10 sm:w-auto">
                <Link href="/#refer">
                  How referrals work
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
