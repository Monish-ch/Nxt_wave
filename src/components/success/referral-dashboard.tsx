"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import {
  Activity,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Gift,
  Link2,
  Loader2,
  Lock,
  MessageCircle,
  PartyPopper,
  QrCode,
  RefreshCw,
  Trophy,
  Unlock,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { MILESTONE_TIERS, MilestoneProgress } from "@/lib/milestones"
import {
  DEFAULT_SHARE_VARIANT,
  SHARE_VARIANT_LIST,
  ShareVariantKey,
} from "@/lib/share-variants"
import { downloadQrPng } from "@/lib/qr-png"
import type { CollegePosition } from "@/lib/stats"
import type { ReferralTimelineEntry } from "@/lib/referral-info"
import { cn } from "@/lib/utils"
import { DemoBadge } from "@/components/site/demo-badge"

interface Referrer {
  fullName: string
  firstName: string
  referralCode: string
  joinedAt: string
}

interface Props {
  referrer: Referrer
  stats: {
    referralCount: number
    rank: number | null
    totalActiveReferrers: number
    milestoneProgress: MilestoneProgress
    timeline: ReferralTimelineEntry[]
  }
  initialVariant?: ShareVariantKey | null
  /** The student's college standing (null when unknown college) — campus competition panel. */
  campus?: CollegePosition | null
}

