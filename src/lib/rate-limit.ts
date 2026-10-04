// ---------------------------------------------------------------------------
// In-memory sliding-window rate limiter.
// Deliberately simple: per-process Map + periodic cleanup. Good enough to
// blunt abuse on a single-node deployment (and for the demo environment);
// swap for Redis/Upstash when running multi-instance.
// ---------------------------------------------------------------------------

interface Bucket {
  timestamps: number[]
}

const buckets = new Map<string, Bucket>()

// Periodically drop stale buckets so the Map doesn't grow unbounded.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let lastCleanup = Date.now()

function maybeCleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, bucket] of buckets) {
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs)
    if (bucket.timestamps.length === 0) buckets.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * Check (and record) a hit against `key`. Sliding window: keeps timestamps of
 * previous hits inside `windowMs` and allows at most `limit` of them.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  maybeCleanup(windowMs)

  const now = Date.now()
  const bucket = buckets.get(key) ?? { timestamps: [] }
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs)

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0]
    const retryAfterSeconds = Math.max(Math.ceil((oldest + windowMs - now) / 1000), 1)
    buckets.set(key, bucket)
    return { allowed: false, remaining: 0, retryAfterSeconds }
  }

  bucket.timestamps.push(now)
  buckets.set(key, bucket)

  return {
    allowed: true,
    remaining: Math.max(limit - bucket.timestamps.length, 0),
    retryAfterSeconds: 0,
  }
}

/**
 * Best-effort client identity for rate limiting: X-Forwarded-For chain first
 * hop, then X-Real-IP, then a stable fallback (dev / same-origin proxy).
 */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for")
  if (fwd) {
    const first = fwd.split(",")[0]?.trim()
    if (first) return first
  }
  return headers.get("x-real-ip")?.trim() || "unknown"
}
