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

import type { SearchResponse, Book } from '@/components/trueread/types'
import { searchBooksWithFallback, decideMode } from '@/lib/google-books'

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
    const url = new URL(request.url)
    const rawQ = url.searchParams.get('q')

    if (rawQ === null || rawQ.trim().length === 0) {
      return Response.json(
        { error: 'Missing query parameter "q"' },
        { status: 400 },
      )
    }

    const q = rawQ.trim()

    let startIndex = parseIntParam(url.searchParams.get('startIndex'), 0)
    if (startIndex < 0) startIndex = 0

    let maxResults = parseIntParam(url.searchParams.get('maxResults'), 24)
    if (maxResults < 1) maxResults = 1
    if (maxResults > 40) maxResults = 40

    const { results, totalItems, source } = await searchBooksWithFallback(
      q,
      startIndex,
      maxResults,
    )

    let mode: 'title' | 'genre' = 'genre'
    let bestMatch: Book | null = null

    if (startIndex === 0) {
      const decision = decideMode(q, results)
      mode = decision.mode
      bestMatch = decision.bestMatch
    }
    // Pagination (startIndex > 0) always shows the grid.

    const body: SearchResponse = {
      query: q,
      mode,
      bestMatch,
      results,
      totalItems,
      startIndex,
      maxResults,
      source,
    }

    return Response.json(body, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('[/api/books/search]', err)
    return Response.json(
      {
        error: 'Failed to fetch books',
        detail: String((err as { message?: unknown })?.message ?? err),
      },
      { status: 502 },
    )
  }
}
