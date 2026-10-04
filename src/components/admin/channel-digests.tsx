"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Building2,
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  MessageSquareQuote,
  RefreshCw,
  Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface DigestRow {
  code: string
  name: string | null
  ownerName: string | null
  type: string
  funnel: {
    registrations: number
    activatedReferrers: number
    referralsGenerated: number
    activationRate: number
    conversionRate: number
  }
  todayCount: number
  topReferrer: { name: string; referralCount: number } | null
  boardPath: string
  csvPath: string
  message: string
  /** Audit trail: how many times this digest was handed off, and when last. */
  sent: {
    count: number
    lastAt: string | null
    lastMessage: string | null
  }
}

interface DigestSummary {
  ownerCount: number
  registrationsCovered: number
  conversionsCovered: number
  sentToday: number
  loggedCount: number
  loggedTotal: number
}

/**
 * Channel digests — a composed, ready-to-send weekly update per channel owner
 * (demo stand-in for scheduled email/WhatsApp delivery). Copy the message, or
 * jump to the owner's public board / CSV report.
 */
export function ChannelDigests() {
  const [rows, setRows] = useState<DigestRow[]>([])
  const [summary, setSummary] = useState<DigestSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const load = useCallback(async () => {
    setError(false)
    try {
      const res = await fetch("/api/admin/digests", { cache: "no-store" })
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

  async function logHandoff(row: DigestRow) {
    try {
      await fetch("/api/admin/digests/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: row.code, message: row.message }),
      })
    } catch {
      // Audit logging is best-effort — never block the copy itself.
    }
  }

  async function copyDigest(row: DigestRow) {
    const text = row.message.replace(
      "Watch your live board anytime (no login): /ambassador/",
      "Watch your live board anytime (no login): " + window.location.origin + "/ambassador/",
    )
    const mark = () => {
      setCopiedCode(row.code)
      setTimeout(() => setCopiedCode(null), 1600)
    }
    const succeed = () => {
      mark()
      toast.success(`Digest copied for ${row.ownerName?.split(" ")[0] ?? row.code}`, {
        description: "Handoff logged — this channel is marked as updated.",
      })
    }
    try {
      await navigator.clipboard.writeText(text)
      mark()
      succeed()
    } catch {
      // Fallback for non-secure contexts (e.g. plain-http deploys).
      try {
        const ta = document.createElement("textarea")
        ta.value = text
        ta.style.position = "fixed"
        ta.style.opacity = "0"
        document.body.appendChild(ta)
        ta.select()
        document.execCommand("copy")
        document.body.removeChild(ta)
        mark()
        succeed()
      } catch {
        toast.error("Couldn't access the clipboard.")
        return
      }
    }
    await logHandoff(row)
  }

  const visible = showAll ? rows : rows.slice(0, 4)

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="digest-heading"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="digest-heading" className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
            <FileText className="size-4 text-sky-600" aria-hidden />
            Channel owner digests
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            A ready-to-send update per channel — numbers pulled live, message pre-composed
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

      {/* Summary chips */}
      {summary && rows.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Digest summary">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-200">
            <Send className="size-3" aria-hidden />
            {summary.ownerCount} channel{summary.ownerCount === 1 ? "" : "s"} · {summary.registrationsCovered} regs covered
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            {summary.conversionsCovered} referral conversions
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200"
            title="Channels with at least one signup today"
          >
            {summary.sentToday} active today
          </span>
          {summary.loggedTotal > 0 && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200"
              title={`${summary.loggedCount} of ${summary.ownerCount} channel digests have been handed off at least once`}
            >
              <Check className="size-3" aria-hidden />
              {summary.loggedCount}/{summary.ownerCount} channels updated
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-[10px] font-semibold text-violet-600 ring-1 ring-violet-200">
            demo: delivery = copy/paste
          </span>
        </div>
      )}

      {loading && (
        <div className="mt-4 space-y-2.5" role="status" aria-label="Loading digests">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {error && !loading && (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
          Digests couldn&apos;t load. Hit refresh to retry.
        </p>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
          No channel has registrations yet — digests appear as soon as a tracking code drives its
          first signup.
        </p>
      )}

      {!loading && !error && rows.length > 0 && (
        <ul className="mt-4 max-h-96 space-y-2.5 overflow-y-auto scrollbar-thin pr-1">
          {visible.map((row) => (
            <li
              key={row.code}
              className="group rounded-xl border border-slate-200 bg-gradient-to-r from-sky-50/50 to-white p-3.5 transition-all hover:border-sky-200 hover:shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                    {(row.ownerName ?? row.name ?? row.code).slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {row.ownerName ?? row.name ?? row.code}
                      </p>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
                        {row.code}
                      </span>
                      {row.todayCount > 0 && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                          +{row.todayCount} today
                        </span>
                      )}
                      {row.sent.count > 0 && (
                        <TooltipProvider delayDuration={150}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className="inline-flex shrink-0 cursor-help items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 ring-1 ring-sky-200 underline decoration-sky-300 decoration-dotted underline-offset-2"
                                tabIndex={0}
                              >
                                <Check className="size-2.5" aria-hidden />
                                sent {row.sent.count}×
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              align="start"
                              className="max-w-80 whitespace-pre-line text-left text-[11px] leading-relaxed"
                            >
                              <p className="mb-1 font-bold text-sky-300">
                                Last handed off
                                {row.sent.lastAt
                                  ? ` · ${new Date(row.sent.lastAt).toLocaleString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      hour: "numeric",
                                      minute: "2-digit",
                                      hour12: true,
                                    })}`
                                  : ""}
                                :
                              </p>
                              {row.sent.lastMessage ? (
                                <span className="line-clamp-6">{row.sent.lastMessage}</span>
                              ) : (
                                <span className="italic text-slate-300">
                                  No message copy stored for this handoff.
                                </span>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-500">
                      <span className="tabular-nums font-semibold text-slate-700">{row.funnel.registrations}</span> regs
                      <span aria-hidden>·</span>
                      <span className="tabular-nums font-semibold text-violet-700">{row.funnel.activatedReferrers}</span> referring
                      <span aria-hidden>·</span>
                      <span className="tabular-nums font-semibold text-amber-700">{row.funnel.referralsGenerated}</span> via links
                      <span aria-hidden>·</span>
                      <span className="tabular-nums">{row.funnel.conversionRate}% conv</span>
                      {row.topReferrer && (
                        <>
                          <span aria-hidden>·</span>
                          top: <strong className="font-semibold text-slate-700">{row.topReferrer.name}</strong> ({row.topReferrer.referralCount})
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    className={cn(
                      "gap-1.5 text-xs shadow-sm",
                      row.sent.count > 0
                        ? "border border-sky-200 bg-white text-sky-700 hover:bg-sky-50"
                        : "bg-sky-600 hover:bg-sky-700",
                    )}
                    onClick={() => copyDigest(row)}
                  >
                    {copiedCode === row.code ? (
                      <Check className="size-3.5" aria-hidden />
                    ) : row.sent.count > 0 ? (
                      <Send className="size-3.5" aria-hidden />
                    ) : (
                      <Copy className="size-3.5" aria-hidden />
                    )}
                    {copiedCode === row.code ? "Copied!" : row.sent.count > 0 ? "Copy again" : "Copy digest"}
                  </Button>
                  <a
                    href={row.boardPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                    title="Open the owner's public board"
                  >
                    <Building2 className="size-3.5" aria-hidden />
                    Board
                  </a>
                  <a
                    href={row.csvPath}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                    title="Download the full channel CSV report"
                  >
                    <Download className="size-3.5" aria-hidden />
                    CSV
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {rows.length > 4 && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="mt-3 text-xs font-bold text-sky-600 hover:text-sky-700"
          aria-expanded={showAll}
        >
          {showAll ? "Show fewer" : `Show all ${rows.length} channels`}
        </button>
      )}

      <p className="mt-3 flex items-start gap-1.5 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-400">
        <MessageSquareQuote className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        In production these would email/WhatsApp owners on a schedule — the demo composes the exact
        send-ready text so ops can paste it into any channel today.
      </p>
    </section>
  )
}
