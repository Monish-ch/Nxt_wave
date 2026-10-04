"use client"

import { useEffect, useRef, useState } from "react"
import { CloudOff, Wifi } from "lucide-react"
import { cn } from "@/lib/utils"

type OnlineState = "checking" | "online" | "offline"

/**
 * Offline indicator for the installable ambassador board (PWA shell).
 *
 * The service worker serves the last-synced board HTML when the network is
 * gone, so the installed app still opens — this banner is the honest label:
 * "you're offline, numbers are your last sync". It flips to a brief
 * "back online" confirmation when connectivity returns, then hides itself.
 *
 * Detection runs after hydration (setTimeout) to avoid any SSR/hydration
 * mismatch, and never renders anything on the server.
 */
export function OfflineIndicator() {
  const [state, setState] = useState<OnlineState>("checking")
  const [visible, setVisible] = useState(false)
  const backTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const sync = () => setState(navigator.onLine ? "online" : "offline")

    // Defer past hydration so the initial state never flashes the wrong banner.
    const t = setTimeout(sync, 0)

    const goOffline = () => {
      setState("offline")
      setVisible(true)
    }
    const goOnline = () => {
      setState("online")
      setVisible(true)
      if (backTimer.current) clearTimeout(backTimer.current)
      backTimer.current = setTimeout(() => setVisible(false), 4000)
    }

    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)
    return () => {
      clearTimeout(t)
      if (backTimer.current) clearTimeout(backTimer.current)
      window.removeEventListener("online", goOnline)
      window.removeEventListener("offline", goOffline)
    }
  }, [])

  // Start hidden until we know the true state.
  if (state === "checking") return null

  if (state === "online") {
    if (!visible) return null
    return (
      <div
        role="status"
        className="animate-swap-in pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
      >
        <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-[#120e1f]/90 px-4 py-2 text-xs font-bold text-emerald-300 shadow-lg shadow-emerald-600/10 backdrop-blur">
          <Wifi className="size-3.5" aria-hidden />
          Back online — refreshing live numbers
        </p>
      </div>
    )
  }

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <p className="inline-flex max-w-md items-center gap-2.5 rounded-full border border-amber-400/25 bg-[#120e1f]/90 px-4 py-2 text-xs font-semibold leading-snug text-amber-300 shadow-lg shadow-amber-600/10 backdrop-blur">
        <CloudOff className="size-4 shrink-0" aria-hidden />
        You&apos;re offline — showing your last synced board. New signups will appear once
        you&apos;re back online.
      </p>
    </div>
  )
}
