import { NextResponse } from 'next/server'
import { enrichSelectedBook } from '@/lib/providers'
import type { Book } from '@/components/trueread/types'
import { rateLimit } from '@/lib/rate-limit'
import { clientIp, readJson, tooMany } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    // Triggers an outbound Open Library request, so limit it like search.
    const gate = rateLimit(`enrich:${clientIp(req)}`, 60, 60_000)
    if (!gate.ok) return tooMany(gate.retryAfter)

    const parsed = await readJson(req, 100_000)
    if (!parsed.ok) return parsed.res
    const { book } = (parsed.data ?? {}) as { book: Book }

    if (!book || !book.id) {
      return NextResponse.json({ error: 'Book object with id is required.' }, { status: 400 })
    }

    const enrichedBook = await enrichSelectedBook(book)
    return NextResponse.json({ book: enrichedBook })
  } catch (error) {
    console.error('[/api/books/[id]/enrich] error:', error)
    return NextResponse.json({ error: 'Enrichment failed' }, { status: 500 })
  }
}
