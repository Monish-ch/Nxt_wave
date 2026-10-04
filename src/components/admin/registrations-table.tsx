"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { SOURCE_STYLES, sourceLabel } from "@/lib/constants"
import { SHARE_VARIANT_MAP, ShareVariantKey } from "@/lib/share-variants"
import { cn } from "@/lib/utils"

/**
 * Outer shell so `useSearchParams` (read below) is inside a Suspense boundary,
 * as required for client components on statically rendered pages.
 */
export function RegistrationsTable() {
  return (
    <Suspense fallback={null}>
      <RegistrationsTableInner />
    </Suspense>
  )
}

interface Row {
  id: string
  fullName: string
  email: string
  whatsapp: string | null
  college: string | null
  branch: string | null
  graduationYear: number | null
  source: string | null
  sourceCode: string | null
  shareVariant: string | null
  referralCode: string
  referrer: { fullName: string; referralCode: string } | null
  referralCount: number
  createdAt: string
}

interface Facets {
  colleges: string[]
  sources: Array<{ value: string; label: string; count: number }>
  allSources: Array<{ value: string; label: string }>
}

interface ApiPayload {
  rows: Row[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  facets: Facets
}

type SortField = "createdAt" | "fullName" | "college" | "source" | "referralCount"

const PAGE_SIZES = [10, 25, 50]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) +
    ", " +
    new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
}

