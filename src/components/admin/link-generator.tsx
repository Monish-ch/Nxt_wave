"use client"

import { useMemo, useState } from "react"
import { Check, Copy, Download, Link2, QrCode, Wand2 } from "lucide-react"
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
import { SOURCE_OPTIONS } from "@/lib/constants"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

/** Codes that don't take an extra `code=` tag. */
const CODELESS_SOURCES = new Set(["whatsapp", "referral", "other"])

function sanitizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16)
}

/**
 * Campaign share-link generator: pick a channel, tag a tracking code, get a
 * ready-to-share URL + downloadable QR poster. URLs land on /register where
 * the source & code are captured on registration — closing the loop that the
 * Channel drill-down board reports on.
 */
export function LinkGenerator() {
  const [source, setSource] = useState("ambassador")
  const [code, setCode] = useState("")
  const [copied, setCopied] = useState(false)

  const needsCode = !CODELESS_SOURCES.has(source)
  const cleanCode = sanitizeCode(code)
  const ready = !needsCode || cleanCode.length >= 3

  const link = useMemo(() => {
    const params = new URLSearchParams()
    params.set("source", source)
    if (needsCode && cleanCode) params.set("code", cleanCode)
    return `/register?${params.toString()}`
  }, [source, needsCode, cleanCode])

  const absolute = useMemo(() => {
    if (typeof window === "undefined") return link
    return `${window.location.origin}${link}`
  }, [link])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(absolute)
      toast.success("Tracking link copied!", { description: "Stick it in WhatsApp groups, club banners or Instagram bios." })
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Couldn't copy — please copy it manually.")
    }
  }

  return (
    <section className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-5 shadow-sm" aria-labelledby="linkgen-heading">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h2 id="linkgen-heading" className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
            <Wand2 className="size-4 text-violet-600" aria-hidden />
            Campaign link generator
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Build tracked share-links and QR posters — every registration they drive shows up in the drill-down board.
          </p>
        </div>
      </header>

      <div className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr_auto] lg:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="gen-source" className="text-xs font-medium text-slate-600">Channel</Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger id="gen-source" className="h-10 w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="gen-code" className="text-xs font-medium text-slate-600">
            Tracking code{" "}
            {!needsCode && <span className="font-normal text-slate-400">(not needed for this channel)</span>}
          </Label>
          <Input
            id="gen-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={needsCode ? "e.g. RAHUL01 or CSECLUB01" : "—"}
            disabled={!needsCode}
            className="h-10 bg-white font-mono uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-60"
            maxLength={16}
            aria-describedby={needsCode ? "gen-code-hint" : undefined}
          />
          {needsCode && (
            <p id="gen-code-hint" className="text-[11px] text-slate-400">
              3–16 letters/numbers. Posters, banners and bios share the same code.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 lg:pb-0.5">
          <Button
            type="button"
            onClick={copyLink}
            disabled={!ready}
            className="h-10 gap-1.5 shadow-md shadow-violet-600/20"
            aria-label="Copy tracking link"
          >
            {copied ? <Check className="size-4 text-emerald-200" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? "Copied!" : "Copy link"}
          </Button>
          <Button
            type="button"
            asChild
            variant="outline"
            disabled={!ready}
            className={cn("h-10 gap-1.5 bg-white", !ready && "opacity-60")}
          >
            <a
              href={`/api/qr/link?to=${encodeURIComponent(link)}`}
              download={`nxtwave-qr-${needsCode ? cleanCode.toLowerCase() : source}.svg`}
              aria-disabled={!ready}
            >
              <Download className="size-4" aria-hidden />
              QR poster
            </a>
          </Button>
        </div>
      </div>

      {/* Result strip */}
      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-violet-100 bg-white p-3.5 sm:flex-row sm:items-center">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 ring-violet-100">
          {ready ? (
            <img
              src={`/api/qr/link?to=${encodeURIComponent(link)}`}
              alt="QR code for the generated tracking link"
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <QrCode className="size-8 text-slate-200" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
            <Link2 className="size-3.5 text-violet-500" aria-hidden />
            Your tracked link
          </p>
          <p className="mt-1 truncate font-mono text-xs text-slate-700 sm:text-sm" title={absolute}>
            {absolute}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1",
            ready ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-50 text-slate-400 ring-slate-200",
          )}
        >
          {ready ? "Ready to share" : needsCode ? "Enter a code" : "Pick a channel"}
        </span>
      </div>
    </section>
  )
}
