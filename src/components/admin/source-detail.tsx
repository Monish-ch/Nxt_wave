"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  Copy,
  Download,
  Flame,
  FlaskConical,
  GraduationCap,
  LineChart,
  ListFilter,
  Loader2,
  Megaphone,
  Table2,
  TrendingUp,
  UserCheck,
  Users2,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"
import { type SourceDetailStats } from "@/lib/stats"
import { trackingPathFor } from "@/lib/constants"
import { cn } from "@/lib/utils"

const TOOLTIP_STYLE = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  color: "var(--popover-foreground)",
}

const TYPE_STYLES: Record<string, string> = {
  ambassador: "bg-violet-100 text-violet-700 ring-violet-200",
  human: "bg-violet-100 text-violet-700 ring-violet-200",
  club: "bg-teal-100 text-teal-700 ring-teal-200",
  community: "bg-teal-100 text-teal-700 ring-teal-200",
  social: "bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200",
  viral: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  other: "bg-slate-100 text-slate-600 ring-slate-200",
  uncatalogued: "bg-amber-50 text-amber-700 ring-amber-200",
}

const TYPE_LABELS: Record<string, string> = {
  ambassador: "Ambassador",
  human: "Ambassador",
  club: "Club",
  community: "Club",
  social: "Social",
  viral: "Viral",
  other: "Other",
  uncatalogued: "Uncatalogued",
}

/**
 * Ambassador / channel sub-dashboard: full funnel, daily trend, branch mix
 * and top referrers for ONE campaign code. Reached from the Channel
 * drill-down cards on the main dashboard.
 */
