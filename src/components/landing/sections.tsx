import Link from "next/link"
import {
  Award,
  BrainCircuit,
  CheckCircle2,
  Gift,
  Layers,
  Lightbulb,
  Link2,
  MessageSquareText,
  Rocket,
  Send,
  Trophy,
  Users,
  Wrench,
  XCircle,
  ArrowRight,
  CalendarClock,
  Youtube,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { MILESTONE_TIERS } from "@/lib/milestones"
import { Reveal } from "@/components/site/reveal"
import { SpotlightCard } from "@/components/landing/spotlight-card"
import { BuildTerminal } from "@/components/landing/terminal"

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle?: string
}) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-300">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-balance font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-pretty text-base leading-relaxed text-slate-400">{subtitle}</p>}
    </Reveal>
  )
}

// ---------------------------------------------------------------- Why
const WHY_ITEMS = [
  {
    icon: BrainCircuit,
    title: "Zero to AI project in one sitting",
    body: "No month-long course. In a single focused hour you'll build and ship a real AI application — not watch slides.",
    accent: "text-violet-300 bg-violet-500/15 ring-violet-400/30",
  },
  {
    icon: Award,
    title: "A placement-ready portfolio piece",
    body: "Final-year interviews ask “what have you built?”. You'll walk away with a live project you can demo and talk about.",
    accent: "text-emerald-300 bg-emerald-500/15 ring-emerald-400/30",
  },
  {
    icon: Lightbulb,
    title: "Beginner-friendly, jargon-free",
    body: "If you can write basic code — or even just copy-paste — you can follow along. Every step is explained live.",
    accent: "text-amber-300 bg-amber-500/15 ring-amber-400/30",
  },
]

