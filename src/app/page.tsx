import { Navbar } from "@/components/site/navbar"
import { Footer } from "@/components/site/footer"
import { Hero } from "@/components/landing/hero"
import {
  WhySection,
  BuildSection,
  WhoSection,
  HowItWorksSection,
  ReferralSection,
  FaqSection,
  FinalCtaSection,
} from "@/components/landing/sections"
import { Backdrop } from "@/components/landing/backdrop"
import { ScrollProgress } from "@/components/landing/scroll-progress"
import { LiveTicker } from "@/components/landing/ticker"
import { getPublicStats } from "@/lib/stats"
import { db } from "@/lib/db"

// Live numbers on every visit — metrics are computed from the registration DB.
export const dynamic = "force-dynamic"

export default async function LandingPage() {
  const [stats, latest] = await Promise.all([
    getPublicStats(),
    db.registration.findMany({
      orderBy: { createdAt: "desc" },
      take: 14,
      select: { fullName: true, college: true, createdAt: true },
    }),
  ])

  return (
    <>
      <Backdrop />
      <ScrollProgress />
      <Navbar />
      <main id="main-content" className="flex-1">
        <Hero stats={stats} />
        <LiveTicker registrations={latest} />
        <WhySection />
        <BuildSection />
        <WhoSection />
        <HowItWorksSection />
        <ReferralSection />
        <FaqSection />
        <FinalCtaSection seatsLeft={stats.seatsLeft} total={stats.totalRegistrations} />
      </main>
      <Footer />
    </>
  )
}
