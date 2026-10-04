import type { Metadata } from "next"
import { Navbar } from "@/components/site/navbar"
import { Footer } from "@/components/site/footer"
import { RegistrationForm } from "@/components/register/registration-form"
import { getReferralInfo } from "@/lib/referral-info"
import { getPublicStats } from "@/lib/stats"
import { SOURCES, SourceKey } from "@/lib/constants"
import { parseShareVariant } from "@/lib/share-variants"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Register — Reserve Your Free Spot",
  description:
    "Reserve your free spot for 'Build Your First AI Project in 60 Minutes'. 30-second registration for final-year engineering students.",
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams

  const first = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined)
  const refCode = first(sp.ref) ?? first(sp.referral) ?? ""
  const rawSource = first(sp.source)
  const sourceCode = first(sp.code) ?? first(sp.utm_code) ?? null
  const utmSource = first(sp.utm_source)

  const initialSource =
    rawSource && (SOURCES as readonly string[]).includes(rawSource) ? (rawSource as SourceKey) : undefined
  const shareVariant = parseShareVariant(first(sp.v))

  const [referral, stats] = await Promise.all([
    refCode ? getReferralInfo(refCode) : Promise.resolve(null),
    getPublicStats(),
  ])

  return (
    <>
      <Navbar />
      <main id="main-content" className="relative flex-1 overflow-hidden">
        <div className="glow-blob left-[-120px] top-[-60px] size-[380px] text-violet-600" aria-hidden />
        <div className="glow-blob right-[-140px] top-[220px] size-[340px] text-fuchsia-600" aria-hidden />
        <RegistrationForm
          stats={stats}
          refCode={refCode}
          initialSource={initialSource}
          initialSourceCode={sourceCode ?? utmSource ?? null}
          referrer={referral?.valid ? referral.referrer ?? null : null}
          shareVariant={shareVariant}
        />
      </main>
      <Footer />
    </>
  )
}
