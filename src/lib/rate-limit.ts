/**
 * Small in-memory sliding-window rate limiter.
 *
 * LIMITATION (by design, documented): state lives in the memory of one server
 * instance. On Vercel (many short-lived serverless instances) it slows down
 * bursts from one client but is not a hard global limit. For that, swap the
 * `store` for a shared store (e.g. Upstash Redis / Vercel KV) behind the same
 * `rateLimit()` signature.
 */
interface Entry {
  hits: number[]
  windowMs: number
}

const store = new Map<string, Entry>()
let calls = 0

function prune(now: number) {
  for (const [key, e] of store) {
    const newest = e.hits[e.hits.length - 1] ?? 0
    if (now - newest > e.windowMs) store.delete(key)
  }
}

export interface RateResult {
  ok: boolean
  /** Seconds until another attempt is allowed (0 when ok). */
  retryAfter: number
}

/** Allow at most `limit` hits per `windowMs` for `key`. Counts this call. */
export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now()
  if (++calls % 500 === 0 || store.size > 10_000) prune(now)

  const entry = store.get(key) ?? { hits: [], windowMs }
  entry.windowMs = windowMs
  entry.hits = entry.hits.filter((t) => now - t < windowMs)

  if (entry.hits.length >= limit) {
    store.set(key, entry)
    return { ok: false, retryAfter: Math.max(1, Math.ceil((entry.hits[0] + windowMs - now) / 1000)) }
  }
  entry.hits.push(now)
  store.set(key, entry)
  return { ok: true, retryAfter: 0 }
}
