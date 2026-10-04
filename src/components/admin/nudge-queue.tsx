"use client"

import { useCallback, useEffect, useState } from "react"
import {
  BellRing,
  Building2,
  Check,
  ChevronDown,
  Copy,
  History,
  Loader2,
  MessageCircle,
  Moon,
  RefreshCw,
  Send,
  Sparkles,
  TrendingUp,
  Trophy,
  UserX,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import {
  buildCampusGapLine,
  buildNudgeMessage,
  buildWhatsAppLink,
  isSnoozeActive,
  SNOOZE_DAYS,
  type NudgeRow,
  type NudgeSummary,
} from "@/lib/nudge"
import { cn } from "@/lib/utils"

/**
 * WhatsApp reminder simulator — the "nudge queue".
 * Lists students exactly one referral away from their next milestone, with a
 * one-tap WhatsApp deep link (prefilled message), copy-to-clipboard fallback
 * and an outreach log so the team can see who has already been reminded.
 */
export function NudgeQueue() {
  const [rows, setRows] = useState<NudgeRow[]>([])
  const [summary, setSummary] = useState<NudgeSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [loggingId, setLoggingId] = useState<string | null>(null)
  const [bulkLoading, setBulkLoading] = useState<"near_miss" | "dormant" | null>(null)
  const [snoozingId, setSnoozingId] = useState<string | null>(null)
  /** Which row's outreach-history timeline is expanded (accordion, single). */
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(false)
    try {
      const res = await fetch("/api/admin/nudges", { cache: "no-store" })
      if (!res.ok) throw new Error(String(res.status))
      const data = await res.json()
      setRows(data.rows ?? [])
      setSummary(data.summary ?? null)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function shareUrl(code: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    return `${origin}/r/${code}`
  }

  function messageFor(row: NudgeRow) {
    return buildNudgeMessage({
      firstName: row.fullName.split(" ")[0],
      currentCount: row.currentCount,
      tierName: row.nextTier.name,
      tierAt: row.nextTier.referralCount,
      rewardText: row.nextTier.rewardText,
      shareUrl: shareUrl(row.referralCode),
      campusGapLine: buildCampusGapLine(row.campus),
    })
  }

  function formatTouchDate(iso: string) {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  async function copyMessage(row: NudgeRow) {
    try {
      await navigator.clipboard.writeText(messageFor(row))
      setCopiedId(row.registrationId)
      setTimeout(() => setCopiedId(null), 1600)
      toast.success(`Reminder message copied for ${row.fullName.split(" ")[0]}`)
    } catch {
      toast.error("Couldn't access the clipboard.")
    }
  }

  async function logNudge(row: NudgeRow) {
    setLoggingId(row.registrationId)
    try {
      const res = await fetch("/api/admin/nudges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: row.registrationId,
          channel: "whatsapp",
          message: messageFor(row), // store exact copy for the audit trail
        }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        toast.success(`Nudge logged — ${row.fullName.split(" ")[0]} reminded ${data.nudgedCount}×`)
        await load()
      } else {
        toast.error(data.error ?? "Couldn't log the nudge.")
      }
    } catch {
      toast.error("Network error while logging nudge.")
    } finally {
      setLoggingId(null)
    }
  }

  async function snooze(row: NudgeRow, days: number, undo = false) {
    setSnoozingId(row.registrationId)
    try {
      const res = await fetch("/api/admin/nudges/snooze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(undo ? { registrationId: row.registrationId, undo: true } : { registrationId: row.registrationId, days }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        const first = row.fullName.split(" ")[0]
        if (undo) {
          toast.success(`${first} is back in the live queue`)
        } else {
          toast.success(`${first} snoozed for ${days} day${days === 1 ? "" : "s"}`, {
            description: "Bulk pushes skip them; they wake automatically after that.",
          })
        }
        await load()
      } else {
        toast.error(data.error ?? "Couldn't update the snooze.")
      }
    } catch {
      toast.error("Network error while updating snooze.")
    } finally {
      setSnoozingId(null)
    }
  }

  async function bulkNudge(mode: "near_miss" | "dormant") {
    setBulkLoading(mode)
    try {
      const res = await fetch("/api/admin/nudges/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, channel: "whatsapp" }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        if (data.count === 0) {
          toast.info("Nobody left to remind in this batch — everyone already has a first touch logged.")
        } else {
          toast.success(`${data.count} reminder${data.count === 1 ? "" : "s"} logged`, {
            description:
              data.remaining > 0
                ? `${data.remaining} more remain — click again to send the next batch of 25.`
                : "Batch complete — that covers everyone.",
          })
          await load()
        }
      } else {
        toast.error(data.error ?? "Bulk reminder failed.")
      }
    } catch {
      toast.error("Network error during bulk reminder.")
    } finally {
      setBulkLoading(null)
    }
  }

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="nudge-heading"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="nudge-heading" className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
            <BellRing className="size-4 text-amber-500" aria-hidden />
            WhatsApp reminder simulator
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Students one referral away from their next milestone — highest-payoff outreach, one tap away
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={load}
          disabled={loading}
          className="gap-1.5 text-xs text-slate-500 hover:text-slate-700"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} aria-hidden />
          Refresh
        </Button>
      </header>

      {/* Bulk actions — first-touch reminders in capped batches */}
      {!loading && !error && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(() => {
            const neverNudged = rows.filter((r) => r.nudgedCount === 0 && !isSnoozeActive(r.snoozedUntil)).length
            return (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={neverNudged === 0 || bulkLoading !== null}
                    className="gap-1.5 border-amber-200 bg-amber-50 text-xs text-amber-800 hover:bg-amber-100"
                  >
                    {bulkLoading === "near_miss" ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Zap className="size-3.5" aria-hidden />
                    )}
                    Remind all never-nudged ({neverNudged})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Log {neverNudged} first-touch reminders?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Every near-miss student who hasn&apos;t been contacted yet gets one logged
                      WhatsApp reminder (batches capped at 25 per click — {neverNudged} queued now).
                      Messages use each student&apos;s personalized milestone copy. You can still send
                      individual follow-ups afterwards.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => bulkNudge("near_miss")}
                      className="bg-amber-600 text-white hover:bg-amber-700"
                    >
                      <Zap className="mr-1.5 size-3.5" aria-hidden />
                      Remind first 25
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )
          })()}
          {summary && summary.dormantNeverNudged > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={bulkLoading !== null}
                  className="gap-1.5 text-xs text-slate-500 hover:text-slate-700"
                >
                  {bulkLoading === "dormant" ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Sparkles className="size-3.5" aria-hidden />
                  )}
                  First-share push ({summary.dormantNeverNudged})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Nudge dormant students toward their first referral?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {summary.dormantNeverNudged} students registered but never referred anyone. Each gets
                    a friendly "your first referral unlocks First Share" message (batches of 25). Keep
                    batches modest — nobody likes a wall of forwards.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => bulkNudge("dormant")}>
                    <Sparkles className="mr-1.5 size-3.5" aria-hidden />
                    Remind first 25
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}

      {/* Summary chips */}
      {summary && (
        <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Queue summary">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
            <Send className="size-3" aria-hidden />
            {summary.queueSize} near-miss{summary.queueSize === 1 ? "" : "es"}
          </span>
          {summary.byTier.map(
            (t) =>
              t.count > 0 && (
                <span
                  key={t.tierAt}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                >
                  {t.count} away from <strong className="font-bold">{t.tierName}</strong> ({t.tierAt})
                </span>
              ),
          )}
          {summary.dormantReferrers > 0 && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-400 ring-1 ring-slate-200"
              title="Registered but haven't referred anyone yet"
            >
              <UserX className="size-3" aria-hidden />
              {summary.dormantReferrers} dormant
            </span>
          )}
          {summary.totalNudgesSent > 0 && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200"
              title={`${summary.nudgesConverted24h} of ${summary.totalNudgesSent} logged reminders were followed by a referral within 24h`}
            >
              <TrendingUp className="size-3" aria-hidden />
              {summary.totalNudgesSent} sent · {summary.effectivenessPercent}% converted &lt;24h
            </span>
          )}
          {summary.snoozedCount > 0 && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-300"
              title="Snoozed students stay out of bulk pushes and wake automatically"
            >
              <Moon className="size-3" aria-hidden />
              {summary.snoozedCount} snoozed
            </span>
          )}
        </div>
      )}

      {loading && (
        <div className="mt-4 space-y-2.5" role="status" aria-label="Loading nudge queue">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {error && !loading && (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
          Nudge queue couldn&apos;t load. Hit refresh to retry.
        </p>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
          No near-miss students right now — nobody is sitting exactly one referral away from a milestone.
          Check back as the campaign progresses.
        </p>
      )}

      {!loading && !error && rows.length > 0 && (
        <ul className="mt-4 max-h-96 space-y-2.5 overflow-y-auto scrollbar-thin pr-1">
          {rows.map((row) => {
            const firstName = row.fullName.split(" ")[0]
            const noPhone = !row.whatsapp
            const isExpanded = expandedId === row.registrationId
            const snoozed = isSnoozeActive(row.snoozedUntil)
            return (
              <li
                key={row.registrationId}
                className={cn(
                  "group flex flex-col rounded-xl border p-3.5 transition-all hover:shadow-sm",
                  snoozed
                    ? "border-slate-200 bg-slate-50/80"
                    : row.nudgedCount === 0
                      ? "border-amber-200/80 bg-gradient-to-r from-amber-50/70 to-white hover:border-amber-300"
                      : "border-slate-200 hover:border-amber-200 hover:bg-amber-50/30",
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                    {row.fullName.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{row.fullName}</p>
                      {snoozed ? (
                        <span
                          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 ring-1 ring-slate-300"
                          title="Bulk pushes skip this student until the snooze expires"
                        >
                          <Moon className="size-2.5" aria-hidden />
                          Snoozed until {new Date(row.snoozedUntil!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-200">
                          1 away from {row.nextTier.name}
                        </span>
                      )}
                      {row.convertedAfterNudge && (
                        <span
                          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200"
                          title="A referral landed within 24h after one of this student's reminders"
                        >
                          <TrendingUp className="size-2.5" aria-hidden />
                          reminder worked
                        </span>
                      )}
                      {row.campus && (
                        <span
                          className={cn(
                            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1",
                            row.campus.ahead
                              ? row.campus.ahead.gap === 0
                                ? "bg-amber-50 text-amber-800 ring-amber-300"
                                : "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200"
                              : "bg-amber-50 text-amber-700 ring-amber-200",
                          )}
                          title={
                            row.campus.ahead
                              ? row.campus.ahead.gap === 0
                                ? `${row.campus.college} is TIED with ${row.campus.ahead.college} at #${row.campus.rank} — one more referral breaks the tie. The reminder copy uses this angle.`
                                : `${row.campus.college} is #${row.campus.rank} of ${row.campus.totalColleges} campuses — ${row.campus.ahead.gap} behind ${row.campus.ahead.college}. The reminder copy uses this competition angle.`
                              : `${row.campus.college} leads the whole college board. The reminder copy rallies them to defend the top spot.`
                          }
                        >
                          {row.campus.ahead ? (
                            <Building2 className="size-2.5" aria-hidden />
                          ) : (
                            <Trophy className="size-2.5" aria-hidden />
                          )}
                          {row.campus.ahead
                            ? row.campus.ahead.gap === 0
                              ? `campus #${row.campus.rank} · tied with ${row.campus.ahead.college.split(" ")[0]}`
                              : `campus #${row.campus.rank} · ${row.campus.ahead.gap} behind ${row.campus.ahead.college.split(" ")[0]}`
                            : `campus #1 — defending lead`}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {row.currentCount} referral{row.currentCount === 1 ? "" : "s"} · {row.college ?? "—"} ·{" "}
                      <span className="font-mono">{row.referralCode}</span>
                      {row.nudgedCount > 0 && (
                        <TooltipProvider delayDuration={150}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className="ml-1.5 cursor-help font-semibold text-emerald-600 underline decoration-emerald-300 decoration-dotted underline-offset-2"
                                tabIndex={0}
                              >
                                · reminded {row.nudgedCount}×
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              align="start"
                              className="max-w-80 whitespace-pre-line text-left text-[11px] leading-relaxed"
                            >
                              <p className="mb-1 font-bold text-emerald-300">
                                Last message sent{row.lastNudgedAt ? ` · ${new Date(row.lastNudgedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}:
                              </p>
                              {row.lastMessage ? (
                                <span className="line-clamp-6">{row.lastMessage}</span>
                              ) : (
                                <span className="italic text-slate-300">
                                  No message copy stored for this touch (logged before message capture).
                                </span>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {noPhone ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs text-slate-400"
                      disabled
                      title="No WhatsApp number on file"
                    >
                      <MessageCircle className="size-3.5" aria-hidden />
                      No number
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className={cn(
                        "gap-1.5 bg-emerald-600 text-xs shadow-sm hover:bg-emerald-700",
                        row.nudgedCount === 0 && !snoozed && "pulse-halo-emerald",
                      )}
                      onClick={() => {
                        window.open(buildWhatsAppLink(row.whatsapp!, messageFor(row)), "_blank", "noopener")
                        logNudge(row)
                      }}
                    >
                      <MessageCircle className="size-3.5" aria-hidden />
                      WhatsApp
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => copyMessage(row)}
                  >
                    {copiedId === row.registrationId ? (
                      <Check className="size-3.5 text-emerald-600" aria-hidden />
                    ) : (
                      <Copy className="size-3.5" aria-hidden />
                    )}
                    {copiedId === row.registrationId ? "Copied" : "Copy msg"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-slate-400 hover:text-slate-600"
                    onClick={() => logNudge(row)}
                    disabled={loggingId === row.registrationId}
                    title="Log this outreach touch without opening WhatsApp"
                  >
                    <Send className="size-3.5" aria-hidden />
                    Log only
                  </Button>
                  {snoozed ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs text-violet-500 hover:text-violet-700"
                      onClick={() => snooze(row, 0, true)}
                      disabled={snoozingId === row.registrationId}
                      title="Clear the snooze and put this student back into live rotation"
                    >
                      {snoozingId === row.registrationId ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      ) : (
                        <Sparkles className="size-3.5" aria-hidden />
                      )}
                      Wake now
                    </Button>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-xs text-slate-400 hover:text-slate-600"
                          disabled={snoozingId === row.registrationId}
                          title="Skip this student in bulk pushes for a while"
                        >
                          {snoozingId === row.registrationId ? (
                            <Loader2 className="size-3.5 animate-spin" aria-hidden />
                          ) : (
                            <Moon className="size-3.5" aria-hidden />
                          )}
                          Snooze
                          <ChevronDown className="size-3" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {SNOOZE_DAYS.map((d) => (
                          <DropdownMenuItem
                            key={d}
                            onClick={() => snooze(row, d)}
                            className="gap-2 text-xs"
                          >
                            <Moon className="size-3.5 text-slate-400" aria-hidden />
                            {d} day{d === 1 ? "" : "s"} — until{" "}
                            {new Date(Date.now() + d * 86400000).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </DropdownMenuItem>
                        ))}
                        <p className="px-2 pb-1.5 pt-1.5 text-[10px] leading-relaxed text-slate-400">
                          Snoozed students drop to the bottom of the queue and wake automatically.
                        </p>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {row.nudgedCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs text-slate-400 hover:text-slate-600"
                      onClick={() => setExpandedId(isExpanded ? null : row.registrationId)}
                      aria-expanded={isExpanded}
                      aria-controls={`nudge-history-${row.registrationId}`}
                      title="Show every logged reminder for this student"
                    >
                      <History className="size-3.5" aria-hidden />
                      History
                      <ChevronDown
                        className={cn("size-3 transition-transform duration-200", isExpanded && "rotate-180")}
                        aria-hidden
                      />
                    </Button>
                  )}
                  </div>
                </div>

                {/* Full outreach audit trail — every logged touch with exact copy */}
                {isExpanded && row.history.length > 0 && (
                  <div
                    id={`nudge-history-${row.registrationId}`}
                    className="animate-swap-in mt-3 border-t border-dashed border-slate-200 pt-3"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Outreach history · {row.history.length} logged touch{row.history.length === 1 ? "" : "es"}
                    </p>
                    <ol className="mt-2.5 max-h-56 space-y-3 overflow-y-auto scrollbar-thin pr-1">
                      {row.history.map((touch, i) => (
                        <li key={i} className="relative pl-5">
                          {i < row.history.length - 1 && (
                            <span
                              className="absolute left-[4.5px] top-3.5 h-[calc(100%-6px)] w-px bg-gradient-to-b from-slate-200 to-transparent"
                              aria-hidden
                            />
                          )}
                          <span
                            className={cn(
                              "absolute left-0 top-1 size-2.5 rounded-full ring-2 ring-white",
                              i === 0
                                ? row.convertedAfterNudge
                                  ? "bg-emerald-500"
                                  : "bg-violet-500"
                                : "bg-slate-300",
                            )}
                            aria-hidden
                          />
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-[10px] font-bold tabular-nums text-slate-500">
                              {formatTouchDate(touch.at)}
                            </span>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1",
                                touch.channel === "whatsapp"
                                  ? "bg-emerald-50 text-emerald-600 ring-emerald-200"
                                  : "bg-slate-100 text-slate-500 ring-slate-200",
                              )}
                            >
                              <MessageCircle className="size-2.5" aria-hidden />
                              {touch.channel === "whatsapp" ? "WhatsApp" : touch.channel}
                            </span>
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-violet-700 ring-1 ring-violet-200"
                              title="How many referrals this student already had when the reminder went out"
                            >
                              at {touch.countAtTouch} referral{touch.countAtTouch === 1 ? "" : "s"}
                            </span>
                            {i === 0 && row.convertedAfterNudge && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                                <TrendingUp className="size-2.5" aria-hidden />
                                referral followed &lt;24h
                              </span>
                            )}
                          </div>
                          {touch.message ? (
                            <p className="mt-1 whitespace-pre-line rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] leading-relaxed text-slate-600">
                              {touch.message}
                            </p>
                          ) : (
                            <p className="mt-1 text-[11px] italic text-slate-400">
                              No message copy stored for this touch (logged before message capture).
                            </p>
                          )}
                        </li>
                      ))}
                      <li className="relative pl-5" aria-hidden>
                        <span className="absolute left-[1.5px] top-0.5 size-[7px] rounded-full bg-emerald-500 ring-2 ring-white" />
                        <p className="text-[10px] font-bold tabular-nums text-emerald-700">
                          today: {row.currentCount} referral{row.currentCount === 1 ? "" : "s"}
                        </p>
                      </li>
                    </ol>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
        Demo simulation — opening WhatsApp is real (wa.me deep link with a pre-written message), but no
        message is auto-sent. Logging keeps the outreach history on the student&apos;s record.
      </p>
    </section>
  )
}
