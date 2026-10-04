// ---------------------------------------------------------------------------
// College-name normalization — data hygiene for the campus competition views.
//
// The typeahead on /register channels students toward canonical spellings,
// but free-typed values still land ("CBIT Hyderabad", "vasavi college").
// This module fuzzy-matches a raw college string against the canonical index
// (distinct values already in the DB, most registrations first) so new rows
// merge into the same spelling the standings already rank.
//
// Matching strategy, in order of confidence:
//  1. Exact case-insensitive match.
//  2. Normalized match: lowercase, punctuation → spaces, whitespace collapsed
//     ("cbit  hyderabad!" and "CBIT Hyderabad" both → "cbit hyderabad").
//  3. Distinctive-token match: every "meaningful" token of the input (after
//     dropping generic words like college/engineering/institute and short
//     fragments) must appear in the canonical name's tokens, INCLUDING
//     parenthetical abbreviations ("Chaitanya Bharathi Institute of
//     Technology (CBIT)" registers "cbit" as a token).
//
// Anything else is kept as-typed (trimmed) — a confident guess is better than
// a wrong merge, and the admin "Clean college names" tool can sweep strays.
// ---------------------------------------------------------------------------

/** Generic words that never identify a college on their own. */
const STOPWORDS = new Set([
  "college",
  "engineering",
  "institute",
  "instituteof",
  "technology",
  "tech",
  "university",
  "of",
  "and",
  "the",
  "&",
  "hyderabad",
  "campus",
])

/** Lowercase, strip punctuation, collapse whitespace. */
export function normalizeCollegeKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Tokens of a canonical name, incl. parenthetical abbreviations like (CBIT). */
function canonicalTokens(name: string): Set<string> {
  const tokens = new Set<string>()
  const normalized = normalizeCollegeKey(name)
  for (const t of normalized.split(" ")) {
    if (t) tokens.add(t)
  }
  // Parenthetical aliases: "(CBIT)" → "cbit".
  for (const match of name.matchAll(/\(([^)]+)\)/g)) {
    for (const t of normalizeCollegeKey(match[1]).split(" ")) {
      if (t) tokens.add(t)
    }
  }
  return tokens
}

/** Input tokens that could actually identify a college (distinctive only). */
function distinctiveTokens(raw: string): string[] {
  return normalizeCollegeKey(raw)
    .split(" ")
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
}

export interface CollegeNormalizeResult {
  /** The cleaned value to store (canonical when merged, trimmed raw otherwise). */
  value: string
  /** True when the input was merged into an existing canonical spelling. */
  merged: boolean
  /** The canonical entry it merged into (when merged). */
  canonical?: string
}

/**
 * Fuzzy-match a raw college string against the canonical index.
 * @param raw free-typed college value (already trimmed by the caller)
 * @param index canonical spellings, MOST POPULAR FIRST (ties on merges
 *              resolve to the earliest = most-registered entry)
 */
export function canonicalizeCollege(raw: string, index: string[]): CollegeNormalizeResult {
  const trimmed = raw.trim()
  if (!trimmed || index.length === 0) return { value: trimmed, merged: false }

  const lower = trimmed.toLowerCase()

  // 1. Exact case-insensitive.
  const exact = index.find((c) => c.toLowerCase() === lower)
  if (exact) return { value: exact, merged: exact !== trimmed }

  // 2. Normalized (punctuation/whitespace-insensitive).
  const normalizedInput = normalizeCollegeKey(trimmed)
  if (!normalizedInput) return { value: trimmed, merged: false }
  const normalized = index.find((c) => normalizeCollegeKey(c) === normalizedInput)
  if (normalized) return { value: normalized, merged: normalized !== trimmed }

  // 3. Distinctive-token containment (e.g. "CBIT Hyderabad" → "(CBIT)" entry).
  const inputTokens = distinctiveTokens(trimmed)
  if (inputTokens.length === 0) return { value: trimmed, merged: false }
  for (const candidate of index) {
    const tokens = canonicalTokens(candidate)
    if (inputTokens.every((t) => tokens.has(t))) {
      return { value: candidate, merged: candidate !== trimmed }
    }
  }

  return { value: trimmed, merged: false }
}
