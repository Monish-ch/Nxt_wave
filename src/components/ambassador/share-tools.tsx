"use client"

import { useState } from "react"
import { BarChart3, Check, Copy, Download, ExternalLink, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

/**
 * Share toolkit on the public ambassador page — copy tracking link, QR
 * download, WhatsApp distribution of the board itself and a preview link.
 * Client-side so clipboard access works. The origin is resolved at click
 * time (no SSR/hydration concerns).
 */
export function AmbassadorShareTools({ code, trackingPath }: { code: string; trackingPath: string }) {
  const [copied, setCopied] = useState(false)
  const [copiedBoard, setCopiedBoard] = useState(false)

  async function copyLink() {
    const target = `${window.location.origin}${trackingPath}`
    try {
      await navigator.clipboard.writeText(target)
      setCopied(true)
      toast.success("Tracking link copied!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Couldn't copy — long-press the link text instead.")
    }
  }

  function boardUrl() {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    return `${origin}/ambassador/${encodeURIComponent(code)}`
  }

  /** Resolved at click time — window isn't available during SSR. */
  function openBoardOnWhatsApp() {
    const message = `📊 My live ambassador board for NxtWave's free "Build Your First AI Project" workshop — every signup through my link shows up here in real time: ${boardUrl()}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener")
  }

  async function copyBoardLink() {
    try {
      await navigator.clipboard.writeText(boardUrl())
      setCopiedBoard(true)
      toast.success("Board link copied!")
      setTimeout(() => setCopiedBoard(false), 2000)
    } catch {
      toast.error("Couldn't copy — long-press the address bar instead.")
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-sm font-bold text-white">Your tracking toolkit</h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">
        Every registration through this link counts on your board above. Share it in class groups,
        WhatsApp status, or print the QR on your club notice board.
      </p>

      <div className="mt-4 flex items-stretch gap-2">
        <div
          className="min-w-0 flex-1 truncate rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 font-mono text-[11px] text-slate-300 sm:text-xs"
          title={trackingPath}
        >
          {trackingPath}
        </div>
        <button
          type="button"
          onClick={copyLink}
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold transition-colors active:scale-[0.97]",
            copied
              ? "bg-emerald-600 text-white"
              : "bg-violet-600 text-white shadow-sm hover:bg-violet-700",
          )}
        >
          {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg ring-1 ring-violet-400/25">
          <img src={`/api/qr/link?to=${encodeURIComponent(trackingPath)}`} alt={`QR code for tracking link ${trackingPath}`} className="size-full object-cover" loading="lazy" />
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          <a
            href={`/api/qr/link?to=${encodeURIComponent(trackingPath)}`}
            download={`nxtwave-qr-${code}.svg`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-400/25 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300 transition-colors hover:bg-violet-500/20"
          >
            <Download className="size-3.5" aria-hidden />
            Download QR
          </a>
          <a
            href={trackingPath}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/[0.08]"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Preview form
          </a>
        </div>
      </div>

      {/* Board distribution — put the live scorecard itself in front of stakeholders */}
      <div className="mt-4 rounded-xl border border-emerald-400/25 bg-gradient-to-r from-emerald-500/10 to-teal-500/[0.07] p-3.5">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-100">
          <BarChart3 className="size-3.5 text-emerald-400" aria-hidden />
          Show off your board
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
          Send your live scorecard to club leads, faculty or the growth team — it updates itself, no
          login needed.
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openBoardOnWhatsApp}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-[0.97]"
          >
            <MessageCircle className="size-3.5" aria-hidden />
            WhatsApp this board
          </button>
          <button
            type="button"
            onClick={copyBoardLink}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors active:scale-[0.97]",
              copiedBoard
                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                : "border-emerald-400/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20",
            )}
          >
            {copiedBoard ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
            {copiedBoard ? "Copied!" : "Copy board link"}
          </button>
        </div>
      </div>
    </div>
  )
}
