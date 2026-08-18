import { NextResponse } from 'next/server'
import { enrichSelectedBook } from '@/lib/providers'
import type { Book } from '@/components/trueread/types'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { book } = body as { book: Book }

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
