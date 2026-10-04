import Link from "next/link"
import { Logo } from "@/components/site/logo"
import { DemoBadge } from "@/components/site/demo-badge"

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/[0.08] bg-[#0b0814] text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-3">
            <Logo tone="dark" />
            <p className="text-sm leading-relaxed text-slate-400">
              A growth challenge prototype: acquire → register → refer → track → optimize for the
              free workshop “Build Your First AI Project in 60 Minutes”.
            </p>
            <DemoBadge />
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Workshop</p>
              <Link href="/#why" className="block hover:text-white">Why attend</Link>
              <Link href="/#build" className="block hover:text-white">What you&apos;ll build</Link>
              <Link href="/register" className="block hover:text-white">Register</Link>
            </div>
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Growth</p>
              <Link href="/leaderboard" className="block hover:text-white">Student leaderboard</Link>
              <Link href="/#refer" className="block hover:text-white">Referral rewards</Link>
              <Link href="/ambassador/RAHUL01" className="block hover:text-white">Ambassador boards</Link>
              <Link href="/admin" className="block hover:text-white">Growth dashboard</Link>
              <Link href="/success" className="block hover:text-white">Find my dashboard</Link>
            </div>
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Challenge</p>
              <span className="block">Target: 500 students</span>
              <span className="block">Budget: ₹2,000</span>
              <span className="block">Duration: 7 days</span>
            </div>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} NxtWave Growth Engine — simulation prototype. No real student outreach.</p>
          <p>Built to demonstrate ACQUIRE → REGISTER → REFER → TRACK → OPTIMIZE</p>
        </div>
      </div>
    </footer>
  )
}
