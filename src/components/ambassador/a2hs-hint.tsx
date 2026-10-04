"use client"

import { useEffect, useState } from "react"
import { Download, Smartphone, X } from "lucide-react"

type Platform = "ios" | "android" | "desktop"

const STEPS: Record<Exclude<Platform, "desktop">, string[]> = {
  ios: ["Tap the Share button (□↑) in Safari", "Scroll and choose “Add to Home Screen”"],
  android: ["Open the ⋮ menu in Chrome", "Tap “Add to Home screen” / “Install app”"],
}

const STORAGE_KEY = "nxw-a2hs-dismissed"

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

/**
 * "Add to Home Screen" hint for the ambassador board — a bookmark-and-return
 * page, so the growth loop benefits from one-tap access.
 *
 * - Android/desktop Chrome with the manifest + service worker installed:
 *   the native `beforeinstallprompt` fires and we upgrade the hint to a
 *   one-tap "Install app" button.
 * - iOS Safari: platform-specific manual steps (no install prompt exists).
 * - Hidden entirely on desktop browsers without install support, dismissed
 *   forever via localStorage, and never shown when already standalone.
 */
export function AddToHomeScreenHint() {
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // Deferred past the render pass (and past hydration) — platform/storage
    // reads are external-system state, so detection runs in a timeout rather
    // than synchronously inside the effect.
    const id = window.setTimeout(() => {
      try {
        if (localStorage.getItem(STORAGE_KEY) === "1") return
        const ua = navigator.userAgent
        const isIos =
          /iPad|iPhone|iPod/.test(ua) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) // iPadOS 13+
        const isAndroid = /Android/.test(ua)
        const standalone =
          window.matchMedia("(display-mode: standalone)").matches ||
          (navigator as unknown as { standalone?: boolean }).standalone === true
        if (standalone) return // already installed — nothing to teach
        setPlatform(isIos ? "ios" : isAndroid ? "android" : null)
      } catch {
        // Private mode / storage blocked — stay quiet rather than nag.
      }
    }, 0)

    // Native install prompt (needs manifest + SW + engagement) — capture it
    // early, Chrome only fires it once per page load.
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as InstallPromptEvent)
    }
    const onInstalled = () => {
      setInstallEvent(null)
      dismiss()
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1")
    } catch {
      // ignore — dismissal just won't persist
    }
    setPlatform(null)
    setInstallEvent(null)
  }

  async function runInstall() {
    if (!installEvent) return
    setInstalling(true)
    try {
      await installEvent.prompt()
      const choice = await installEvent.userChoice
      if (choice.outcome === "accepted") dismiss()
    } catch {
      // user closed the native dialog — keep the hint around
    } finally {
      setInstalling(false)
    }
  }

  if (!platform && !installEvent) return null
  const steps = platform ? STEPS[platform] : []

  return (
    <div
      role="note"
      aria-label="Add this board to your home screen"
      className="animate-swap-in relative overflow-hidden rounded-2xl border border-violet-400/25 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/[0.07] to-transparent p-4 shadow-sm sm:p-5"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss this hint"
        className="absolute right-2.5 top-2.5 inline-flex size-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
      >
        <X className="size-4" aria-hidden />
      </button>
      <div className="flex items-start gap-3 pr-8">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/25">
          <Smartphone className="size-4.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white">
            {installEvent ? "Install the NxtWave app" : "Keep your board one tap away"}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
            {installEvent
              ? "One tap and your ambassador board lives on your home screen — works offline too."
              : "Add this page to your home screen and check your numbers after every push — no app needed."}
          </p>
          {installEvent ? (
            <button
              type="button"
              onClick={runInstall}
              disabled={installing}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/25 transition-colors hover:bg-violet-700 disabled:opacity-60"
            >
              <Download className={installing ? "size-3.5 animate-bounce" : "size-3.5"} aria-hidden />
              {installing ? "Opening installer…" : "Install app"}
            </button>
          ) : (
            <ol className="mt-2 flex flex-wrap gap-1.5">
              {steps.map((step, i) => (
                <li
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-slate-300 ring-1 ring-violet-400/25"
                >
                  <span className="inline-flex size-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
