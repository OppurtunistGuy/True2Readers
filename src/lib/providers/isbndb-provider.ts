/**
 * ISBNdb Provider Adapter Interface (Prepared for future credentials).
 */

import type { Book } from '@/components/trueread/types'
import type { IBookProvider, ProviderSearchResult } from './types'

export class ISBNdbProvider implements IBookProvider {
  name = 'isbndb' as const

  private apiKey = process.env.ISBNDB_API_KEY || ''

  isConfigured(): boolean {
    return this.apiKey.trim().length > 0
  }

  async search(): Promise<ProviderSearchResult> {
    if (!this.isConfigured()) {
      return { results: [], totalItems: 0, source: 'isbndb' }
    }
    // Future ISBNdb search implementation
    return { results: [], totalItems: 0, source: 'isbndb' }
  }

  async enrich(book: Book): Promise<Book> {
    if (!this.isConfigured()) {
      return book
    }
    // Future ISBNdb enrichment implementation when credentials are set
    return book
  }
}
