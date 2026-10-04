"use client"

import { useEffect } from "react"

/**
 * Registers the minimal service worker (public/sw.js) that makes the app
 * installable and gives the ambassador board an offline fallback. Registration
 * is failure-tolerant: if SW is unavailable (old browser, insecure context),
 * everything keeps working exactly as before.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") return

    const id = window.setTimeout(() => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Non-fatal — the board works without a service worker.
      })
    }, 1200) // defer past hydration & first paint so it never competes with LCP
    return () => window.clearTimeout(id)
  }, [])

  return null
}
