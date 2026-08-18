/**
 * Book Providers Orchestrator for True2Readers.
 */

import type { Book, SearchResponse } from '@/components/trueread/types'
import { GoogleBooksProvider } from './google-provider'
import { AppleBooksProvider } from './apple-provider'
import { OpenLibraryProvider } from './open-library-provider'
import { ISBNdbProvider } from './isbndb-provider'
import { extractOverview, generateWhyInterest } from '@/lib/book-resolver'

export const googleProvider = new GoogleBooksProvider()
export const appleProvider = new AppleBooksProvider()
export const openLibraryProvider = new OpenLibraryProvider()
export const isbndbProvider = new ISBNdbProvider()

/**
 * Fast search execution:
 * 1. Tries Google Books Provider
 * 2. On 429 / HTTP failure, transparently falls back to Apple Books Provider
 * Returns fast normalized search results without delaying search with bulk 3rd-party enrichment.
 */
export async function executeFastSearch(
  query: string,
  startIndex: number = 0,
  maxResults: number = 24
): Promise<SearchResponse> {
  let searchResult

  try {
    searchResult = await googleProvider.search(query, startIndex, maxResults)
  } catch (err) {
    console.warn('[executeFastSearch] Google Books Provider failed, trying Apple Books fallback...', err)
    searchResult = await appleProvider.search(query, startIndex, maxResults)
  }

  const results = searchResult.results.map((book) => {
    const overview = extractOverview(book.description)
    const whyInterest = generateWhyInterest(book)
    return {
      ...book,
      overview,
      whyInterest,
    }
  })

  let mode: 'title' | 'genre' = 'genre'
  let bestMatch: Book | null = null

  if (startIndex === 0 && results.length > 0) {
    const qLower = query.toLowerCase().trim()
    const firstTitleLower = results[0].title.toLowerCase().trim()
    if (qLower === firstTitleLower || firstTitleLower.includes(qLower)) {
      mode = 'title'
      bestMatch = results[0]
    }
  }

  return {
    query,
    mode,
    bestMatch,
    results,
    totalItems: searchResult.totalItems,
    startIndex,
    maxResults,
    source: searchResult.source,
  }
}

/**
 * On-demand enrichment for a single selected book.
 */
export async function enrichSelectedBook(book: Book): Promise<Book> {
  let enriched = await openLibraryProvider.enrich(book)
  if (isbndbProvider.isConfigured()) {
    enriched = await isbndbProvider.enrich(enriched)
  }
  return enriched
}
