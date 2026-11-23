/**
 * GET /api/books/search
 *
 * Route Handler (server-only by default — no `'use client'` / `'use server'`).
 *
 * Query params:
 *   q           (required) search query — title, author, genre, topic, …
 *   startIndex  (optional, default 0, clamped >= 0)
 *   maxResults  (optional, default 24, clamped 1..40)
 *
 * Returns a `SearchResponse` (see `@/components/trueread/types`).
 */

import type { SearchResponse } from '@/components/trueread/types'
import { executeFastSearch } from '@/lib/providers'
import { rateLimit } from '@/lib/rate-limit'
import { clientIp, tooMany } from '@/lib/http'

const MAX_QUERY_LENGTH = 200
// Each search fans out to Google/Apple, whose quotas are shared by all users.
const SEARCHES_PER_MINUTE = 60

// Help Next.js treat this as always-dynamic (query-driven). Optional but explicit.
export const dynamic = 'force-dynamic'

function parseIntParam(value: string | null, fallback: number): number {
  if (value === null || value === '') return fallback
  const n = Number.parseInt(value, 10)
  if (!Number.isFinite(n)) return fallback
  return n
}

export async function GET(request: Request): Promise<Response> {
  try {
    const gate = rateLimit(`search:${clientIp(request)}`, SEARCHES_PER_MINUTE, 60_000)
    if (!gate.ok) return tooMany(gate.retryAfter, 'Too many searches. Please slow down for a moment.')

    const url = new URL(request.url)
    const rawQ = url.searchParams.get('q')

    if (rawQ === null || rawQ.trim().length === 0) {
      return Response.json(
        { error: 'Missing query parameter "q"' },
        { status: 400 },
      )
    }

    const q = rawQ.trim()
    if (q.length > MAX_QUERY_LENGTH) {
      return Response.json(
        { error: `Query is too long (max ${MAX_QUERY_LENGTH} characters).` },
        { status: 400 },
      )
    }

    let startIndex = parseIntParam(url.searchParams.get('startIndex'), 0)
    if (startIndex < 0) startIndex = 0

    let maxResults = parseIntParam(url.searchParams.get('maxResults'), 24)
    if (maxResults < 1) maxResults = 1
    if (maxResults > 40) maxResults = 40

    const body = await executeFastSearch(q, startIndex, maxResults)

    return Response.json(body, {
      // Shared (CDN) cache for 5 minutes: identical searches are answered without calling
      // Google/Apple again (faster, and it protects their shared quota). Errors are not cached.
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err) {
    console.error('[/api/books/search]', err)
    // The cause is logged above; do not echo upstream/internal error text to clients.
    return Response.json({ error: 'Failed to fetch books' }, { status: 502 })
  }
}
