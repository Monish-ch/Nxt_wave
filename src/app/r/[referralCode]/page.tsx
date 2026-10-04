import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BrainCircuit, CheckCircle2, Clock, Gift, GraduationCap, IndianRupee, Users, Zap } from "lucide-react"
import { Navbar } from "@/components/site/navbar"
import { Footer } from "@/components/site/footer"
import { Button } from "@/components/ui/button"
import { getReferralInfo } from "@/lib/referral-info"
import { getPublicStats } from "@/lib/stats"
import { SearchX, AlertCircle } from "lucide-react"
import { MILESTONE_TIERS } from "@/lib/milestones"
import { parseShareVariant } from "@/lib/share-variants"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ referralCode: string }>
}): Promise<Metadata> {
  const { referralCode } = await params
  const info = await getReferralInfo(referralCode)
  if (info.valid && info.referrer) {
    return {
      title: `${info.referrer.firstName} invited you — Build Your First AI Project in 60 Minutes`,
      description: `Join ${info.referrer.firstName} at NxtWave's free AI workshop for final-year engineering students. Reserve your spot in 30 seconds.`,
    }
  }
  return {
    title: "Workshop Invite",
    description: "You've been invited to NxtWave's free AI workshop for final-year engineering students.",
  }
}

export default async function ReferralLandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ referralCode: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { referralCode } = await params
  const sp = await searchParams
  const rawVariant = typeof sp.v === "string" ? sp.v : undefined
  const shareVariant = parseShareVariant(rawVariant)
  const [info, stats] = await Promise.all([getReferralInfo(referralCode), getPublicStats()])
  const registerHref = shareVariant
    ? `/register?ref=${encodeURIComponent(referralCode)}&v=${shareVariant}`
    : `/register?ref=${encodeURIComponent(referralCode)}`

  // ------------------------------ Invalid code ------------------------------
  if (!info.valid || !info.referrer) {
    return (
      <>
        <Navbar />
        <main id="main-content" className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-20">
          <div className="glow-blob left-[-120px] top-[-80px] size-[360px] text-amber-500" aria-hidden />
          <div className="relative max-w-md rounded-2xl border border-amber-400/25 bg-white/[0.04] p-8 text-center shadow-sm backdrop-blur-sm">
            {info.reason === "bad_format" ? (
              <SearchX className="mx-auto size-10 text-slate-600" aria-hidden />
            ) : (
              <AlertCircle className="mx-auto size-10 text-amber-400" aria-hidden />
            )}
            <h1 className="mt-4 font-display text-xl font-bold text-white">This invite link isn&apos;t valid</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              The referral code <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs">{referralCode}</code>{" "}
              doesn&apos;t match any registered student. The workshop is still 100% free — you can
              register directly.
            </p>
            <Button asChild className="mt-6 h-11 rounded-xl px-6 shadow-md shadow-violet-600/20">
              <Link href="/register">Register without a referral</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // ------------------------------ Valid referral ------------------------------
  const { referrer } = info

  return (
    <>
      <Navbar />
      <main id="main-content" className="flex-1">
        {/* Invited-by hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-dots" aria-hidden />
          <div className="glow-blob left-[-100px] top-[-60px] size-[340px] text-fuchsia-300" aria-hidden />
          <div className="glow-blob right-[-120px] top-[40px] size-[380px] text-violet-400" aria-hidden />

          <div className="relative mx-auto max-w-4xl px-4 pb-14 pt-14 text-center sm:px-6 sm:pt-18">
            <div className="mx-auto flex max-w-md items-center justify-center gap-3 rounded-2xl border border-fuchsia-400/25 bg-[#120e1f]/85 p-4 shadow-lg shadow-fuchsia-600/5 backdrop-blur">
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-lg font-extrabold text-white">
                {referrer.firstName.slice(0, 1).toUpperCase()}
              </span>
              <div className="text-left">
                <p className="text-sm font-bold text-white">{referrer.firstName} invited you 🎉</p>
                <p className="text-xs text-slate-400">
                  Referral <code className="rounded bg-violet-500/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-violet-300 ring-1 ring-violet-400/25">{referrer.referralCode}</code>
                  {referrer.college ? ` · ${referrer.college}` : ""}
                </p>
              </div>
            </div>

            <h1 className="mt-8 text-balance font-display text-4xl font-extrabold leading-[1.06] tracking-tight text-white sm:text-6xl">
              BUILD YOUR FIRST{" "}
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600 bg-clip-text text-transparent">
                AI PROJECT
              </span>{" "}
              IN 60 MINUTES
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-slate-400 sm:text-lg">
              {referrer.firstName} is saving you a spot at NxtWave&apos;s free online workshop for
              final-year engineering students. Zero experience needed — you&apos;ll leave with a
              working AI project.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 w-full rounded-xl px-7 text-base shadow-lg shadow-violet-600/25 sm:w-auto">
                <Link href={registerHref}>
                  Claim My Free Spot
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <p className="text-xs text-slate-400">
                <span className="tabular-nums font-semibold text-slate-200">{stats.totalRegistrations}</span> students
                already registered · <span className="tabular-nums">{stats.seatsLeft}</span> spots left
              </p>
            </div>

            <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-400">
              <li className="inline-flex items-center gap-1.5"><IndianRupee className="size-4 text-emerald-400" aria-hidden /> 100% free</li>
              <li className="inline-flex items-center gap-1.5"><Clock className="size-4 text-violet-400" aria-hidden /> 60-minute format</li>
              <li className="inline-flex items-center gap-1.5"><GraduationCap className="size-4 text-fuchsia-400" aria-hidden /> Final-year friendly</li>
              <li className="inline-flex items-center gap-1.5"><Zap className="size-4 text-amber-500" aria-hidden /> Beginner-friendly</li>
            </ul>
          </div>
        </section>

        {/* Value strip */}
        <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: BrainCircuit, title: "Build, don't watch", body: "Ship a working AI chatbot trained on your own notes — live, in one hour." },
              { icon: GraduationCap, title: "Placement-ready", body: "Walk out with a demo-able project for interviews and your resume." },
              { icon: Users, title: "Friends who build together", body: "Join through this link and your registration counts toward your friend's rewards." },
            ].map((item) => (
              <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-sm">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/25">
                  <item.icon className="size-5" aria-hidden />
                </span>
                <h2 className="mt-3.5 font-display text-base font-semibold text-white">{item.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{item.body}</p>
              </article>
            ))}
          </div>

          {/* Reward ladder teaser */}
          <div className="mt-10 rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6 sm:p-7">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-300">
              <Gift className="size-3.5" aria-hidden /> Why you should use the link
            </p>
            <h2 className="mt-3 font-display text-xl font-bold text-white">Your registration rewards your friend</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              Registering through {referrer.firstName}&apos;s link automatically counts toward their
              referral milestones — they unlock rewards at 1, 3, 5 and 10 referrals. You pay nothing
              and lose nothing. Everyone wins.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {MILESTONE_TIERS.map((tier) => (
                <span key={tier.referralCount} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-slate-200 shadow-sm ring-1 ring-amber-400/25">
                  <CheckCircle2 className="size-3.5 text-amber-500" aria-hidden />
                  {tier.referralCount} {tier.referralCount === 1 ? "referral" : "referrals"} → {tier.name}
                </span>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <div className="mt-10 text-center">
            <Button asChild size="lg" className="h-13 w-full max-w-sm rounded-xl bg-white px-8 text-base font-semibold text-slate-900 shadow-xl hover:bg-slate-200 sm:h-12">
              <Link href={registerHref}>
                Join {referrer.firstName} — Reserve My Free Spot
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <p className="mt-3 text-xs text-slate-400">Free forever · No credit card · 30-second form</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
