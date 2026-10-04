"use client"

import { useEffect, useRef, useState } from "react"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

/**
 * Eases a number up from 0 to `value` the first time it scrolls into view.
 * Respects reduced motion (renders the final value immediately) and formats
 * with Indian digit grouping (12,345).
 */
export function CountUp({
  value,
  duration = 1.5,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  const [display, setDisplay] = useState(0)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      started.current = true
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return
        started.current = true
        io.disconnect()
        const t0 = performance.now()
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / (duration * 1000))
          const eased = 1 - Math.pow(1 - p, 3)
          setDisplay(Math.round(value * eased))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [value, duration])

  const shown = reduced || display >= value ? value : display

  return (
    <span ref={ref} className={className} suppressHydrationWarning>
      {prefix}
      {shown.toLocaleString("en-IN")}
      {suffix}
    </span>
  )
}
