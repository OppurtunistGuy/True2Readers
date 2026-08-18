/**
 * Open Library Provider Implementation for On-Demand Secondary Metadata Enrichment.
 */

import type { Book } from '@/components/trueread/types'
import type { IBookProvider, ProviderSearchResult } from './types'

export class OpenLibraryProvider implements IBookProvider {
  name = 'openlibrary' as const

  isConfigured(): boolean {
    return true
  }

  async search(): Promise<ProviderSearchResult> {
    // Open Library is not used for primary search to maintain fast search performance
    return { results: [], totalItems: 0, source: 'openlibrary' }
  }

  /**
   * On-demand enrichment for a single selected book via ISBN.
   */
  async enrich(book: Book): Promise<Book> {
    const targetIsbn = book.isbn13 || book.isbn10 || book.isbn
    if (!targetIsbn) return book

    const cleanIsbn = targetIsbn.replace(/[^0-9X]/gi, '')
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 1800)

      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)

      if (!res.ok) return book

      const json = await res.json()
      const olData = json[`ISBN:${cleanIsbn}`]

      if (!olData) return book

      const enriched: Book = { ...book }

      if (olData.url) {
        enriched.openLibraryUrl = olData.url
      }

      if (olData.number_of_pages && (!enriched.pageCount || enriched.pageCount === 0)) {
        enriched.pageCount = olData.number_of_pages
      }

      if (olData.subjects && Array.isArray(olData.subjects) && olData.subjects.length > 0) {
        const extraCategories = olData.subjects.slice(0, 3).map((s: { name: string }) => s.name)
        if (!enriched.categories || enriched.categories.length === 0) {
          enriched.categories = extraCategories
        }
      }

      if (olData.notes && typeof olData.notes === 'string' && !enriched.description) {
        enriched.description = olData.notes
        enriched.descriptionSource = 'openlibrary'
      }

      enriched.enrichmentStatus = 'complete'
      enriched.isEnriched = true

      return enriched
    } catch {
      return book
    }
  }
}
