"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

interface TermLine {
  text: string
  tone: "cmd" | "ok" | "q" | "a" | "dim"
}

const SCRIPT: TermLine[] = [
  { text: "$ python study_buddy.py --notes OS_Unit3.pdf", tone: "cmd" },
  { text: "✓ Loaded 42 pages of notes", tone: "ok" },
  { text: "✓ Indexed 1,204 chunks in 3.2s", tone: "ok" },
  { text: "✓ AI tutor ready — ask anything", tone: "ok" },
  { text: "Q  Explain deadlocks in simple words?", tone: "q" },
  { text: "A  Two programs each hold a resource the other", tone: "a" },
  { text: "   needs — so both wait forever. Like two friends", tone: "a" },
  { text: "   sharing one earphone each…", tone: "a" },
]

const TONE_STYLES: Record<TermLine["tone"], string> = {
  cmd: "text-slate-100",
  ok: "text-emerald-300",
  q: "text-violet-300",
  a: "text-slate-300",
  dim: "text-slate-500",
}

const TYPE_MS_PER_CHAR = 18
const LINE_PAUSE_MS = 260
const RESTART_PAUSE_MS = 5200

/**
 * Self-playing fake terminal that "builds the AI project" while you watch.
 * Lines type out sequentially (current line char-by-char), hold, then loop.
 * Reduced motion renders the finished transcript statically.
 */
export function BuildTerminal() {
  const reduced = usePrefersReducedMotion()
  const [done, setDone] = useState<string[]>([])
  const [current, setCurrent] = useState("")
  const [tone, setTone] = useState<TermLine["tone"]>("cmd")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (reduced) return

    let line = 0
    let char = 0
    let cancelled = false

    const step = () => {
      if (cancelled) return
      if (line >= SCRIPT.length) {
        // Full transcript shown — hold, wipe, loop.
        timer.current = setTimeout(() => {
          if (cancelled) return
          line = 0
          char = 0
          setDone([])
          setCurrent("")
          step()
        }, RESTART_PAUSE_MS)
        return
      }
      const target = SCRIPT[line]
      setTone(target.tone)
      if (char <= target.text.length) {
        setCurrent(target.text.slice(0, char))
        char += 1
        timer.current = setTimeout(step, TYPE_MS_PER_CHAR)
      } else {
        setDone((d) => [...d, target.text])
        setCurrent("")
        line += 1
        char = 0
        timer.current = setTimeout(step, LINE_PAUSE_MS)
      }
    }
    step()

    return () => {
      cancelled = true
      if (timer.current) clearTimeout(timer.current)
    }
  }, [reduced])

  const allLines = reduced ? SCRIPT.map((l) => l.text) : done
  const tones = reduced ? SCRIPT.map((l) => l.tone) : done.map((_, i) => SCRIPT[i].tone)

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0813]/90 shadow-2xl shadow-violet-950/40 backdrop-blur">
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-white/[0.07] bg-white/[0.04] px-4 py-3">
        <span className="size-2.5 rounded-full bg-rose-500/80" aria-hidden />
        <span className="size-2.5 rounded-full bg-amber-400/80" aria-hidden />
        <span className="size-2.5 rounded-full bg-emerald-400/80" aria-hidden />
        <span className="ml-2 font-mono text-[11px] font-semibold tracking-wide text-slate-400">
          study-buddy — workshop build, minute 47
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300">
          <span className="size-1.5 animate-pulse rounded-full bg-violet-400" aria-hidden />
          running
        </span>
      </div>
      {/* Transcript */}
      <div
        className="min-h-[248px] space-y-1.5 p-4 font-mono text-[12.5px] leading-relaxed sm:text-[13px]"
        aria-label="Animated preview of the AI project being built in the terminal"
      >
        {allLines.map((line, i) => (
          <p key={i} className={cn("whitespace-pre-wrap", TONE_STYLES[tones[i] ?? "dim"])}>
            {line}
            {reduced && i === allLines.length - 1 && <span className="ml-0.5">▍</span>}
          </p>
        ))}
        {!reduced && (
          <p className={cn("whitespace-pre-wrap", TONE_STYLES[tone])}>
            {current}
            <span className="animate-caret-blink text-violet-300">▍</span>
          </p>
        )}
      </div>
    </div>
  )
}
