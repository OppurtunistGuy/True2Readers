/**
 * Multi-Source Book Resolver & Normalization Engine for True2Readers.
 *
 * Data Architecture:
 * 1. Primary Search / Metadata: Google Books API
 * 2. Fallback Search / Metadata: Apple Books / iTunes Search API (on HTTP 429)
 * 3. Secondary Enrichment: Open Library API & ISBN normalization
 * 4. Factual Synthesis: Generates "Why it may interest you" highlights strictly from metadata
 */

import type { Book, SearchResponse } from '@/components/trueread/types'
import { searchBooksWithFallback } from '@/lib/google-books'

interface OpenLibraryBookData {
  url?: string
  title?: string
  subjects?: Array<{ name: string; url?: string }>
  notes?: string
  number_of_pages?: number
  publish_date?: string
}

/**
 * Normalize ISBN strings into ISBN-10 and ISBN-13 formats.
 */

export function normalizeIsbns(rawIsbn?: string): { isbn10?: string; isbn13?: string } {
  if (!rawIsbn) return {}
  const cleaned = rawIsbn.replace(/[^0-9X]/gi, '').toUpperCase()
  if (cleaned.length === 13) {
    return { isbn13: cleaned }
  }
  if (cleaned.length === 10) {
    return { isbn10: cleaned }
  }
  return { isbn13: cleaned }
}

/**
 * Process raw volume descriptions into a concise, neutral 80–120 word overview.
 * Strips promotional fluff, sales statistics, review quotes, and bestseller claims.
 */