export function SourceDetail({ code }: { code: string }) {
  const [stats, setStats] = useState<SourceDetailStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/sources/${encodeURIComponent(code)}`, { cache: "no-store" })
      if (res.status === 401) {
        window.location.href = "/admin/login?next=/admin/sources/" + encodeURIComponent(code)
        return
      }
      if (res.status === 404) {
        setNotFound(true)
        return
      }
      if (!res.ok) throw new Error(String(res.status))
      setStats(await res.json())
    } catch {
      setNotFound(false)
      toast.error("Couldn't load channel analytics.")
    } finally {
      setLoading(false)
    }
  }, [code])

  useEffect(() => {
    load()
  }, [load])

  async function copyTrackingLink() {
    // Shared helper maps the channel type to the registration form's source
    // key so the captured attribution is clean (ambassador / club / instagram / other).
    const origin = window.location.origin
    const link = `${origin}${trackingPathFor(code, stats?.meta.type)}`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
      toast.success("Tracking link copied")
    } catch {
      toast.error("Couldn't access the clipboard.")
    }
  }

  /** Fetch the CSV report and trigger a download (blob keeps auth cookies in play). */
  async function exportReport() {
    setExporting(true)
    try {
      const res = await fetch(`/api/admin/sources/${encodeURIComponent(code)}/export`, {
        cache: "no-store",
      })
      if (res.status === 401) {
        window.location.href = "/admin/login?next=/admin/sources/" + encodeURIComponent(code)
        return
      }
      if (!res.ok) throw new Error(String(res.status))
      const blob = await res.blob()
      const disposition = res.headers.get("Content-Disposition") ?? ""
      const match = disposition.match(/filename="?([^";]+)"?/)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = match?.[1] ?? `channel-${code}-report.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success("Channel report downloaded", {
        description: "CSV with funnel, style mix, trend and every registration.",
      })
    } catch {
      toast.error("Couldn't export the channel report.")
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading channel analytics">
        <div className="h-9 w-72 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-slate-200/70" />
        <p className="sr-only">Loading channel analytics…</p>
      </div>
    )
  }

  if (notFound || !stats) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <Megaphone className="mx-auto size-10 text-slate-300" aria-hidden />
        <h1 className="mt-4 text-lg font-bold text-slate-900">No data for &ldquo;{code}&rdquo;</h1>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          This code has no attributed registrations yet — either it hasn&apos;t been shared, or the
          tracking tag was never used on a registration link.
        </p>
        <Button asChild variant="outline" className="mt-5 gap-1.5">
          <Link href="/admin">
            <ArrowLeft className="size-4" aria-hidden /> Back to dashboard
          </Link>
        </Button>
      </div>
    )
  }

  const { funnel } = stats
  const funnelStages = [
    { label: "Registrations", value: funnel.registrations, hint: "direct signups via this code", tone: "bg-violet-500" },
    {
      label: "Activated referrers",
      value: funnel.activatedReferrers,
      hint: `${funnel.activationRate}% referred at least one friend`,
      tone: "bg-fuchsia-500",
    },
    {
      label: "Referral conversions",
      value: funnel.referralsGenerated,
      hint: `friends brought in · ${funnel.conversionRate}% of registrations`,
      tone: "bg-emerald-500",
    },
  ]

  return (
    <div className="space-y-6">
      {/* ------------------------------ Header ------------------------------ */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-violet-600"
          >
            <ArrowLeft className="size-3.5" aria-hidden /> Growth dashboard
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
            <h1 className="font-mono text-2xl font-extrabold tracking-tight text-slate-900">{stats.code}</h1>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-bold ring-1",
                TYPE_STYLES[stats.meta.type] ?? TYPE_STYLES.other,
              )}
            >
              {TYPE_LABELS[stats.meta.type] ?? stats.meta.type}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {stats.meta.name ?? "Uncatalogued channel"}
            {stats.meta.ownerName ? ` · run by ${stats.meta.ownerName}` : ""} · campaign day{" "}
            {stats.campaign.day} of {stats.campaign.totalDays}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-slate-500 hover:text-violet-600">
            <Link href={`/ambassador/${encodeURIComponent(stats.code)}`}>
              <UserCheck className="size-4" aria-hidden />
              Owner view ↗
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={copyTrackingLink} className="gap-1.5">
            {copied ? <Check className="size-4 text-emerald-600" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? "Copied" : "Copy tracking link"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportReport}
            disabled={exporting}
            className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            title="Download this channel's full report as CSV (funnel, style mix, trend, registrations)"
          >
            {exporting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
            Export report
          </Button>
          <Button asChild size="sm" className="gap-1.5 shadow-md shadow-violet-600/20">
            <Link href={`/admin/registrations?sourceCode=${encodeURIComponent(stats.code)}`}>
              <Table2 className="size-4" aria-hidden />
              View registrations
            </Link>
          </Button>
        </div>
      </div>

      {/* ------------------------------ Metric cards ------------------------------ */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          icon={<Users2 className="size-4" />}
          tint="violet"
          label="Registrations"
          value={funnel.registrations}
          foot="attributed to this code"
        />
        <MetricCard
          icon={<Zap className="size-4" />}
          tint="fuchsia"
          label="Activated referrers"
          value={funnel.activatedReferrers}
          foot={`${funnel.activationRate}% of signups refer`}
        />
        <MetricCard
          icon={<TrendingUp className="size-4" />}
          tint="emerald"
          label="Referral conversions"
          value={funnel.referralsGenerated}
          foot="friends brought in"
        />
        <MetricCard
          icon={<Flame className="size-4" />}
          tint="amber"
          label="Viral factor"
          value={funnel.registrations > 0 ? Math.round((funnel.referralsGenerated / funnel.registrations) * 100) / 100 : 0}
          foot="referrals per registration"
          decimals
        />
      </div>

      {/* ------------------------------ Funnel ------------------------------ */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="funnel-heading">
        <h2 id="funnel-heading" className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
          <BarChart3 className="size-4 text-violet-600" aria-hidden />
          Channel funnel
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          How this code converts cold signups into a self-sustaining referral engine
        </p>
        <ol className="mt-4 space-y-3">
          {funnelStages.map((stage, i) => {
            const pct = funnel.registrations > 0 ? Math.round((stage.value / funnel.registrations) * 100) : 0
            return (
              <li key={stage.label} className="flex items-center gap-3">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-extrabold text-slate-500">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <p className="font-semibold text-slate-700">{stage.label}</p>
                    <p className="tabular-nums text-slate-500">
                      <strong className="text-sm font-bold text-slate-900">{stage.value}</strong> · {pct}%
                    </p>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn("h-full rounded-full transition-[width] duration-700", stage.tone)}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">{stage.hint}</p>
                </div>
                {i < funnelStages.length - 1 && (
                  <ArrowRight className="hidden size-4 shrink-0 text-slate-300 sm:block" aria-hidden />
                )}
              </li>
            )
          })}
        </ol>
      </section>

      {/* ------------------------------ Invite style mix (variant × channel) ------------------------------ */}
      {stats.variantMix.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="variant-mix-heading">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 id="variant-mix-heading" className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
                <FlaskConical className="size-4 text-fuchsia-500" aria-hidden />
                Invite style mix
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Which share-message style pulls signups inside <span className="font-semibold text-slate-700">{stats.code}</span>
              </p>
            </div>
            <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
              cross-tab · style × channel
            </span>
          </header>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.variantMix.map((v, i) => (
              <li
                key={v.variant}
                className={cn(
                  "animate-swap-in rounded-xl border p-3.5",
                  i === 0
                    ? "border-amber-200 bg-gradient-to-br from-amber-50/70 to-white"
                    : "border-slate-200 bg-white",
                )}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">
                    <span aria-hidden>{v.emoji}</span> {v.label}
                  </p>
                  <p className="text-xs font-bold tabular-nums text-slate-900">
                    {v.count}
                    <span className="ml-1 text-[10px] font-medium text-slate-400">signups</span>
                  </p>
                </div>
                <Progress
                  value={v.percent}
                  className={cn("mt-2 h-1.5", i === 0 && "[&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-400")}
                  aria-label={`${v.percent}% of tagged signups in this channel used the ${v.label} style`}
                />
                <p className="mt-1 text-[11px] font-medium text-slate-500">{v.percent}% of tagged signups here</p>
              </li>
            ))}
          </ul>
          {stats.variantUntagged > 0 && (
            <p className="mt-3 text-[11px] text-slate-400">
              + {stats.variantUntagged} signup{stats.variantUntagged === 1 ? "" : "s"} via untagged links (QR posters, old shares) sit outside the style test.
            </p>
          )}
        </section>
      )}

      {/* ------------------------------ Trend + branch mix ------------------------------ */}
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="trend-heading">
          <h2 id="trend-heading" className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
            <LineChart className="size-4 text-violet-600" aria-hidden />
            Registrations over time
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">Daily volume across the 7-day campaign window</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats.trend} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: number | string, name: string) => [
                    value,
                    name === "daily" ? "Daily" : "Cumulative",
                  ]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
                />
                <Bar dataKey="daily" fill="var(--chart-1)" radius={[5, 5, 0, 0]} maxBarSize={34} />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="var(--chart-4)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "var(--chart-4)" }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="branch-heading">
          <h2 id="branch-heading" className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
            <GraduationCap className="size-4 text-fuchsia-600" aria-hidden />
            Branch mix
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">Which engineering branches this channel reaches</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.branches.map((b) => ({ ...b, short: b.branch.length > 12 ? `${b.branch.slice(0, 11)}…` : b.branch }))}
                layout="vertical"
                margin={{ top: 0, right: 12, bottom: 0, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="short"
                  width={96}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: number | string) => [value, "Registrations"]}
                  labelFormatter={(label: string, payload) => payload?.[0]?.payload?.branch ?? label}
                />
                <Bar dataKey="count" fill="var(--chart-2)" radius={[0, 6, 6, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* ------------------------------ Top referrers + recent ------------------------------ */}
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="code-referrers-heading">
          <header className="flex items-center justify-between">
            <h2 id="code-referrers-heading" className="text-sm font-bold text-slate-900">
              Top referrers in this channel
            </h2>
            <span className="text-[11px] font-medium text-slate-400">top 5</span>
          </header>
          <div className="mt-4 max-h-72 overflow-y-auto scrollbar-thin">
            {stats.topReferrers.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
                Nobody from this channel has referred a friend yet. Nudge the most engaged signups —
                they&apos;re your best ambassadors.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {stats.topReferrers.map((r, i) => (
                  <li key={r.referralCode || i} className="flex items-center gap-3">
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
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{r.name}</p>
                      <p className="font-mono text-[10.5px] text-slate-400">{r.referralCode || "—"}</p>
                    </div>
                    <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-violet-50 px-2.5 py-1 text-sm font-bold tabular-nums text-violet-700 ring-1 ring-violet-100">
                      {r.referralCount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="code-recent-heading">
          <header className="flex items-center justify-between">
            <h2 id="code-recent-heading" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900">
              <ListFilter className="size-3.5 text-emerald-500" aria-hidden />
              Latest signups
            </h2>
            <Link
              href={`/admin/registrations?sourceCode=${encodeURIComponent(stats.code)}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700"
            >
              Full table <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </header>
          <ul className="mt-4 max-h-72 space-y-2.5 overflow-y-auto scrollbar-thin pr-1">
            {stats.recent.map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                    {r.fullName.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="truncate font-semibold text-slate-700">{r.fullName}</span>
                  <span className="hidden truncate text-slate-400 sm:inline">· {r.college ?? "—"}</span>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                    r.viaReferral
                      ? "bg-amber-100 text-amber-800 ring-amber-200"
                      : "bg-slate-100 text-slate-500 ring-slate-200",
                  )}
                >
                  {r.viaReferral ? "via friend" : "direct"}
                </span>
              </li>
            ))}
          </ul>
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
} as const

function MetricCard({
  icon,
  tint,
  label,
  value,
  foot,
  decimals,
}: {
  icon: React.ReactNode
  tint: keyof typeof TINTS
  label: string
  value: number
  foot?: string
  decimals?: boolean
}) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md hover:shadow-violet-600/10">
      <span
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-lg ring-1 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3",
          TINTS[tint],
        )}
      >
        {icon}
      </span>
      <p className="mt-3 text-2xl font-extrabold tabular-nums tracking-tight text-slate-900">
        {decimals ? value.toFixed(2) : value}
      </p>
      <p className="mt-0.5 text-xs font-semibold text-slate-600">{label}</p>
      {foot && <p className="mt-1.5 text-[11px] text-slate-400">{foot}</p>}
    </article>
  )
}