export function ReferralDashboard({ referrer, stats: initialStats, initialVariant, campus }: Props) {
  const [stats, setStats] = useState(initialStats)
  const [refreshing, setRefreshing] = useState(false)
  const [origin, setOrigin] = useState("")
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [downloadingPng, setDownloadingPng] = useState(false)
  const [variantKey, setVariantKey] = useState<ShareVariantKey>(initialVariant ?? DEFAULT_SHARE_VARIANT)
  const variant = SHARE_VARIANT_LIST.find((v) => v.key === variantKey) ?? SHARE_VARIANT_LIST[0]

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const referralUrl = origin ? `${origin}/r/${referrer.referralCode}` : `/r/${referrer.referralCode}`
  // Variant-tagged share link: ?v= rides along so the A/B test can attribute
  // which invite style actually converts friends into registrations.
  const shareUrl = origin
    ? `${origin}/r/${referrer.referralCode}?v=${variant.key}`
    : `/r/${referrer.referralCode}?v=${variant.key}`
  const shareMessage = variant.message(shareUrl)
  const { referralCount, milestoneProgress, rank, totalActiveReferrers, timeline } = {
    referralCount: stats.referralCount,
    milestoneProgress: stats.milestoneProgress,
    rank: stats.rank,
    totalActiveReferrers: stats.totalActiveReferrers,
    timeline: stats.timeline ?? [],
  }
  const next = milestoneProgress.nextMilestone

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch(`/api/referral/${encodeURIComponent(referrer.referralCode)}`, { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        if (data.stats) {
          setStats(data.stats)
          if (data.stats.referralCount > stats.referralCount) {
            toast.success("New referral detected! 🎉", {
              description: `You now have ${data.stats.referralCount} referrals.`,
            })
          } else {
            toast.success("Dashboard refreshed", { description: "You're up to date." })
          }
        }
      } else {
        toast.error("Couldn't refresh right now. Try again shortly.")
      }
    } catch {
      toast.error("Network error while refreshing.")
    } finally {
      setRefreshing(false)
    }
  }, [referrer.referralCode, stats.referralCount])

  async function copyText(text: string, label: string, marker?: () => void) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied!`)
      marker?.()
      setTimeout(() => marker?.(), 2000)
    } catch {
      // Fallback for non-secure contexts
      const ta = document.createElement("textarea")
      ta.value = text
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand("copy")
        toast.success(`${label} copied!`)
        marker?.()
        setTimeout(() => marker?.(), 2000)
      } catch {
        toast.error(`Couldn't copy — please copy manually.`)
      }
      document.body.removeChild(ta)
    }
  }

  function shareOnWhatsApp() {
    const text = encodeURIComponent(shareMessage)
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer")
  }

  /** Privacy-friendly display of the campus's best referrer. */
  function maskName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length === 1) return parts[0]
    return `${parts[0]} ${parts[parts.length - 1].slice(0, 1).toUpperCase()}.`
  }

  /**
   * Compact relative label for when a referral landed. Deterministic to the
   * day (not minutes) so SSR and client renders agree; boundary cases are
   * suppressed via suppressHydrationWarning at the call site.
   */
  function relativeDay(iso: string): string {
    const then = new Date(iso)
    const now = new Date()
    const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const days = Math.round((startOf(now) - startOf(then)) / 86_400_000)
    if (days <= 0) return "today"
    if (days === 1) return "yesterday"
    if (days < 7) return `${days} days ago`
    return then.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      {/* ------------------------------ Success header ------------------------------ */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-300">
          <PartyPopper className="size-3.5" aria-hidden /> Registration confirmed
        </span>
        <h1 className="mt-4 text-balance font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          You&apos;re registered, {referrer.firstName}! 🎉
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-slate-400 sm:text-base">
          Your spot for <strong>“Build Your First AI Project in 60 Minutes”</strong> is locked in.
          Now turn your registration into rewards — share your link below.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        {/* ------------------------------ Referral card ------------------------------ */}
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-xl shadow-violet-600/5" aria-labelledby="referral-card-heading">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-400" aria-hidden />
          <div className="p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <h2 id="referral-card-heading" className="font-display text-base font-bold text-white">
                Your referral toolkit
              </h2>
              <DemoBadge />
            </div>

            {/* Code display */}
            <div className="mt-5 rounded-xl border border-violet-400/25 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 p-5 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-300">Your referral code</p>
              <p className="mt-2 font-mono text-3xl font-extrabold tracking-wide text-white sm:text-4xl">
                {referrer.referralCode}
              </p>
              <button
                type="button"
                onClick={() => copyText(referrer.referralCode, "Referral code", () => setCopiedCode(true))}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-violet-300 shadow-sm ring-1 ring-violet-400/25 transition-colors hover:bg-violet-500/15"
              >
                {copiedCode ? <Check className="size-3.5 text-emerald-400" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                {copiedCode ? "Copied!" : "Copy code"}
              </button>
            </div>

            {/* Link display */}
            <div className="mt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Your referral URL</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="min-w-0 flex-1 truncate rounded-lg border border-white/10 bg-white/[0.06] px-3.5 py-2.5 font-mono text-xs text-slate-300 sm:text-sm" title={referralUrl}>
                  {referralUrl}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 shrink-0 gap-1.5"
                  onClick={() => copyText(referralUrl, "Referral link", () => setCopiedLink(true))}
                  aria-label="Copy referral link"
                >
                  {copiedLink ? <Check className="size-4 text-emerald-400" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
                  <span className="hidden sm:inline">{copiedLink ? "Copied" : "Copy"}</span>
                </Button>
              </div>
            </div>

            {/* Share actions — A/B invite-style picker */}
            <div className="mt-5" role="radiogroup" aria-label="Invite message style">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Pick your invite style
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-slate-400" title="The admin dashboard compares which style converts more friends">
                  A/B experiment
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {SHARE_VARIANT_LIST.map((v) => {
                  const active = v.key === variantKey
                  return (
                    <button
                      key={v.key}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setVariantKey(v.key)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-center transition-all active:scale-[0.97]",
                        active
                          ? "border-violet-400/60 bg-violet-500/15 shadow-sm ring-1 ring-violet-400/40"
                          : "border-white/10 bg-white/[0.04] hover:border-violet-400/30 hover:bg-white/[0.08]",
                      )}
                    >
                      <span aria-hidden className="text-base leading-none">{v.emoji}</span>
                      <span className={cn("text-xs font-bold", active ? "text-violet-300" : "text-slate-300")}>
                        {v.label}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{variant.tagline}</p>
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <Button
                type="button"
                onClick={shareOnWhatsApp}
                className="h-11 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-500"
              >
                <MessageCircle className="size-4.5" aria-hidden />
                Share on WhatsApp
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                onClick={() => copyText(shareMessage, "Invite message")}
              >
                <Copy className="size-4" aria-hidden />
                Copy invite message
              </Button>
            </div>

            <div key={variant.key} className="animate-swap-in mt-4 rounded-xl bg-white/[0.06] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Message preview · {variant.emoji} {variant.label} style
              </p>
              <p className="mt-1 break-words text-xs leading-relaxed text-slate-400">“{shareMessage}”</p>
            </div>

            {/* QR code — scan-to-register for posters & WhatsApp status */}
            <div className="mt-5 flex items-center gap-4 rounded-xl border border-violet-400/25 bg-white/[0.04] p-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-lg ring-1 ring-violet-400/25 sm:size-28">
                <img
                  src={`/api/qr/${referrer.referralCode}`}
                  alt={`QR code linking to your referral page ${referralUrl}`}
                  className="size-full object-cover"
                  loading="lazy"
                />
                <span className="absolute inset-x-0 bottom-0 bg-slate-900/85 py-0.5 text-center text-[8px] font-bold uppercase tracking-widest text-white">
                  Scan me
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="inline-flex items-center gap-1.5 text-sm font-bold text-white">
                  <QrCode className="size-4 text-violet-400" aria-hidden />
                  QR poster code
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Print it on your club notice board or add it to a WhatsApp status —
                  every scan counts as your referral.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <a
                    href={`/api/qr/${referrer.referralCode}`}
                    download={`nxtwave-qr-${referrer.referralCode}.svg`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-violet-400/25 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300 transition-colors hover:bg-violet-500/20"
                  >
                    <Download className="size-3.5" aria-hidden />
                    SVG
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      setDownloadingPng(true)
                      try {
                        await downloadQrPng(referrer.referralCode)
                        toast.success("PNG poster downloaded (1024px — print ready)")
                      } catch {
                        toast.error("Couldn't generate the PNG. Try the SVG instead.")
                      } finally {
                        setDownloadingPng(false)
                      }
                    }}
                    disabled={downloadingPng}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-violet-400/25 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300 transition-colors hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {downloadingPng ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Download className="size-3.5" aria-hidden />
                    )}
                    PNG · print
                  </button>
                  <a
                    href={`/r/${referrer.referralCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/[0.08]"
                  >
                    Preview invite page
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------ Progress column ------------------------------ */}
        <div className="space-y-6">
          {/* Milestone progress */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-sm" aria-labelledby="progress-heading">
            <div className="flex items-center justify-between gap-3">
              <h2 id="progress-heading" className="font-display text-base font-bold text-white">
                Your milestone progress
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={refresh}
                disabled={refreshing}
                className="gap-1.5 text-xs text-slate-400"
                aria-label="Refresh referral stats"
              >
                {refreshing ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <RefreshCw className="size-3.5" aria-hidden />}
                Refresh
              </Button>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <p className="text-3xl font-extrabold tabular-nums text-white">
                {referralCount}
                <span className="text-lg font-bold text-slate-500">
                  {" "}/ {next ? next.referralCount : referralCount}
                </span>
              </p>
              <p className="text-xs font-medium text-slate-400">referrals so far</p>
            </div>

            <Progress value={milestoneProgress.progressPercent} className="mt-3 h-3" aria-label={`${milestoneProgress.progressPercent}% toward next milestone`} />

            {next ? (
              <p className="mt-3 text-sm text-slate-400">
                <span className="font-bold text-violet-300">{milestoneProgress.nextMilestoneRemaining} more</span>{" "}
                to unlock <strong>{next.name}</strong> — {next.rewardText}
              </p>
            ) : (
              <p className="mt-3 text-sm font-semibold text-emerald-300">
                🏆 All milestones unlocked — you&apos;re a Growth Champion!
              </p>
            )}

            {/* Rank strip */}
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 px-4 py-3 ring-1 ring-violet-400/25">
              <p className="inline-flex items-center gap-2 text-sm text-slate-200">
                <TrendingUp className="size-4 text-violet-400" aria-hidden />
                {rank ? (
                  <span>
                    Ranked <strong className="text-violet-300">#{rank}</strong> of {totalActiveReferrers} referrers
                  </span>
                ) : (
                  <span>Your first referral puts you on the board</span>
                )}
              </p>
              <Link
                href={`/leaderboard?ref=${referrer.referralCode}`}
                className="shrink-0 text-xs font-bold text-violet-300 hover:text-violet-200"
              >
                View board →
              </Link>
            </div>

            {/* Campus competition panel — college standings, live-computed */}
            {campus && (
              <div className="animate-swap-in mt-4 rounded-xl border border-fuchsia-400/25 bg-gradient-to-br from-fuchsia-500/10 via-transparent to-violet-500/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="inline-flex min-w-0 items-center gap-2 text-sm font-bold text-slate-100">
                    <Building2 className="size-4 shrink-0 text-fuchsia-400" aria-hidden />
                    <span className="truncate" title={campus.college}>
                      {campus.college}
                    </span>
                  </p>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-fuchsia-600 px-2.5 py-0.5 text-[11px] font-extrabold text-white shadow-sm">
                    #{campus.rank} of {campus.totalColleges} campuses
                  </span>
                </div>

                {campus.ahead ? (
                  <div className="mt-3">
                    <p className="text-xs leading-relaxed text-slate-400">
                      <span className="font-bold tabular-nums text-fuchsia-300">
                        {campus.ahead.gap} {campus.ahead.gap === 1 ? "registration" : "registrations"}
                      </span>{" "}
                      put your campus above <strong>{campus.ahead.college}</strong> ({campus.ahead.total}).
                    </p>
                    <div
                      className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]"
                      role="img"
                      aria-label={`${campus.total} of ${campus.ahead.total} registrations toward passing ${campus.ahead.college}`}
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 transition-[width] duration-700"
                        style={{
                          width: `${Math.max(
                            Math.min((campus.total / Math.max(campus.ahead.total, 1)) * 100, 100),
                            5,
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      {campus.total} · {campus.ahead.college} {campus.ahead.total}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-xs font-semibold text-emerald-300">
                    🏆 Your campus leads the whole board — defend the top spot!
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-fuchsia-400/20 pt-2.5">
                  <p className="text-[11px] text-slate-400">
                    {campus.total} registered · {campus.referralRegs} via referral
                    {campus.topReferrer && (
                      <> · campus top: <strong className="text-slate-200">{maskName(campus.topReferrer.name)}</strong> ({campus.topReferrer.referralCount})</>
                    )}
                  </p>
                  <Link
                    href="/leaderboard?view=colleges"
                    className="shrink-0 text-[11px] font-bold text-fuchsia-300 hover:text-fuchsia-200"
                  >
                    College board →
                  </Link>
                </div>
              </div>
            )}

            {/* Referral activity — when each friend actually joined */}
            <div className="mt-4 rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-violet-500/[0.08] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-100">
                  <Activity className="size-4 text-emerald-400" aria-hidden />
                  Referral activity
                </p>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-400/25">
                  {timeline.length} landed
                </span>
              </div>

              {timeline.length === 0 ? (
                <p className="mt-3 text-xs leading-relaxed text-slate-400">
                  No referrals yet — the moment a friend registers with your link, they show up here
                  with a timestamp. Share your link above to start the streak! 🚀
                </p>
              ) : (
                <ol className="animate-swap-in mt-3 max-h-56 space-y-0 overflow-y-auto scrollbar-thin pr-1" aria-label="Friends who registered with your link, newest first">
                  {timeline.map((entry, i) => (
                    <li key={`${entry.at}-${i}`} className="relative flex gap-3 pb-3 last:pb-0">
                      {i < timeline.length - 1 && (
                        <span
                          className="absolute left-[5px] top-4 h-[calc(100%-12px)] w-px bg-gradient-to-b from-emerald-300 to-violet-200"
                          aria-hidden
                        />
                      )}
                      <span
                        className={cn(
                          "relative z-10 mt-1 size-2.5 shrink-0 rounded-full ring-2 ring-[#12101c]",
                          i === 0 ? "bg-emerald-500" : "bg-violet-400",
                        )}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
                          <span className="font-bold text-slate-100">{entry.name}</span>
                          <span
                            suppressHydrationWarning
                            className="shrink-0 rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-violet-300 ring-1 ring-violet-400/25"
                          >
                            {relativeDay(entry.at)}
                          </span>
                        </p>
                        {entry.college && (
                          <p className="truncate text-[11px] text-slate-500" title={entry.college}>
                            {entry.college}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Unlocked celebration */}
            {milestoneProgress.highestUnlocked && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-400/25 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4" role="status">
                <Unlock className="mt-0.5 size-5 shrink-0 text-amber-400" aria-hidden />
                <div>
                  <p className="text-sm font-bold text-amber-200">
                    Milestone unlocked: {milestoneProgress.highestUnlocked.name}
                  </p>
                  <p className="text-xs leading-relaxed text-amber-300">
                    {milestoneProgress.highestUnlocked.rewardText}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Milestone ladder */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-sm" aria-labelledby="ladder-heading">
            <h2 id="ladder-heading" className="font-display text-base font-bold text-white">
              Reward ladder
            </h2>
            <ul className="mt-4 space-y-2.5">
              {MILESTONE_TIERS.map((tier) => {
                const unlocked = referralCount >= tier.referralCount
                return (
                  <li
                    key={tier.referralCount}
                    className={cn(
                      "flex items-center gap-3.5 rounded-xl border p-3.5 transition-colors",
                      unlocked ? "border-emerald-400/25 bg-emerald-500/10" : "border-white/10 bg-white/[0.03]",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold",
                        unlocked
                          ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm"
                          : "bg-white/[0.06] text-slate-500 ring-1 ring-white/10",
                      )}
                    >
                      {unlocked ? <Trophy className="size-4.5" aria-hidden /> : tier.referralCount}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm font-bold", unlocked ? "text-emerald-300" : "text-slate-200")}>
                        {tier.name}{" "}
                        <span className="font-medium text-slate-400">
                          · {tier.referralCount} {tier.referralCount === 1 ? "referral" : "referrals"}
                        </span>
                      </p>
                      <p className={cn("truncate text-xs", unlocked ? "text-emerald-400" : "text-slate-400")}>
                        {tier.rewardText}
                      </p>
                    </div>
                    {unlocked ? (
                      <CheckCircle2 className="size-5 shrink-0 text-emerald-400" aria-label="Unlocked" />
                    ) : (
                      <Lock className="size-4 shrink-0 text-slate-500" aria-label="Locked" />
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          {/* What's next */}
          <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 via-white/[0.03] to-fuchsia-500/10 p-6 text-white shadow-lg" aria-labelledby="next-heading">
            <h2 id="next-heading" className="inline-flex items-center gap-2 text-base font-bold">
              <Gift className="size-4.5 text-amber-400" aria-hidden />
              What happens next
            </h2>
            <ol className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
                Workshop join link arrives on your email & WhatsApp
              </li>
              <li className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
                Share your referral link — watch this dashboard climb
              </li>
              <li className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
                Rewards unlock automatically at each milestone
              </li>
            </ol>
            <Button asChild variant="secondary" size="sm" className="mt-5 gap-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20">
              <Link href="/">
                Back to workshop page
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
          </section>
        </div>
      </div>
    </div>
  )
}
