import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/site/navbar"
import { Footer } from "@/components/site/footer"
import { ReferralDashboard } from "@/components/success/referral-dashboard"
import { FindDashboardForm } from "@/components/success/find-dashboard-form"
import { getReferralInfo } from "@/lib/referral-info"
import { getCollegePosition, CollegePosition } from "@/lib/stats"
import { Button } from "@/components/ui/button"
import { AlertCircle, SearchX } from "lucide-react"
import { parseShareVariant } from "@/lib/share-variants"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "You're Registered! — Referral Dashboard",
  description: "Your registration is confirmed. Get your referral code, share it, and unlock rewards.",
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const ref = typeof sp.ref === "string" ? sp.ref : ""
  const variant = parseShareVariant(typeof sp.v === "string" ? sp.v : null)

  // No code provided → offer email lookup + guide back to registration.
  if (!ref) {
    return (
      <>
        <Navbar />
        <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-20">
          <div className="glow-blob left-[-120px] top-[-80px] size-[360px] text-violet-500" aria-hidden />
          <div className="glow-blob bottom-[-120px] right-[-100px] size-[320px] text-fuchsia-500" aria-hidden />
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-sm backdrop-blur-sm">
            <SearchX className="mx-auto size-10 text-slate-600" aria-hidden />
            <h1 className="mt-4 font-display text-xl font-bold text-white">Looking for your referral dashboard?</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Enter the email you registered with and we&apos;ll take you straight to your referral
              link and milestone progress.
            </p>
            <div className="mt-6 text-left">
              <FindDashboardForm />
            </div>
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-xs text-slate-400">New here? Registration takes 30 seconds.</p>
              <Button asChild className="mt-3 h-11 rounded-xl px-6 shadow-md shadow-violet-600/20">
                <Link href="/register">Register for the workshop</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const info = await getReferralInfo(ref)
  const campus = info.referrer?.college ? await getCollegePosition(info.referrer.college) : null

  // Invalid code → friendly error state.
  if (!info.valid || !info.referrer || !info.stats) {
    return (
      <>
        <Navbar />
        <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-20">
          <div className="glow-blob left-[-120px] top-[-80px] size-[360px] text-amber-500" aria-hidden />
          <div className="relative max-w-md rounded-2xl border border-amber-400/25 bg-white/[0.04] p-8 text-center shadow-sm backdrop-blur-sm">
            <AlertCircle className="mx-auto size-10 text-amber-400" aria-hidden />
            <h1 className="mt-4 font-display text-xl font-bold text-white">We couldn&apos;t find that referral code</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              The code <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs">{ref}</code>{" "}
              doesn&apos;t exist. If you just registered, double-check the link — or register again with
              your exact email.
            </p>
            <Button asChild variant="outline" className="mt-6 h-11 rounded-xl px-6">
              <Link href="/register">Go to registration</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="flex-1">
        <ReferralDashboard
          referrer={{
            fullName: info.referrer.fullName,
            firstName: info.referrer.firstName,
            referralCode: info.referrer.referralCode,
            joinedAt: info.referrer.joinedAt,
          }}
          stats={info.stats}
          initialVariant={variant}
          campus={campus}
        />
      </main>
      <Footer />
    </>
  )
}
