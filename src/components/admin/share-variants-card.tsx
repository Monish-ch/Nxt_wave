"use client"

import { FlaskConical, Trophy, Info, Sigma, Hourglass, PauseCircle, Equal } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { AdminStats } from "@/lib/stats"
import { pairwiseABTest, chiSquareGOF, AB_MIN_PAIR_SAMPLE, AB_MIN_TRI_SAMPLE, AB_MIN_PAUSE_ARM } from "@/lib/ab-test"
import { cn } from "@/lib/utils"

/**
 * Invite-message A/B test — aggregates registrations by the share-message
 * style that landed them (?v= tag set by students on the success dashboard).
 * Shows which copy actually converts friends into signups, with a
 * two-proportion z-test guardrail so small samples aren't over-read.
 */
export function ShareVariantsCard({ stats }: { stats: AdminStats }) {
  const { shareVariants: variants, shareVariantUnknown } = stats
  const total = variants.reduce((acc, v) => acc + v.registrations, 0)
  const winner = variants.find((v) => v.isWinner)
  const runnerUp = variants.find((v) => !v.isWinner)
  const lift =
    winner && runnerUp && runnerUp.registrations > 0
      ? Math.round(((winner.registrations - runnerUp.registrations) / runnerUp.registrations) * 100)
      : null

  // Head-to-head significance: leading variant vs runner-up, with guardrail.
  const abTest =
    winner && runnerUp
      ? pairwiseABTest(winner.registrations, runnerUp.registrations)
      : null

  // 3-way read: chi-square goodness-of-fit across EVERY live style at once.
  // Answers "is there a real overall preference, or are the styles tied?"
  // and only then suggests pausing the last-place style.
  const triTest = variants.length >= 2 ? chiSquareGOF(variants.map((v) => v.registrations)) : null
  const lastPlace = variants.length >= 2 ? variants[variants.length - 1] : null
  const lastPlaceIsSmall = lastPlace !== null && lastPlace.registrations < AB_MIN_PAUSE_ARM

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="share-variants-heading"
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="share-variants-heading" className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
            <FlaskConical className="size-4 text-fuchsia-500" aria-hidden />
            Invite message A/B test
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Students pick a share style on their dashboard — the winner shows which copy converts friends
          </p>
        </div>
        {winner && (
          <div className="flex flex-col items-end gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
              <Trophy className="size-3.5 text-amber-500" aria-hidden />
              {winner.label} leads{lift !== null && lift > 0 ? ` · +${lift}% vs next` : ""}
            </span>
            {abTest &&
              (abTest.verdict === "significant" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  <Sigma className="size-3" aria-hidden />
                  Statistically significant · p ≈ {abTest.pValue.toFixed(2)}
                </span>
              ) : abTest.verdict === "suggestive" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                  <Sigma className="size-3" aria-hidden />
                  Lead could be chance · p ≈ {abTest.pValue.toFixed(2)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                  <Hourglass className="size-3" aria-hidden />
                  Too early to call · {abTest.pairTotal}/{AB_MIN_PAIR_SAMPLE} paired signups
                </span>
              ))}
          </div>
        )}
      </header>

      {variants.length === 0 ? (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
          No variant-tagged referrals yet. When students share from their dashboard, the style they pick
          (&ldquo;friendly&rdquo;, &ldquo;achievement&rdquo; or &ldquo;urgent&rdquo;) is tracked here.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {variants.map((v) => (
            <div
              key={v.variant}
              className={cn(
                "relative overflow-hidden rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm",
                v.isWinner
                  ? "border-amber-200 bg-gradient-to-br from-amber-50/80 to-white"
                  : "border-slate-200 bg-white",
              )}
            >
              {v.isWinner && (
                <Trophy
                  className="absolute right-3 top-3 size-4 text-amber-400"
                  aria-label="Leading variant"
                />
              )}
              <p className="text-lg" aria-hidden>
                {v.emoji}
              </p>
              <p className="mt-1 text-sm font-bold capitalize text-slate-800">{v.label}</p>
              <p className="mt-2 text-2xl font-extrabold tabular-nums text-slate-900">
                {v.registrations}
                <span className="ml-1 text-xs font-semibold text-slate-400">signups</span>
              </p>
              <Progress
                value={total > 0 ? (v.registrations / total) * 100 : 0}
                className={cn("mt-2 h-2", v.isWinner && "[&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-400")}
                aria-label={`${v.percent}% of tagged referrals used the ${v.label} style`}
              />
              <p className="mt-1.5 text-[11px] font-medium text-slate-500">
                {v.percent}% of tagged referrals
              </p>
            </div>
          ))}
        </div>
      )}

      {shareVariantUnknown > 0 && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-slate-400">
          <Info className="size-3" aria-hidden />
          {shareVariantUnknown} referred signup{shareVariantUnknown === 1 ? "" : "s"} arrived through untagged
          links (old shares, QR posters, manual codes) and sit outside the test.
        </p>
      )}

      {/* 3-way chi-square verdict — the honest "should we retire a style?" read */}
      {triTest && variants.length >= 2 && (
        <div
          className={cn(
            "mt-4 flex flex-col gap-2.5 rounded-xl border p-3.5 sm:flex-row sm:items-center sm:gap-x-3 sm:gap-y-2",
            triTest.verdict === "significant"
              ? "border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-teal-50/40"
              : triTest.verdict === "suggestive"
                ? "border-slate-200 bg-slate-50/70"
                : "border-amber-200 bg-amber-50/60",
          )}
          role="status"
          aria-label="Three-way style test verdict"
        >
          {triTest.verdict === "significant" ? (
            <PauseCircle className="size-4 shrink-0 text-emerald-600" aria-hidden />
          ) : triTest.verdict === "suggestive" ? (
            <Equal className="size-4 shrink-0 text-slate-400" aria-hidden />
          ) : (
            <Hourglass className="size-4 shrink-0 text-amber-500" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            {triTest.verdict === "significant" ? (
              <p className="text-xs font-bold text-emerald-800">
                Style preference is real — consider pausing “{lastPlace?.label}”
                {lastPlace ? (
                  <span className="ml-1 font-semibold text-emerald-700">
                    ({lastPlace.registrations} signup{lastPlace.registrations === 1 ? "" : "s"}, last place)
                  </span>
                ) : null}
              </p>
            ) : triTest.verdict === "suggestive" ? (
              <p className="text-xs font-semibold text-slate-600">
                No meaningful style split yet — keep all {variants.length} styles live
              </p>
            ) : (
              <p className="text-xs font-semibold text-amber-800">
                Too early for a three-way call · {triTest.total}/{AB_MIN_TRI_SAMPLE} tagged signups
              </p>
            )}
            {triTest.verdict === "significant" && lastPlaceIsSmall && (
              <p className="mt-0.5 text-[11px] text-emerald-700/80">
                Caveat: last place has fewer than {AB_MIN_PAUSE_ARM} signups — give it a little more
                traffic before switching it off.
              </p>
            )}
          </div>
          <span
            className="rounded-md bg-white/80 px-2 py-1 font-mono text-[11px] font-bold text-slate-600 ring-1 ring-slate-200"
            title="Chi-square goodness-of-fit across all styles · H0: equal preference"
          >
            χ²({triTest.df}) = {triTest.chiSquare.toFixed(2)} · p ≈ {triTest.pValue.toFixed(2)}
          </span>
        </div>
      )}

      {variants.length > 1 && (
        <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
          Significance = two-proportion z-test, leader vs runner-up (p = 0.5 under “no preference”),
          plus a chi-square read across all styles together. Guardrail: wait for ≥30 tagged signups
          in the pair (≥{AB_MIN_TRI_SAMPLE} overall) before pausing a losing style — earlier gaps are
          usually noise.
        </p>
      )}
    </section>
  )
}
