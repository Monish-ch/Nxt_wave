"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowUpRight, Check, Link2, ScanLine, Users2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface SourceRow {
  code: string
  name: string | null
  ownerName: string | null
  type: string
  count: number
  percent: number
  referralCount: number
  lastAt: string | null
}

const TYPE_STYLES: Record<string, string> = {
  ambassador: "bg-violet-100 text-violet-700 ring-violet-200",
  club: "bg-teal-100 text-teal-700 ring-teal-200",
  social: "bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200",
  human: "bg-violet-100 text-violet-700 ring-violet-200",
  community: "bg-teal-100 text-teal-700 ring-teal-200",
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
 * Channel drill-down board: every tracked campaign code (ambassador posters,
 * club links, Instagram campaigns) with live registration counts. Clicking a
 * card jumps into the full channel funnel; a per-row button copies the
 * owner-view link (/ambassador/<code>) for one-tap distribution to the
 * channel owner.
 */
export function SourceDrilldown() {
  const [rows, setRows] = useState<SourceRow[]>([])
  const [totalAttributed, setTotalAttributed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetch("/api/admin/sources", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (!alive) return
        setRows(data.rows ?? [])
        setTotalAttributed(data.totalAttributed ?? 0)
      })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const max = rows[0]?.count ?? 1

  async function copyOwnerLink(code: string) {
    const origin = window.location.origin
    try {
      await navigator.clipboard.writeText(`${origin}/ambassador/${encodeURIComponent(code)}`)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 1600)
      toast.success(`Owner-view link copied — send it to the ${code} owner`)
    } catch {
      toast.error("Couldn't access the clipboard.")
    }
  }

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="drilldown-heading"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="drilldown-heading" className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
            <ScanLine className="size-4 text-violet-600" aria-hidden />
            Channel drill-down
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Per-code attribution — click a card for the full channel funnel
            {totalAttributed > 0 && (
              <>
                {" "}· <span className="font-semibold text-slate-700">{totalAttributed}</span> attributed
              </>
            )}
          </p>
        </div>
        <Link
          href="/admin/registrations"
          className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700"
        >
          All registrations <ArrowUpRight className="size-3.5" aria-hidden />
        </Link>
      </header>

      {loading && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading channel data">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {error && !loading && (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
          Channel data couldn&apos;t load. Refresh the page to retry.
        </p>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
          No tagged source codes have driven registrations yet. Add
          <code className="mx-1 rounded bg-slate-200 px-1 py-0.5 font-mono text-[10px]">?source=ambassador&amp;code=RAHUL01</code>
          to share links and track channels here.
        </p>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="mt-4 grid max-h-[22rem] gap-3 overflow-y-auto scrollbar-thin pr-1 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <div
              key={row.code}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md hover:shadow-violet-600/10"
            >
              {/* Stretched-link overlay: keeps the whole card clickable without
                  nesting interactive elements inside each other. */}
              <Link
                href={`/admin/sources/${encodeURIComponent(row.code)}`}
                className="absolute inset-0 z-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
                aria-label={`Open analytics for code ${row.code} — ${row.count} registrations`}
              >
                <span className="sr-only">Open analytics for {row.code}</span>
              </Link>

              <div className="pointer-events-none flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-[13px] font-extrabold tracking-wide text-slate-900">
                    {row.code}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500" title={row.name ?? undefined}>
                    {row.name ?? "Uncatalogued code"}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1",
                    TYPE_STYLES[row.type] ?? TYPE_STYLES.other,
                  )}
                >
                  {TYPE_LABELS[row.type] ?? row.type}
                </span>
              </div>

              {/* Volume bar */}
              <div className="pointer-events-none mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-[width] duration-700"
                  style={{ width: `${Math.max((row.count / max) * 100, 4)}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                <span className="pointer-events-none inline-flex shrink-0 items-center gap-1 font-bold tabular-nums text-slate-700">
                  <Users2 className="size-3 text-slate-400" aria-hidden />
                  {row.count}
                  <span className="font-medium text-slate-400">({row.percent}%)</span>
                </span>
                <span className="pointer-events-none min-w-0 flex-1 truncate text-right text-slate-400">
                  {row.referralCount > 0 ? (
                    <span className="font-semibold tabular-nums text-emerald-600">
                      {row.referralCount} via referral
                    </span>
                  ) : row.ownerName ? (
                    <span title={row.ownerName}>{row.ownerName}</span>
                  ) : (
                    "—"
                  )}
                </span>
                {/* Owner-view distribution — one tap copies /ambassador/<code>.
                    Always visible (dimmed) so touch users can reach it; full
                    opacity on hover/focus for pointer devices. */}
                <button
                  type="button"
                  onClick={() => copyOwnerLink(row.code)}
                  className="relative z-10 inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-slate-400 opacity-60 shadow-sm backdrop-blur transition-all hover:border-violet-300 hover:text-violet-600 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 active:scale-[0.94]"
                  aria-label={`Copy owner-view link for ${row.code} (/ambassador/${row.code})`}
                  title="Copy owner-view link (/ambassador/<code>)"
                >
                  {copiedCode === row.code ? (
                    <Check className="size-3.5 text-emerald-600" aria-hidden />
                  ) : (
                    <Link2 className="size-3.5" aria-hidden />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
          Tip: hit the link icon on a card to copy the owner-view URL — channel owners can watch
          their own numbers (no login) at{" "}
          <span className="font-mono text-slate-500">/ambassador/&lt;code&gt;</span>.
        </p>
      )}
    </section>
  )
}
