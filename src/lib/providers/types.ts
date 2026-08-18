/**
 * Provider Architecture Contracts for True2Readers.
 */

import type { Book } from '@/components/trueread/types'

export type ProviderName = 'google' | 'apple' | 'openlibrary' | 'isbndb'

export interface ProviderSearchResult {
  results: Book[]
  totalItems: number
  source: ProviderName
}

export interface IBookProvider {
  name: ProviderName
  isConfigured(): boolean
  search(query: string, startIndex?: number, maxResults?: number): Promise<ProviderSearchResult>
  enrich?(book: Book): Promise<Book>
}