export function RegistrationsTableInner() {
  const searchParams = useSearchParams()
  const initialSourceCode = (searchParams.get("sourceCode") ?? "").trim()

  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [source, setSource] = useState("all")
  const [sourceCode, setSourceCode] = useState(initialSourceCode)
  const [college, setCollege] = useState("all")
  const [sort, setSort] = useState<SortField>("createdAt")
  const [order, setOrder] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [data, setData] = useState<ApiPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350)
    return () => clearTimeout(t)
  }, [q])

  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (debouncedQ.trim()) params.set("q", debouncedQ.trim())
    if (source !== "all") params.set("source", source)
    if (sourceCode) params.set("sourceCode", sourceCode)
    if (college !== "all") params.set("college", college)
    params.set("sort", sort)
    params.set("order", order)
    params.set("page", String(page))
    params.set("pageSize", String(pageSize))
    return params.toString()
  }, [debouncedQ, source, sourceCode, college, sort, order, page, pageSize])

  // Reset to page 1 whenever filters change.
  useEffect(() => {
    setPage(1)
  }, [debouncedQ, source, sourceCode, college, pageSize])

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/registrations?${query}`, {
        signal: controller.signal,
        cache: "no-store",
      })
      if (res.status === 401) {
        window.location.href = "/admin/login"
        return
      }
      if (!res.ok) throw new Error(String(res.status))
      setData(await res.json())
    } catch (e) {
      if ((e as Error).name === "AbortError") return
      setError("Couldn't load registrations. Please retry.")
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [query])

  useEffect(() => {
    load()
    return () => abortRef.current?.abort()
  }, [load])

  function toggleSort(field: SortField) {
    if (sort === field) {
      setOrder((o) => (o === "asc" ? "desc" : "asc"))
    } else {
      setSort(field)
      setOrder(field === "createdAt" ? "desc" : "asc")
    }
  }

  const hasFilters = debouncedQ.trim() || source !== "all" || sourceCode !== "" || college !== "all"
  const facets = data?.facets

  /** Export the currently filtered/sorted dataset as CSV (caps at 1000 rows). */
  async function exportCsv() {
    if (exporting) return
    setExporting(true)
    try {
      const rows: Row[] = []
      for (let p = 1; p <= 10; p++) {
        const params = new URLSearchParams(query)
        params.set("pageSize", "100")
        params.set("page", String(p))
        const res = await fetch(`/api/admin/registrations?${params.toString()}`, { cache: "no-store" })
        if (!res.ok) throw new Error(String(res.status))
        const payload: ApiPayload = await res.json()
        rows.push(...payload.rows)
        if (p >= payload.totalPages) break
      }

      const headers = [
        "Name", "Email", "WhatsApp", "College", "Branch", "Graduation Year",
        "Source", "Source Code", "Share Variant", "Referral Code", "Referrer", "Referrer Code",
        "Referrals", "Registered At",
      ]
      const esc = (v: unknown) => {
        const s = String(v ?? "")
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
      }
      const lines = [
        headers.join(","),
        ...rows.map((r) =>
          [
            r.fullName, r.email, r.whatsapp ?? "", r.college ?? "", r.branch ?? "",
            r.graduationYear ?? "", r.source ?? "", r.sourceCode ?? "", r.shareVariant ?? "",
            r.referralCode,
            r.referrer?.fullName ?? "", r.referrer?.referralCode ?? "",
            r.referralCount, r.createdAt,
          ].map(esc).join(","),
        ),
      ]
      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `nxtwave-registrations-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success(`Exported ${rows.length} registrations`, { description: "CSV downloaded." })
    } catch {
      toast.error("Export failed — please try again.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Registrations</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data ? `${data.total} ${data.total === 1 ? "record" : "records"} found` : "Loading…"}
            {hasFilters && " (filtered)"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting || loading} className="gap-1.5">
            {exporting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4" role="search" aria-label="Registration filters">
        <div className="space-y-1.5">
          <Label htmlFor="search" className="text-xs font-medium text-slate-600">Search</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              id="search"
              type="search"
              placeholder="Name, email, college, code…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-10 pl-9"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-source" className="text-xs font-medium text-slate-600">Source</Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger id="filter-source" className="h-10 w-full">
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {(facets?.allSources ?? []).map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-college" className="text-xs font-medium text-slate-600">College</Label>
          <Select value={college} onValueChange={setCollege}>
            <SelectTrigger id="filter-college" className="h-10 w-full">
              <SelectValue placeholder="All colleges" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All colleges</SelectItem>
              {(facets?.colleges ?? []).map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="page-size" className="text-xs font-medium text-slate-600">Rows per page</Label>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger id="page-size" className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s} rows
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active campaign-code filter chip */}
      {sourceCode && (
        <div className="flex flex-wrap items-center gap-2" role="status">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 py-1 pl-3 pr-1.5 text-xs font-semibold text-violet-700">
            <span className="text-[10px] font-bold uppercase tracking-wide text-violet-500">Code</span>
            <span className="font-mono">{sourceCode}</span>
            <button
              type="button"
              onClick={() => setSourceCode("")}
              className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-violet-100"
              aria-label={`Clear source code filter ${sourceCode}`}
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
          <span className="text-xs text-slate-400">Showing registrations tagged with this campaign code</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
          <AlertTriangle className="size-9 text-destructive" aria-hidden />
          <p className="text-sm text-slate-700">{error}</p>
          <Button onClick={load} variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className="size-4" aria-hidden /> Retry
          </Button>
        </div>
      )}

      {/* Table */}
      {!error && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className={cn("relative overflow-x-auto", loading && "opacity-60 transition-opacity")}>
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50" aria-hidden>
                <Loader2 className="size-6 animate-spin text-violet-500" />
              </div>
            )}
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-transparent">
                  <SortableHeader label="Name" field="fullName" sort={sort} order={order} onSort={toggleSort} />
                  <TableHead className="text-xs">Email</TableHead>
                  <SortableHeader label="College" field="college" sort={sort} order={order} onSort={toggleSort} />
                  <TableHead className="text-xs">Branch</TableHead>
                  <SortableHeader label="Source" field="source" sort={sort} order={order} onSort={toggleSort} />
                  <TableHead className="text-xs">Referrer</TableHead>
                  <SortableHeader
                    label="Referrals"
                    field="referralCount"
                    sort={sort}
                    order={order}
                    onSort={toggleSort}
                    className="text-right"
                  />
                  <SortableHeader label="Registered" field="createdAt" sort={sort} order={order} onSort={toggleSort} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data && (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <TableCell key={j}>
                          <div className="h-4 animate-pulse rounded bg-slate-100" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
                {data && data.rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-14 text-center">
                      <p className="text-sm font-semibold text-slate-600">No registrations match your filters</p>
                      <p className="mt-1 text-xs text-slate-400">Try clearing the search or choosing a different source.</p>
                    </TableCell>
                  </TableRow>
                )}
                {data?.rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-bold text-violet-700">
                          {r.fullName.slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">{r.fullName}</p>
                          <p className="font-mono text-[10.5px] text-slate-400">{r.referralCode}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-48">
                      <p className="truncate text-xs text-slate-500" title={r.email}>{r.email}</p>
                    </TableCell>
                    <TableCell className="max-w-44">
                      <p className="truncate text-xs text-slate-600" title={r.college ?? undefined}>{r.college ?? "—"}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-600">{r.branch ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1", SOURCE_STYLES[r.source as keyof typeof SOURCE_STYLES] ?? SOURCE_STYLES.other)}>
                          {sourceLabel(r.source)}
                        </span>
                        {r.sourceCode && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500">
                            {r.sourceCode}
                          </span>
                        )}
                        {r.source === "referral" && r.shareVariant && (
                          <span
                            className="inline-flex items-center gap-0.5 rounded bg-fuchsia-50 px-1.5 py-0.5 text-[10px] font-semibold text-fuchsia-600 ring-1 ring-fuchsia-100"
                            title={`Landed via the "${r.shareVariant}" invite-message style`}
                          >
                            {SHARE_VARIANT_MAP[r.shareVariant as ShareVariantKey]?.emoji ?? "✉️"} {r.shareVariant}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {r.referrer ? (
                        <div>
                          <p className="text-xs font-medium text-slate-700">{r.referrer.fullName}</p>
                          <p className="font-mono text-[10px] text-slate-400">{r.referrer.referralCode}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Direct</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "inline-flex min-w-8 items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ring-1",
                        r.referralCount > 0
                          ? "bg-violet-50 text-violet-700 ring-violet-100"
                          : "bg-slate-50 text-slate-400 ring-slate-100",
                      )}>
                        {r.referralCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="whitespace-nowrap text-xs text-slate-500">{formatDate(r.createdAt)}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3.5 sm:flex-row">
              <p className="text-xs text-slate-500" aria-live="polite">
                Page <span className="font-bold text-slate-700">{data.page}</span> of{" "}
                <span className="font-bold text-slate-700">{data.totalPages}</span> ·{" "}
                {data.total} {data.total === 1 ? "record" : "records"}
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={data.page <= 1 || loading}
                  aria-label="Previous page"
                  className="gap-1"
                >
                  <ChevronLeft className="size-4" aria-hidden /> Prev
                </Button>
                {pageNumbers(data.page, data.totalPages).map((p, i) =>
                  p === "…" ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-xs text-slate-400">…</span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === data.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(Number(p))}
                      disabled={loading}
                      aria-label={`Page ${p}`}
                      aria-current={p === data.page ? "page" : undefined}
                      className="min-w-8 px-2"
                    >
                      {p}
                    </Button>
                  ),
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(p + 1, data.totalPages))}
                  disabled={data.page >= data.totalPages || loading}
                  aria-label="Next page"
                  className="gap-1"
                >
                  Next <ChevronRight className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- Helpers

function SortableHeader({
  label,
  field,
  sort,
  order,
  onSort,
  className,
}: {
  label: string
  field: SortField
  sort: SortField
  order: "asc" | "desc"
  onSort: (f: SortField) => void
  className?: string
}) {
  const active = sort === field
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          "inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors",
          active ? "text-violet-700" : "text-slate-500 hover:text-slate-800",
        )}
        aria-label={`Sort by ${label}${active ? (order === "asc" ? ", currently ascending" : ", currently descending") : ""}`}
      >
        {label}
        {active ? (
          order === "asc" ? (
            <ChevronUp className="size-3.5" aria-hidden />
          ) : (
            <ChevronDown className="size-3.5" aria-hidden />
          )
        ) : (
          <ChevronDown className="size-3.5 opacity-0" aria-hidden />
        )}
      </button>
    </TableHead>
  )
}

function pageNumbers(current: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: Array<number | "…"> = [1]
  if (current > 3) pages.push("…")
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p)
  }
  if (current < total - 2) pages.push("…")
  pages.push(total)
  return pages
}
