import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { Lock, ShieldCheck } from "lucide-react"
import { LoginForm } from "@/components/admin/login-form"
import { DEMO_MODE } from "@/lib/constants"
import { Logo } from "@/components/site/logo"

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  return (
    <main
      id="main-content"
      className="relative flex min-h-screen flex-1 flex-col items-center justify-center bg-slate-950 px-4 py-12"
    >
      <div className="absolute inset-0 bg-grid-dots opacity-30" aria-hidden />
      <div className="glow-blob left-[15%] top-[15%] size-[300px] text-violet-700" aria-hidden />
      <div className="glow-blob bottom-[10%] right-[15%] size-[300px] text-fuchsia-700" aria-hidden />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo tone="dark" />
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl backdrop-blur">
          <div className="text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-violet-600/15 text-violet-400 ring-1 ring-violet-500/30">
              <Lock className="size-5.5" aria-hidden />
            </span>
            <h1 className="mt-4 text-xl font-bold text-white">Growth Console</h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Admin access — growth dashboard & registration data
            </p>
          </div>

          <Suspense fallback={<div className="mt-7 h-40 animate-pulse rounded-xl bg-slate-800/60" />}>
            <LoginForm />
          </Suspense>

          {DEMO_MODE && (
            <p className="mt-5 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-300">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Demo admin mode: password is{" "}
                <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono font-bold">12345</code>{" "}
                (set ADMIN_PASSWORD in production).
              </span>
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-300">
            ← Back to workshop landing page
          </Link>
        </p>
      </div>
    </main>
  )
}
