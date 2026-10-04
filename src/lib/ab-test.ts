// ---------------------------------------------------------------------------
// A/B test guardrails — tiny stats kit so raw variant counts aren't over-read.
// Two complementary reads:
//   1. Pairwise two-proportion z-test (leader vs runner-up, H0 p = 0.5).
//   2. Chi-square goodness-of-fit across ALL live styles (H0 = equal
//      preference), so a decisive overall split can be distinguished from
//      three styles that are effectively tied.
// Both are gated behind minimum-sample guardrails.
// Pure functions — no DB, safe to use client-side.
// ---------------------------------------------------------------------------

/** Tagged signups needed in the head-to-head pair before calling a winner. */
export const AB_MIN_PAIR_SAMPLE = 30

/** Tagged signups across all arms before a 3-way chi-square verdict is shown. */
export const AB_MIN_TRI_SAMPLE = 45
/** Smallest per-arm count below which "pause the loser" advice gets a caveat. */
export const AB_MIN_PAUSE_ARM = 10

export type ABVerdict = "significant" | "suggestive" | "underpowered"

export interface ABTestResult {
  winnerCount: number
  runnerUpCount: number
  pairTotal: number
  /** Winner's share of the head-to-head pair, percent. */
  winnerShare: number
  z: number
  pValue: number
  /** p < 0.05 and the guardrail sample is met. */
  significant: boolean
  minSampleMet: boolean
  verdict: ABVerdict
}

/**
 * Standard normal CDF via the Zelen & Severo rational approximation
 * (absolute error < 7.5e-8) — plenty for a p-value readout at 2 decimals.
 */
function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1
  const az = Math.abs(z) / Math.SQRT2
  // Erf approximation (Abramowitz & Stegun 7.1.26)
  const t = 1 / (1 + 0.3275911 * az)
  const erf =
    1 -
    (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-az * az)
  return 0.5 * (1 + sign * erf)
}

/**
 * Two-proportion z-test for a head-to-head preference between two variants.
 * `a`/`b` are the signup counts for each arm; under H0 each head-to-head
 * signup picks either arm with p = 0.5.
 */
export function pairwiseABTest(a: number, b: number, minSample = AB_MIN_PAIR_SAMPLE): ABTestResult {
  const pairTotal = a + b
  const winnerShare = pairTotal > 0 ? (a / pairTotal) * 100 : 0
  const minSampleMet = pairTotal >= minSample

  if (pairTotal === 0 || a === b) {
    return {
      winnerCount: a,
      runnerUpCount: b,
      pairTotal,
      winnerShare,
      z: 0,
      pValue: 1,
      significant: false,
      minSampleMet,
      verdict: minSampleMet ? "suggestive" : "underpowered",
    }
  }

  const pHat = a / pairTotal
  const se = Math.sqrt((0.5 * (1 - 0.5)) / pairTotal) // pooled SE under H0 p=0.5
  const z = (pHat - 0.5) / se
  const pValue = Math.max(2 * (1 - normalCdf(Math.abs(z))), 0.0001)
  const significant = minSampleMet && pValue < 0.05

  return {
    winnerCount: a,
    runnerUpCount: b,
    pairTotal,
    winnerShare: Math.round(winnerShare * 10) / 10,
    z: Math.round(z * 100) / 100,
    pValue: Math.round(pValue * 1000) / 1000,
    significant,
    minSampleMet,
    verdict: significant ? "significant" : minSampleMet ? "suggestive" : "underpowered",
  }
}

// ---------------------------------------------------------------------------
// Chi-square goodness-of-fit — the "all three styles at once" read.
// H0: every live style is equally preferred. p = Q(df/2, χ²/2) where Q is the
// regularized upper incomplete gamma function (Numerical Recipes gammq:
// series + modified Lentz continued fraction, ~1e-10 precision).
// ---------------------------------------------------------------------------

export interface TriABResult {
  counts: number[]
  total: number
  chiSquare: number
  df: number
  pValue: number
  significant: boolean
  minSampleMet: boolean
  verdict: ABVerdict
}

/** log Γ(x) via the Lanczos approximation (g=7, n=9 coefficients). */
function logGamma(x: number): number {
  const coeffs = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ]
  if (x < 0.5) {
    // Reflection formula for small x (not hit for df≥1 but kept for safety).
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x)
  }
  const z = x - 1
  let a = coeffs[0]
  const t = z + 7.5
  for (let i = 1; i < coeffs.length; i++) a += coeffs[i] / (z + i)
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a)
}

/** Lower incomplete gamma P(a, x) via Lentz series (x < a + 1). */
function gammaSeries(a: number, x: number): number {
  let ap = a
  let sum = 1 / a
  let del = sum
  for (let n = 1; n <= 300; n++) {
    ap += 1
    del *= x / ap
    sum += del
    if (Math.abs(del) < Math.abs(sum) * 1e-12) break
  }
  return sum * Math.exp(-x + a * Math.log(x) - logGamma(a))
}

/** Upper incomplete gamma Q(a, x) via modified Lentz continued fraction. */
function gammaContinuedFraction(a: number, x: number): number {
  const FPMIN = 1e-300
  let b = x + 1 - a
  let c = 1 / FPMIN
  let d = 1 / b
  let h = d
  for (let i = 1; i <= 300; i++) {
    const an = -i * (i - a)
    b += 2
    d = an * d + b
    if (Math.abs(d) < FPMIN) d = FPMIN
    c = b + an / c
    if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < 1e-12) break
  }
  return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h
}

/** Chi-square survival function p = Q(df/2, χ²/2). */
function chiSquarePValue(chi2: number, df: number): number {
  if (chi2 <= 0 || df <= 0) return 1
  const a = df / 2
  const x = chi2 / 2
  const q = x < a + 1 ? 1 - gammaSeries(a, x) : gammaContinuedFraction(a, x)
  return Math.min(Math.max(q, 0), 1)
}

/**
 * Chi-square goodness-of-fit across ALL style arms (equal preference under
 * H0). Returns null-shaped verdicts through `verdict` when underpowered —
 * callers decide how to phrase it.
 */
export function chiSquareGOF(counts: number[], minSample = AB_MIN_TRI_SAMPLE): TriABResult {
  const total = counts.reduce((acc, c) => acc + c, 0)
  const k = counts.length
  const minSampleMet = total >= minSample

  if (k < 2 || total === 0) {
    return { counts, total, chiSquare: 0, df: Math.max(k - 1, 0), pValue: 1, significant: false, minSampleMet, verdict: "underpowered" }
  }

  const expected = total / k
  const chi2 = counts.reduce((acc, o) => acc + ((o - expected) ** 2) / expected, 0)
  const df = k - 1
  const p = chiSquarePValue(chi2, df)
  const significant = minSampleMet && p < 0.05

  return {
    counts,
    total,
    chiSquare: Math.round(chi2 * 100) / 100,
    df,
    pValue: Math.max(Math.round(p * 1000) / 1000, 0.001),
    significant,
    minSampleMet,
    verdict: significant ? "significant" : minSampleMet ? "suggestive" : "underpowered",
  }
}
