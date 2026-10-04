"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarDays,
  FlaskConical,
  Gauge,
  Gift,
  Loader2,
  Megaphone,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { AdminStats } from "@/lib/stats"
import { SOURCE_STYLES, sourceLabel } from "@/lib/constants"
import { cn } from "@/lib/utils"
import {
  ChartCard,
  OverTimeChart,
  ReferralSplitChart,
  SourceChart,
  TopCollegesChart,
} from "@/components/admin/charts"
import { SourceDrilldown } from "@/components/admin/source-drilldown"
import { LinkGenerator } from "@/components/admin/link-generator"
import { NudgeQueue } from "@/components/admin/nudge-queue"
import { ChannelDigests } from "@/components/admin/channel-digests"
import { ShareVariantsCard } from "@/components/admin/share-variants-card"

/**
 * Required-vs-actual daily pace sparkline for the campaign pacing card.
 * Solid violet bars = actual registrations; dashed amber bars = the pace
 * still needed on remaining days (and on today, a dashed cap showing the
 * required height). Pure CSS — no chart library weight.
 */
function PaceSparkline({ stats }: { stats: AdminStats }) {
  const { overTime, campaign } = stats
  const needed = campaign.neededPerRemainingDay
  const scale = Math.max(...overTime.map((d) => d.daily), needed, 1)
  const todayIndex = campaign.daysLeft === 0 ? overTime.length - 1 : campaign.day - 1
  const BAR_AREA = 56 // px height of the bar zone

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Daily pace vs needed
        </p>
        <span className="flex items-center gap-3 text-[10px] font-medium text-slate-400">
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-sm bg-gradient-to-t from-violet-500 to-fuchsia-400" aria-hidden />
            actual
          </span>
          <span className="inline-flex items-center gap-1">
            <span
              className="size-2 rounded-sm border border-dashed border-amber-400 bg-amber-50"
              aria-hidden
            />
            needed pace
          </span>
        </span>
      </div>
      <div
        className="mt-2 flex items-end gap-1.5"
        role="img"
        aria-label={`Daily registrations vs required pace: ${overTime
          .map((d, i) => `day ${i + 1} ${d.daily}${i >= todayIndex && needed > 0 ? ` (needs ${needed})` : ""}`)
          .join(", ")}`}
      >
        {overTime.map((d, i) => {
          const isPast = i < todayIndex
          const isToday = i === todayIndex
          const actualH = Math.max((d.daily / scale) * BAR_AREA, d.daily > 0 ? 5 : 2)
          const neededH = Math.max((needed / scale) * BAR_AREA, 5)
          const showNeeded = !isPast && needed > 0
          return (
            <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span
                className={cn(
                  "text-[10px] font-bold tabular-nums",
                  isToday ? "text-violet-700" : isPast ? "text-slate-500" : "text-amber-600",
                )}
              >
                {isPast || isToday ? d.daily : `→${needed}`}
              </span>
              <div className="relative h-14 w-full" aria-hidden>
                {/* needed-pace ghost bar for today/future days */}
                {showNeeded && (
                  <div
                    className="absolute bottom-0 left-1/2 w-full max-w-8 -translate-x-1/2 rounded-md border border-dashed border-amber-400/90 bg-amber-50/50"
                    style={{ height: `${neededH}px` }}
                  />
                )}
                {/* actual bar */}
                {(isPast || isToday) && (
                  <div
                    className={cn(
                      "absolute bottom-0 left-1/2 w-full max-w-8 -translate-x-1/2 rounded-md transition-[height] duration-500",
                      isToday
                        ? "bg-gradient-to-t from-violet-600 to-fuchsia-500 shadow-sm shadow-violet-400/40"
                        : "bg-gradient-to-t from-violet-400/80 to-fuchsia-400/60",
                    )}
                    style={{ height: `${actualH}px` }}
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-[9.5px] font-semibold",
                  isToday ? "text-violet-600" : "text-slate-400",
                )}
              >
                {isToday ? "Today" : `D${i + 1}`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function DashboardView() {
  const [stats, setStats] = useState<AdminStats & { demoMode?: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)
  const [cleaning, setCleaning] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" })
      if (res.status === 401) {
        window.location.href = "/admin/login"
        return
      }
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      setStats(await res.json())
    } catch {
      setError("Couldn't load dashboard metrics. Check your connection and retry.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function resetDemo() {
    setResetting(true)
    try {
      const res = await fetch("/api/admin/demo-reset", { method: "POST" })
      const data = await res.json()
      if (res.ok && data.ok) {
        toast.success("Demo data regenerated", {
          description: `${data.registrations} registrations · ${data.referrals} referral records`,
        })
        await load()
      } else {
        toast.error(data.error ?? "Reset failed.")
      }
    } catch {
      toast.error("Network error while resetting.")
    } finally {
      setResetting(false)
    }
  }

  /** Retroactive sweep of near-duplicate college spellings (data hygiene). */
  async function cleanColleges() {
    setCleaning(true)
    try {
      const res = await fetch("/api/admin/normalize-colleges", { method: "POST" })
      const data = await res.json()
      if (res.ok && data.ok) {
        if (data.changed === 0) {
          toast.info("College names are already clean", {
            description: `${data.distinctBefore} distinct spellings, no near-duplicates found.`,
          })
        } else {
          toast.success(`Merged ${data.changed} registration${data.changed === 1 ? "" : "s"} into canonical college names`, {
            description: data.merges
              .slice(0, 3)
              .map((m: { from: string; to: string; count: number }) => `“${m.from}” → “${m.to}” (${m.count})`)
              .join(" · "),
          })
          await load()
        }
      } else {
        toast.error(data.error ?? "College cleanup failed.")
      }
    } catch {
      toast.error("Network error while cleaning college names.")
    } finally {
      setCleaning(false)
    }
  }

  if (loading) return <DashboardSkeleton />
  if (error || !stats) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-12 text-center">
        <AlertTriangle className="size-10 text-destructive" aria-hidden />
        <p className="max-w-sm text-sm text-slate-700">{error ?? "Unknown error."}</p>
        <Button onClick={load} variant="outline" className="gap-1.5">
          <RefreshCw className="size-4" aria-hidden /> Retry
        </Button>
      </div>
    )
  }

  const filledPct = Math.min(stats.percentOfTarget, 100)

  return (
    <div className="space-y-6">
      {/* ------------------------------ Page header ------------------------------ */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Growth dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Campaign day {stats.campaign.day} of {stats.campaign.totalDays} · Every metric computed
            live from registration data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={cleanColleges}
            disabled={cleaning}
            className="gap-1.5 border-fuchsia-200 text-fuchsia-700 hover:bg-fuchsia-50"
            title="Merge near-duplicate college spellings into the canonical form so campus standings stay accurate"
          >
            {cleaning ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
            Clean college names
          </Button>
          {stats.demoMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetDemo}
              disabled={resetting}
              className="gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
            >
              {resetting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <FlaskConical className="size-4" aria-hidden />}
              Reset demo data
            </Button>
          )}
          <Button asChild size="sm" className="gap-1.5 shadow-md shadow-violet-600/20">
            <Link href="/admin/registrations">
              <Users className="size-4" aria-hidden />
              All registrations
            </Link>
          </Button>
        </div>
      </div>

      {/* ------------------------------ Metric cards ------------------------------ */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          icon={<Users className="size-4" />}
          tint="violet"
          label="Total registrations"
          value={stats.totalRegistrations}
          foot={`${stats.percentOfTarget}% of 500 target`}
        />
        <MetricCard
          icon={<CalendarDays className="size-4" />}
          tint="emerald"
          label="Registered today"
          value={stats.registrationsToday}
          foot={`${stats.campaign.pacePerDay}/day avg pace`}
        />
        <MetricCard
          icon={<Gift className="size-4" />}
          tint="amber"
          label="Referral registrations"
          value={stats.referralRegistrations}
          foot={`${stats.referralPercent}% of all registrations`}
        />
        <MetricCard
          icon={<Building2 className="size-4" />}
          tint="fuchsia"
          label="Colleges reached"
          value={stats.collegeCount}
          foot="unique campuses"
        />
        <MetricCard
          icon={<Megaphone className="size-4" />}
          tint="teal"
          label="Active referrers"
          value={stats.activeReferrers}
          foot="students sharing links"
        />
        <MetricCard
          icon={<Target className="size-4" />}
          tint="rose"
          label="Target"
          value={500}
          foot={`${filledPct}% filled`}
          progress={filledPct}
        />
      </div>

      {/* ------------------------------ Campaign pacing ------------------------------ */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Campaign pacing">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
            <Gauge className="size-4 text-violet-600" aria-hidden />
            Campaign pacing
          </h2>
          <p className="text-xs text-slate-500">
            Day {stats.campaign.day} / {stats.campaign.totalDays}
          </p>
        </div>
        <Progress value={(stats.campaign.day / stats.campaign.totalDays) * 100} className="progress-live mt-3 h-2" aria-label="Campaign time elapsed" />
        <div className="mt-4 grid gap-4 text-center sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Current pace</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">
              {stats.campaign.pacePerDay} <span className="text-xs font-medium text-slate-500">regs/day</span>
            </p>
          </div>
          <div className="rounded-xl bg-violet-50 p-3.5 ring-1 ring-violet-100">
            <p className="text-[11px] font-medium uppercase tracking-wide text-violet-600">Projected final</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-violet-700">
              {stats.campaign.projectedFinal} <span className="text-xs font-medium text-violet-500">/ 500</span>
            </p>
          </div>
          <div
            className={`rounded-xl p-3.5 ring-1 transition-colors ${
              stats.campaign.spotsLeft === 0
                ? "bg-emerald-50 ring-emerald-200"
                : stats.campaign.daysLeft === 0
                  ? "animate-pulse-halo-rose bg-rose-50 ring-rose-200"
                  : "bg-amber-50 ring-amber-100"
            }`}
          >
            <p
              className={`text-[11px] font-medium uppercase tracking-wide ${
                stats.campaign.spotsLeft === 0
                  ? "text-emerald-600"
                  : stats.campaign.daysLeft === 0
                    ? "text-rose-600"
                    : "text-amber-600"
              }`}
            >
              {stats.campaign.spotsLeft === 0
                ? "Target status"
                : stats.campaign.daysLeft === 0
                  ? "Final day — needed today"
                  : "Needed per day"}
            </p>
            <p
              className={`mt-1 text-lg font-bold tabular-nums ${
                stats.campaign.spotsLeft === 0
                  ? "text-emerald-700"
                  : stats.campaign.daysLeft === 0
                    ? "text-rose-700"
                    : "text-amber-700"
              }`}
            >
              {stats.campaign.spotsLeft === 0
                ? "Goal reached 🎉"
                : `${stats.campaign.neededPerRemainingDay} ${
                    stats.campaign.daysLeft === 0 ? "today!" : "/ day"
                  }`}
            </p>
            {stats.campaign.daysLeft === 0 && stats.campaign.spotsLeft > 0 && (
              <p className="mt-0.5 text-[11px] font-medium text-rose-500">
                {stats.campaign.spotsLeft} spots left · every signup counts
              </p>
            )}
          </div>
        </div>

        {/* Required-vs-actual daily pace, at a glance */}
        <PaceSparkline stats={stats} />
      </section>

      {/* ------------------------------ Charts ------------------------------ */}
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Registrations over time"
          subtitle="Daily volume with cumulative curve across the 7-day campaign"
        >
          <OverTimeChart data={stats.overTime} />
        </ChartCard>

        <ChartCard
          title="Registrations by source"
          subtitle="Which acquisition channels are pulling weight"
        >
          <SourceChart data={stats.bySource} />
        </ChartCard>

        <ChartCard
          title="Referrals vs direct"
          subtitle={`${stats.referralPercent}% of students came through a friend's referral link`}
        >
          <ReferralSplitChart data={stats.referralVsDirect} />
        </ChartCard>

        <ChartCard title="Top colleges" subtitle="Campuses with the most registrations">
          <TopCollegesChart data={stats.topColleges} />
        </ChartCard>
      </div>

      {/* ------------------------------ Invite A/B test ------------------------------ */}
      <ShareVariantsCard stats={stats} />

      {/* ------------------------------ Channel drill-down ------------------------------ */}
      <SourceDrilldown />

      {/* ------------------------------ Nudge queue (WhatsApp simulator) ------------------------------ */}
      <NudgeQueue />

      {/* ------------------------------ Channel owner digests ------------------------------ */}
      <ChannelDigests />

      {/* ------------------------------ Campaign link generator ------------------------------ */}
      <LinkGenerator />

      {/* ------------------------------ Tables ------------------------------ */}
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="top-referrers-heading">
          <header className="flex items-center justify-between">
            <h2 id="top-referrers-heading" className="text-sm font-bold text-slate-900">
              Top referrers
            </h2>
            <Link href="/admin/registrations" className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700">
              View all <ArrowUpRight className="size-3.5" aria-hidden />
            </Link>
          </header>
          <div className="mt-4 max-h-80 overflow-y-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">College</TableHead>
                  <TableHead className="text-right text-xs">Referrals</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topReferrers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-sm text-slate-400">
                      No referrals yet — share the workshop link to start the loop.
                    </TableCell>
                  </TableRow>
                )}
                {stats.topReferrers.map((r, i) => (
                  <TableRow key={r.referralCode}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold",
                            i === 0
                              ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          #{i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">{r.name}</p>
                          <p className="font-mono text-[10.5px] text-slate-400">{r.referralCode}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-44">
                      <p className="truncate text-xs text-slate-500" title={r.college ?? undefined}>
                        {r.college ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-violet-50 px-2.5 py-1 text-sm font-bold tabular-nums text-violet-700 ring-1 ring-violet-100">
                        {r.referralCount}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="top-sources-heading">
          <h2 id="top-sources-heading" className="text-sm font-bold text-slate-900">
            Top acquisition sources
          </h2>
          <div className="mt-4 space-y-3">
            {stats.bySource.map((s) => (
              <div key={s.source} className="flex items-center gap-3">
                <span className={cn("inline-flex w-36 shrink-0 items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", SOURCE_STYLES[s.source as keyof typeof SOURCE_STYLES] ?? SOURCE_STYLES.other)}>
                  {sourceLabel(s.source)}
                </span>
                <div className="min-w-0 flex-1">
                  <Progress value={s.percent} className="h-2" aria-label={`${s.percent}% from ${s.label}`} />
                </div>
                <span className="w-12 text-right text-sm font-bold tabular-nums text-slate-800">{s.count}</span>
                <span className="w-12 text-right text-xs tabular-nums text-slate-500">{s.percent}%</span>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <h3 className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
              <TrendingUp className="size-3.5 text-emerald-500" aria-hidden />
              Latest registrations
            </h3>
            <ul className="mt-3 space-y-2.5">
              {stats.recentRegistrations.slice(0, 5).map((r, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                      {r.fullName.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="truncate font-semibold text-slate-700">{r.fullName}</span>
                    <span className="hidden truncate text-slate-400 sm:inline">· {r.college ?? "—"}</span>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1", SOURCE_STYLES[r.source as keyof typeof SOURCE_STYLES] ?? SOURCE_STYLES.other)}>
                    {sourceLabel(r.source)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- Metric card
const TINTS = {
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  fuchsia: "bg-fuchsia-50 text-fuchsia-600 ring-fuchsia-100",
  teal: "bg-teal-50 text-teal-600 ring-teal-100",
  rose: "bg-rose-50 text-rose-600 ring-rose-100",
} as const

function MetricCard({
  icon,
  tint,
  label,
  value,
  foot,
  progress,
}: {
  icon: React.ReactNode
  tint: keyof typeof TINTS
  label: string
  value: number
  foot?: string
  progress?: number
}) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md hover:shadow-violet-600/10">
      <div className="flex items-center justify-between">
        <span className={cn("inline-flex size-8 items-center justify-center rounded-lg ring-1 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3", TINTS[tint])}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-extrabold tabular-nums tracking-tight text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-slate-600">{label}</p>
      {progress !== undefined ? (
        <Progress value={progress} className="mt-2.5 h-1.5" aria-label={`${progress}% of target`} />
      ) : null}
      {foot && <p className="mt-1.5 text-[11px] text-slate-400">{foot}</p>}
    </article>
  )
}

// ---------------------------------------------------------------- Skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard">
      <div className="h-9 w-64 animate-pulse rounded-lg bg-slate-200" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-200/70" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-2xl bg-slate-200/70" />
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200/70" />
        ))}
      </div>
      <p className="sr-only">Loading dashboard metrics…</p>
    </div>
  )
}
