"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Menu, X, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/site/logo"
import { DemoBadge } from "@/components/site/demo-badge"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { label: "Why attend", href: "/#why" },
  { label: "What you'll build", href: "/#build" },
  { label: "How it works", href: "/#how" },
  { label: "Leaderboard", href: "/leaderboard" },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-all duration-300",
        scrolled
          ? "border-white/10 bg-[#0d0a17]/85 shadow-lg shadow-black/30"
          : "border-transparent bg-transparent",
      )}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6" aria-label="Main navigation">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2.5 md:flex">
          <DemoBadge />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:bg-white/[0.06] hover:text-white"
          >
            <Link href="/admin">
              <LayoutDashboard className="size-4" aria-hidden />
              Admin
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="whitespace-nowrap border border-violet-300/25 bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-[0_0_24px_-6px] shadow-fuchsia-600/70"
          >
            <Link href="/register">Reserve My Free Spot</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-slate-300 hover:bg-white/[0.06] hover:text-white"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-white/10 bg-[#0d0a17]/95 px-4 pb-4 pt-2 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/[0.06] hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-white/[0.06] hover:text-slate-300"
            >
              Admin dashboard
            </Link>
            <Button
              asChild
              className="mt-2 h-11 w-full border border-violet-300/25 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-[15px] shadow-[0_0_24px_-6px] shadow-fuchsia-600/70"
            >
              <Link href="/register" onClick={() => setOpen(false)}>
                Reserve My Free Spot
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