export function extractOverview(description?: string): string {
  if (!description || description.trim().length === 0) {
    return ''
  }

  // 1. Strip HTML tags and decode HTML entities (including &#xa0; / &nbsp;)
  let clean = description
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&#xa0;/gi, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')

  // 2. Remove common marketing fluff & promotional call-to-action boilerplate
  clean = clean
    .replace(/(#1\s+)?(NEW YORK TIMES|INSTANT|GLOBAL|USA TODAY|SUNDAY TIMES|WALL STREET JOURNAL)\s+BESTSELLER[.\!\?]?/gi, '')
    .replace(/OVER\s+[\d,]+\s+MILLION\s+COPIES\s+SOLD[.\!\?]?/gi, '')
    .replace(/TRANSLATED\s+INTO\s+\d+\+\s+LANGUAGES[.\!\?]?/gi, '')
    .replace(/An\s+addicting[^\.\!\?]+read,?\s*/gi, '')
    .replace(/see\s+why\s+fans\s+of[^\.\!\?]+\s*/gi, '')
    .replace(/Get\s+lost\s+in[^\.\!\?]+\./gi, '')
    .replace(/Are\s+you\s+ready\?[^\.\!\?]*$/gi, '')
    .replace(/Scroll\s+up\s+to\s+click[^\.\!\?]*$/gi, '')
    .replace(/WINNER\s+OF\s+THE\s+[^\.\!\?]+\./gi, '')
    .replace(/Praise\s+for\s+[^\.\!\?]+\./gi, '')
    .replace(/\"[^\"]+\"\s*—[^\.\!\?]+/g, '')
    .replace(/^[.\s!?,:;]+/, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (clean.length === 0) return ''

  // 3. Word count targeting for a concise 3–4 line summary (max 55 words)
  const words = clean.split(' ')
  if (words.length <= 55) {
    return clean
  }

  // Slice to ~50 words and find the nearest sentence boundary (. ! ?)
  const slicedText = words.slice(0, 52).join(' ')
  const lastPeriodIndex = Math.max(
    slicedText.lastIndexOf('.'),
    slicedText.lastIndexOf('!'),
    slicedText.lastIndexOf('?')
  )

  if (lastPeriodIndex > 100) {
    return slicedText.slice(0, lastPeriodIndex + 1).trim()
  }

  return words.slice(0, 48).join(' ').trim() + '...'
}

/**
 * Synthesize 3 concise, factual reasons for "Why it may interest you"
 * strictly based on normalized book metadata (category, page count, era).
 * Explains meaningful aspects of the reading experience.
 */
export function generateWhyInterest(book: Book): string[] {
  const points: string[] = []
  const cats = (book.categories ?? []).map((c) => c.toLowerCase()).join(' ')

  // Category / Theme rules
  if (cats.includes('self-help') || cats.includes('personal development') || cats.includes('psychology')) {
    points.push('Practical framework — focuses on actionable systems and repeatable habits.')
    points.push('Action-oriented — emphasizes applying core concepts directly to daily routines.')
  } else if (cats.includes('fiction') || cats.includes('fantasy') || cats.includes('sci-fi') || cats.includes('science fiction')) {
    points.push('Immersive world-building — narrative driven by rich atmospheric settings.')
    points.push('Character-driven — explores complex motivations and internal conflicts.')
  } else if (cats.includes('history') || cats.includes('biography') || cats.includes('autobiography') || cats.includes('memoir')) {
    points.push('Historical narrative — detailed account based on documented events and sources.')
    points.push('Contextual depth — offers perspective on pivotal eras and personal journeys.')
  } else if (cats.includes('business') || cats.includes('economics') || cats.includes('finance') || cats.includes('management')) {
    points.push('Strategic insights — structured around real-world industry concepts.')
    points.push('Decision framework — provides practical guidelines for professional execution.')
  } else {
    points.push('Structured breakdown — organized into clear chapters for steady reading.')
    points.push('Focused scope — targeted exploration of core themes and concepts.')
  }

  // Length / Pace rules
  if (book.pageCount && book.pageCount < 220) {
    points.push('Accessible format — concise volume designed for fast completion in 1–2 sittings.')
  } else if (book.pageCount && book.pageCount > 400) {
    points.push('In-depth exploration — comprehensive coverage with extensive details.')
  } else {
    points.push('Balanced prose — suitable for both casual reading and focused study.')
  }

  return points.slice(0, 3)
}

/**
 * Optionally enrich a book with Open Library metadata if an ISBN is present.
 * Uses a short 1.5s timeout so search response latency remains fast.
 */
async function enrichFromOpenLibrary(book: Book): Promise<Book> {
  const isbn = book.isbn || book.isbn13 || book.isbn10
  if (!isbn) return book

  const cleanIsbn = isbn.replace(/[^0-9X]/gi, '')
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1500)

    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)

    if (!res.ok) return book

    const json = await res.json()
    const key = `ISBN:${cleanIsbn}`
    const olData: OpenLibraryBookData | undefined = json[key]

    if (!olData) return book

    const enriched: Book = { ...book }
    if (olData.url) {
      enriched.openLibraryUrl = olData.url
    }
    if (olData.number_of_pages && (!enriched.pageCount || enriched.pageCount === 0)) {
      enriched.pageCount = olData.number_of_pages
    }
    if (olData.subjects && olData.subjects.length > 0 && (!enriched.categories || enriched.categories.length === 0)) {
      enriched.categories = olData.subjects.slice(0, 3).map((s) => s.name)
    }
    enriched.isEnriched = true
    return enriched
  } catch {
    return book
  }
}

/**
 * Normalize and enrich a list of books.
 */
export async function normalizeAndEnrichBooks(books: Book[]): Promise<Book[]> {
  return Promise.all(
    books.map(async (book) => {
      const isbns = normalizeIsbns(book.isbn)
      const overview = extractOverview(book.description)

      let baseBook: Book = {
        ...book,
        isbn10: isbns.isbn10 || (book.isbn && book.isbn.length === 10 ? book.isbn : undefined),
        isbn13: isbns.isbn13 || (book.isbn && book.isbn.length === 13 ? book.isbn : undefined),
        overview,
      }

      baseBook.whyInterest = generateWhyInterest(baseBook)

      return enrichFromOpenLibrary(baseBook)
    })
  )
}

/**
 * Main entrance point for searching and resolving books across all sources.
 */
export async function searchAndResolveBooks(
  query: string,
  startIndex: number = 0,
  maxResults: number = 24
): Promise<SearchResponse> {
  const { results, totalItems, source } = await searchBooksWithFallback(query, startIndex, maxResults)

  const normalizedResults = await normalizeAndEnrichBooks(results)

  let mode: 'title' | 'genre' = 'genre'
  let bestMatch: Book | null = null

  if (startIndex === 0 && normalizedResults.length > 0) {
    bestMatch = normalizedResults[0]
  }

  return {
    query,
    mode,
    bestMatch,
    results: normalizedResults,
    totalItems,
    startIndex,
    maxResults,
    source,
  }
}
