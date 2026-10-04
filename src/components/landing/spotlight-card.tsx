"use client"

import { useRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Card with a mouse-tracked radial spotlight. The highlight position is fed
 * through --mx/--my custom props consumed by the .spotlight-card::before
 * gradient in globals.css — zero re-renders, pure CSS paint.
 */
export function SpotlightCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`)
    el.style.setProperty("--my", `${e.clientY - rect.top}px`)
  }

  return (
    <div ref={ref} onMouseMove={handleMove} className={cn("spotlight-card", className)}>
      {children}
    </div>
  )
}