export function WhySection() {
  return (
    <section id="why" className="scroll-mt-20 py-16 sm:py-24" aria-labelledby="why-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="why-heading" className="sr-only">Why this workshop</h2>
        <SectionHeading
          eyebrow="Why this workshop"
          title="Most tutorials teach. This one ships."
          subtitle="You don't need another playlist of unfinished courses. You need one working project — and the confidence that you can build with AI."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {WHY_ITEMS.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.08}>
              <SpotlightCard className="group h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-lg shadow-black/20 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:shadow-violet-950/50">
                <span
                  className={`inline-flex size-11 items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-110 ${item.accent}`}
                >
                  <item.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- What you'll build
export function BuildSection() {
  return (
    <section id="build" className="scroll-mt-20 py-16 sm:py-24" aria-labelledby="build-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-fuchsia-300">
              What you&apos;ll build
            </p>
            <h2 id="build-heading" className="mt-4 text-balance font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              “AI Study Buddy” — a chatbot that answers from your own notes
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-slate-400">
              Together, live, we&apos;ll build a working AI app that reads your subject notes (PDFs,
              screenshots, past papers) and answers questions in plain English — like ChatGPT, but
              trained on <em className="text-slate-200">your</em> syllabus.
            </p>
            <ul className="mt-6 space-y-3.5">
              {[
                "Set up a free AI API in under 5 minutes",
                "Feed it your notes and ask real questions",
                "Add a chat interface you can share with friends",
                "Deploy it live so you can put the link on your resume",
              ].map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-emerald-400" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="btn-shine h-11 rounded-xl border border-violet-300/30 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 font-semibold shadow-[0_0_36px_-8px] shadow-fuchsia-600/60"
              >
                <Link href="/register">
                  Save my seat — it&apos;s free
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <p className="inline-flex items-center gap-1.5 text-sm text-slate-400">
                <Layers className="size-4 text-violet-400" aria-hidden />
                No prior AI experience needed
              </p>
            </div>
          </div>

          {/* Live build terminal */}
          <Reveal className="relative">
            <div className="glow-blob right-[-70px] bottom-[-50px] size-[280px] text-fuchsia-600" aria-hidden />
            <BuildTerminal />
            <p className="mt-3 text-center text-xs text-slate-500">
              Watch the exact project build itself — this is what you&apos;ll do live in 60 minutes.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- Who should attend
const WHO_GOOD = [
  "Final-year engineering students (any branch)",
  "Students with placements or projects coming up",
  "Curious beginners who feel “AI is happening without me”",
  "Anyone who wants one solid, demo-able project",
]

const WHO_NOT = [
  "You want a long theoretical course",
  "You already build AI products daily",
  "You can't spare 60 focused minutes",
]

export function WhoSection() {
  return (
    <section className="py-16 sm:py-24" aria-labelledby="who-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Who should attend"
          title="Made for final-years who want proof, not promises"
          subtitle="If any of these sound like you, this hour is the highest-leverage hour of your week."
        />
        <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-[1.4fr_1fr]">
          <Reveal>
            <div className="h-full rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.07] p-6 backdrop-blur">
              <h3 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-300">
                <CheckCircle2 className="size-4.5" aria-hidden /> This is for you if…
              </h3>
              <ul className="mt-4 space-y-3">
                {WHO_GOOD.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
              <h3 className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400">
                <XCircle className="size-4.5" aria-hidden /> Skip it if…
              </h3>
              <ul className="mt-4 space-y-3">
                {WHO_NOT.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-500">
                    <XCircle className="mt-0.5 size-4 shrink-0 text-slate-600" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- How it works
const STEPS = [
  {
    icon: Rocket,
    title: "Register free",
    body: "Fill a 30-second form. Your spot is confirmed instantly — no payment, ever.",
  },
  {
    icon: Link2,
    title: "Get your referral link",
    body: "Every student gets a unique code like NXW-MONISH42. Share it — friends who register count toward your rewards.",
  },
  {
    icon: Send,
    title: "Join the workshop",
    body: "You'll get the workshop link on the day. Bring a laptop and your subject notes. That's it.",
  },
  {
    icon: Trophy,
    title: "Ship your AI project",
    body: "By minute 60 your project is live. Share the link, add it to your resume, flex it in interviews.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how" className="scroll-mt-20 py-16 sm:py-24" aria-labelledby="how-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="How it works"
          title="From sign-up to shipped project in 4 steps"
        />
        <Reveal>
          <ol className="relative mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* connecting beam (desktop) */}
            <div
              aria-hidden
              className="absolute left-[12%] right-[12%] top-7 hidden h-px bg-gradient-to-r from-violet-500/60 via-fuchsia-500/40 to-emerald-400/50 lg:block"
            />
            {STEPS.map((step, i) => (
              <li key={step.title} className="group relative rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-lg shadow-black/20 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/30">
                <span className="absolute -top-3.5 left-6 inline-flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 font-display text-xs font-bold text-white shadow-[0_0_20px_-2px] shadow-fuchsia-600/70 ring-2 ring-[#0d0a17]">
                  {i + 1}
                </span>
                <span className="mt-2 inline-flex size-11 items-center justify-center rounded-xl bg-white/[0.06] text-violet-300 ring-1 ring-white/10 transition-colors group-hover:bg-violet-500/20 group-hover:text-violet-200">
                  <step.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.body}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- Referral CTA
export function ReferralSection() {
  return (
    <section id="refer" className="scroll-mt-20 py-16 sm:py-24" aria-labelledby="refer-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="conic-border rounded-3xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#120e1f]/85 p-8 shadow-[0_24px_80px_-24px] shadow-violet-950/70 backdrop-blur-xl sm:p-10 lg:p-12">
            <div className="glow-blob left-[-60px] top-[-60px] size-[260px] text-violet-600" aria-hidden />
            <div className="relative grid gap-10 lg:grid-cols-2">
              <div>
                <p className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-300">
                  <Gift className="size-3.5" aria-hidden /> Refer & unlock rewards
                </p>
                <h2 id="refer-heading" className="mt-4 text-balance font-display text-3xl font-bold tracking-tight text-white">
                  Your registration is a growth engine
                </h2>
                <p className="mt-4 text-pretty text-base leading-relaxed text-slate-400">
                  The moment you register, you get a personal referral link. Every friend who joins
                  through it is tracked automatically — and unlocks real rewards at every milestone.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <Link2 className="mt-0.5 size-4 shrink-0 text-violet-400" aria-hidden />
                    One tap copy + WhatsApp share button built in
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Users className="mt-0.5 size-4 shrink-0 text-violet-400" aria-hidden />
                    Live dashboard: see exactly how many friends joined
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Wrench className="mt-0.5 size-4 shrink-0 text-violet-400" aria-hidden />
                    Rewards unlock automatically — no manual claims
                  </li>
                </ul>
                <Button
                  asChild
                  size="lg"
                  className="btn-shine mt-8 h-11 rounded-xl border border-violet-300/30 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 font-semibold shadow-[0_0_36px_-8px] shadow-fuchsia-600/60"
                >
                  <Link href="/register">
                    Register & get my link
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              </div>

              <div className="space-y-3">
                {MILESTONE_TIERS.map((tier, i) => (
                  <div
                    key={tier.referralCount}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur transition-colors hover:border-fuchsia-400/30"
                  >
                    <span
                      className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 font-display text-base font-extrabold text-white shadow-[0_0_20px_-4px] shadow-fuchsia-600/70"
                      style={{ opacity: 1 - i * 0.12 }}
                    >
                      {tier.referralCount}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white">
                        {tier.name}{" "}
                        <span className="font-medium text-slate-500">
                          · {tier.referralCount} {tier.referralCount === 1 ? "referral" : "referrals"}
                        </span>
                      </p>
                      <p className="truncate text-sm text-slate-400">{tier.rewardText}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- FAQ
const FAQS = [
  {
    q: "Is it really free? What's the catch?",
    a: "Completely free — no credit card, no trial, no upsell during the session. The workshop is sponsored by NxtWave to help students start their AI journey with a real project instead of another unfinished course.",
  },
  {
    q: "I've never coded an AI app before. Can I keep up?",
    a: "Yes — that's the whole point. Every step is done live, explained in plain English, and copy-paste friendly. If you can send a WhatsApp message and open a browser tab, you can finish this workshop.",
  },
  {
    q: "What do I need during the 60 minutes?",
    a: "A laptop (or a large tablet), a stable internet connection, and your subject notes — PDFs or photos of them. We'll send the joining link and a tiny checklist the day before.",
  },
  {
    q: "What exactly will I walk away with?",
    a: "A deployed “AI Study Buddy” chatbot with a shareable link, the full source code on your own account, and the confidence to explain it in placement interviews.",
  },
  {
    q: "How do the referral rewards work?",
    a: "After registering you get a personal referral code. Every friend who registers through your link counts automatically on your dashboard — milestones at 1, 3, 5 and 10 referrals unlock rewards with no manual claiming.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 py-16 sm:py-24" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 id="faq-heading" className="sr-only">Frequently asked questions</h2>
        <SectionHeading
          eyebrow="Questions"
          title="Everything students ask before reserving"
        />
        <Reveal className="mt-10">
          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 backdrop-blur last:border-b data-[state=open]:border-violet-400/30"
              >
                <AccordionTrigger className="py-4 text-left text-[15px] font-semibold text-slate-100 hover:no-underline [&>svg]:text-violet-300">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-slate-400">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- Final CTA
export function FinalCtaSection({ seatsLeft, total }: { seatsLeft: number; total: number }) {
  return (
    <section className="pb-20 pt-4 sm:pb-28" aria-labelledby="final-cta-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="conic-border rounded-3xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#120e1f]/90 px-6 py-14 text-center shadow-[0_24px_90px_-24px] shadow-fuchsia-950/70 backdrop-blur-xl sm:px-12 sm:py-20">
            <div className="absolute inset-0 bg-grid-dots opacity-50" aria-hidden />
            <div className="glow-blob left-[10%] top-[-70px] size-[320px] text-violet-600" aria-hidden />
            <div className="glow-blob bottom-[-90px] right-[10%] size-[320px] text-fuchsia-600" aria-hidden />
            <div className="relative">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-violet-200 backdrop-blur">
                <MessageSquareText className="size-3.5" aria-hidden />
                {seatsLeft > 0 ? `Only ${seatsLeft} of 500 spots left` : "Waitlist open"}
              </p>
              <h2 id="final-cta-heading" className="mx-auto mt-5 max-w-2xl text-balance font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                60 minutes. One AI project.{" "}
                <span className="text-shimmer bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
                  Zero rupees.
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-slate-400">
                {total} students have already reserved their spot. The next one should be you — bring
                a friend and unlock rewards together.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="btn-shine h-12 w-full rounded-xl border border-violet-300/30 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-9 text-base font-semibold shadow-[0_0_48px_-8px] shadow-fuchsia-500/70 sm:w-auto"
                >
                  <Link href="/register">Reserve My Free Spot</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 w-full rounded-xl border-white/15 bg-white/[0.04] px-7 text-base text-slate-200 hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  <Link href="/leaderboard">
                    <Trophy className="size-4" aria-hidden />
                    View live leaderboard
                  </Link>
                </Button>
              </div>
              <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
                <li className="inline-flex items-center gap-1.5">
                  <CalendarClock className="size-3.5 text-violet-400" aria-hidden /> Free forever
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <Youtube className="size-3.5 text-fuchsia-400" aria-hidden /> Live on video
                </li>
                <li className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-emerald-400" aria-hidden /> Final-year engineering students only
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
