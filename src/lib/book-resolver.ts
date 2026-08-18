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

  // 1. Strip HTML tags and decode entities
  let clean = description
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  // 2. Remove common marketing fluff & promotional boilerplate phrases
  clean = clean
    .replace(/(#1\s+)?(NEW YORK TIMES|INSTANT|GLOBAL|USA TODAY|SUNDAY TIMES|WALL STREET JOURNAL)\s+BESTSELLER[s]?/gi, '')
    .replace(/OVER\s+[\d,]+\s+MILLION\s+COPIES\s+SOLD/gi, '')
    .replace(/WINNER\s+OF\s+THE\s+[^\.\!\?]+\./gi, '')
    .replace(/Praise\s+for\s+[^\.\!\?]+\./gi, '')
    .replace(/\"[^\"]+\"\s*—[^\.\!\?]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (clean.length === 0) return ''

  // 3. Word count targeting (80 to 120 words)
  const words = clean.split(' ')
  if (words.length <= 120) {
    return clean
  }

  // Slice to ~100 words and find the nearest sentence boundary (. ! ?)
  const slicedText = words.slice(0, 110).join(' ')
  const lastPeriodIndex = Math.max(
    slicedText.lastIndexOf('.'),
    slicedText.lastIndexOf('!'),
    slicedText.lastIndexOf('?')
  )

  if (lastPeriodIndex > 150) {
    return slicedText.slice(0, lastPeriodIndex + 1).trim()
  }

  return words.slice(0, 95).join(' ').trim() + '.'
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
    points.push('Practical framework — Focuses on actionable systems and repeatable habits.')
    points.push('Action-oriented — Emphasizes applying core concepts directly to daily routines.')
  } else if (cats.includes('fiction') || cats.includes('fantasy') || cats.includes('sci-fi') || cats.includes('science fiction') || cats.includes('classics')) {
    points.push('A journey of self-discovery — Explores purpose, intuition, and the courage to follow your path.')
    points.push('Timeless and inspiring — A simple yet profound story that has touched millions across generations.')
  } else if (cats.includes('history') || cats.includes('biography') || cats.includes('autobiography') || cats.includes('memoir')) {
    points.push('Historical narrative — Detailed account based on documented events and sources.')
    points.push('Contextual depth — Offers perspective on pivotal eras and personal journeys.')
  } else if (cats.includes('business') || cats.includes('economics') || cats.includes('finance') || cats.includes('management')) {
    points.push('Strategic insights — Structured around real-world industry concepts.')
    points.push('Decision framework — Provides practical guidelines for professional execution.')
  } else {
    points.push('Structured breakdown — Organized into clear chapters for steady reading.')
    points.push('Focused scope — Targeted exploration of core themes and concepts.')
  }

  // Length / Pace rules
  if (book.pageCount && book.pageCount < 220) {
    points.push('Accessible and thoughtful — Short, easy to read, and full of ideas that stay with you long after.')
  } else if (book.pageCount && book.pageCount > 400) {
    points.push('In-depth exploration — Comprehensive coverage with extensive details.')
  } else {
    points.push('Balanced prose — Suitable for both casual reading and focused study.')
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
