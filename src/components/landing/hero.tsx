"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Clock, Flame, GraduationCap, IndianRupee, Radio, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PublicStats } from "@/lib/stats"
import { CountUp } from "@/components/landing/count-up"
import { cn } from "@/lib/utils"

/* Channel-wave gates from the growth hypothesis: 200 ambassador / 150 club / 100 WhatsApp / 50 referral */
const WAVES = [
  { at: 200, label: "Ambassador wave" },
  { at: 350, label: "Club wave" },
  { at: 450, label: "WhatsApp wave" },
  { at: 500, label: "Goal" },
]

const HEADLINE_A = ["BUILD", "YOUR", "FIRST"]
const HEADLINE_B = ["AI", "PROJECT"]
const HEADLINE_C = ["IN", "60", "MINUTES."]

function StaggeredWords({
  words,
  delay = 0,
  className,
  wordClass,
}: {
  words: string[]
  delay?: number
  className?: string
  wordClass?: string
}) {
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 26, rotateX: 40 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.55, delay: delay + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
          className={cn("inline-block", wordClass)}
        >
          {word}
          {i < words.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </span>
  )
}

export function Hero({ stats }: { stats: PublicStats }) {
  const filled = Math.min(stats.percentFilled, 100)
  const urgent = stats.behindPace && stats.seatsLeft > 0

  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
        {/* LIVE mission badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-6 flex justify-center"
        >
          <span className="inline-flex items-center gap-2.5 rounded-full border border-violet-400/25 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-violet-200 shadow-[0_0_28px_-8px] shadow-violet-500/50 backdrop-blur">
            <Radio className="size-3.5 text-violet-300" aria-hidden />
            FREE ONLINE WORKSHOP · LIMITED TO 500 SEATS
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300 ring-1 ring-emerald-400/30">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-300" />
              </span>
              Live
            </span>
          </span>
        </motion.div>

        {/* Kinetic headline */}
        <h1 className="mx-auto max-w-4xl text-center font-display text-[2.6rem] font-bold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-[4.6rem]">
          <StaggeredWords words={HEADLINE_A} delay={0.05} className="block" />
          <StaggeredWords
            words={HEADLINE_B}
            delay={0.28}
            className="block"
            wordClass="text-shimmer bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent"
          />
          <StaggeredWords words={HEADLINE_C} delay={0.44} className="block text-slate-300" />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.62 }}
          className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-slate-400 sm:text-lg"
        >
          A free online workshop built for final-year engineering students. Walk in with zero
          experience, walk out with a working AI project you can demo in placements.
        </motion.p>

        {/* Pace urgency strip — computed live, never hardcoded */}
        {urgent && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.72 }}
            className="animate-pulse-halo-rose mx-auto mt-5 flex w-fit flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 sm:text-sm"
          >
            <Flame className="size-4 text-rose-400" aria-hidden />
            Behind pace — rolling at {stats.actualPerDay}/day, need{" "}
            <span className="font-extrabold tabular-nums">{stats.neededPerDay}/day</span> to fill all {stats.target}
          </motion.p>
        )}
        {!urgent && stats.seatsLeft === 0 && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.72 }}
            className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 sm:text-sm"
          >
            🏁 Goal reached — {stats.target} students in!
          </motion.p>
        )}

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.52 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button
            asChild
            size="lg"
            className="btn-shine h-12 w-full rounded-xl border border-violet-300/30 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 text-base font-semibold shadow-[0_0_44px_-8px] shadow-fuchsia-600/60 transition-all hover:shadow-[0_0_60px_-6px] hover:shadow-fuchsia-500/70 sm:w-auto"
          >
            <Link href="/register">
              Reserve My Free Spot
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 w-full rounded-xl border-white/15 bg-white/[0.04] px-7 text-base text-slate-200 backdrop-blur hover:bg-white/10 hover:text-white sm:w-auto"
          >
            <Link href="/#build">See what you&apos;ll build</Link>
          </Button>
        </motion.div>

        {/* Trust chips */}
        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.66 }}
          className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-400"
        >
          <li className="inline-flex items-center gap-1.5">
            <IndianRupee className="size-4 text-emerald-400" aria-hidden /> 100% free
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Clock className="size-4 text-violet-400" aria-hidden /> 60-minute format
          </li>
          <li className="inline-flex items-center gap-1.5">
            <GraduationCap className="size-4 text-fuchsia-400" aria-hidden /> Final-year friendly
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Zap className="size-4 text-amber-400" aria-hidden /> Beginner-friendly
          </li>
        </motion.ul>

        {/* ---- Mission gauge — the centerpiece ---- */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="conic-border mx-auto mt-16 max-w-3xl rounded-3xl"
        >
          <div className="relative rounded-3xl border border-white/10 bg-[#120e1f]/85 p-6 shadow-[0_24px_80px_-24px] shadow-violet-950/80 backdrop-blur-xl sm:p-8">
            {/* header */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-300">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-violet-400" />
                </span>
                Live mission feed
              </p>
              <p className="font-mono text-xs text-slate-500">
                DAY {stats.campaignDay}/{stats.campaignTotalDays} · TARGET {stats.target}
              </p>
            </div>

            {/* giant counter */}
            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-end gap-3">
                <CountUp
                  value={stats.totalRegistrations}
                  className="font-display text-6xl font-bold leading-none tracking-tight text-white sm:text-7xl"
                />
                <span className="pb-1.5 text-sm font-medium text-slate-400">
                  / {stats.target} seats claimed
                </span>
              </div>
              <div className="flex gap-2 pb-1">
                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300 tabular-nums">
                  +{stats.todayCount} today
                </span>
                <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300 tabular-nums">
                  {stats.referralSharePercent}% referred
                </span>
              </div>
            </div>

            {/* track with wave gates */}
            <div className="mt-6">
              <div className="relative h-3.5 overflow-hidden rounded-full bg-white/[0.07] ring-1 ring-inset ring-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${filled}%` }}
                  transition={{ duration: 1.4, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  data-slot="progress-indicator"
                  className="progress-live h-full rounded-full"
                />
                {WAVES.map((wave) => (
                  <span
                    key={wave.at}
                    className={cn(
                      "absolute top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full",
                      stats.totalRegistrations >= wave.at ? "bg-emerald-300" : "bg-white/25",
                    )}
                    style={{ left: `${Math.min(wave.at / stats.target * 100, 99)}%` }}
                    title={`${wave.label} · ${wave.at} registrations`}
                  />
                ))}
              </div>
              {/* wave labels */}
              <div className="relative mt-2 hidden h-4 sm:block">
                {WAVES.map((wave) => (
                  <span
                    key={wave.at}
                    className={cn(
                      "absolute -translate-x-1/2 whitespace-nowrap font-mono text-[10px] font-semibold",
                      stats.totalRegistrations >= wave.at ? "text-emerald-300" : "text-slate-500",
                    )}
                    style={{ left: `${Math.min(wave.at / stats.target * 100, 99)}%` }}
                  >
                    {wave.at}
                  </span>
                ))}
              </div>
            </div>

            {/* KPI footer */}
            <dl className="mt-5 grid grid-cols-3 divide-x divide-white/[0.07] rounded-2xl bg-white/[0.03] py-3.5 text-center ring-1 ring-inset ring-white/[0.06]">
              <div className="px-2">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Filled</dt>
                <dd className="mt-1 font-display text-xl font-bold tabular-nums text-white sm:text-2xl">
                  <CountUp value={filled} suffix="%" />
                </dd>
              </div>
              <div className="px-2">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Pace / day</dt>
                <dd
                  className={cn(
                    "mt-1 font-display text-xl font-bold tabular-nums sm:text-2xl",
                    urgent ? "text-rose-300" : "text-emerald-300",
                  )}
                >
                  {stats.actualPerDay}
                  <span className="text-sm text-slate-500"> /{stats.neededPerDay}</span>
                </dd>
              </div>
              <div className="px-2">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Seats left</dt>
                <dd className="mt-1 font-display text-xl font-bold tabular-nums text-amber-300 sm:text-2xl">
                  <CountUp value={stats.seatsLeft} />
                </dd>
              </div>
            </dl>

            <p className="mt-4 text-center text-[11px] text-slate-500">
              Wave gates mark the growth plan: 200 ambassadors · 150 clubs · 100 WhatsApp · 50 referrals
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
