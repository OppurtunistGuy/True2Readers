// Shared types for True2Readers — the single source of truth for the API contract.

export interface Book {
  /** Volume / product id */
  id: string
  /** Primary title (untruncated) */
  title: string
  /** Subtitle (secondary subtitle text) */
  subtitle?: string
  authors: string[]
  /** 4-digit year extracted from publishedDate, or null if unknown */
  year: string | null
  /** https cover image URL, or undefined if no cover available */
  cover?: string
  /** Full book description */
  description?: string
  /** Google Books searchInfo.textSnippet — real excerpt text. May contain <em>...</em> highlight tags. */
  previewSnippet?: string
  /** Google Books preview link (reader URL) */
  previewLink?: string
  categories?: string[]
  publisher?: string
  pageCount?: number | null
  /** Legacy primary ISBN string */
  isbn?: string
  /** Normalized ISBN-10 */
  isbn10?: string
  /** Normalized ISBN-13 */
  isbn13?: string
  /** Processed overview ("What this book is about") */
  overview?: string
  /** Factual metadata-derived interest highlights ("Why it may interest you") */
  whyInterest?: string[]
  /** Open Library edition / work URL if enriched */
  openLibraryUrl?: string
  /** Enrichment status tracking */
  enrichmentStatus?: 'none' | 'partial' | 'complete'
  /** Internal source provenance */
  descriptionSource?: 'google' | 'apple' | 'openlibrary'
  coverSource?: 'google' | 'apple' | 'openlibrary'
  isbnSource?: 'google' | 'apple' | 'openlibrary'
  /** Legacy enrichment boolean flag */
  isEnriched?: boolean
  /** averageRating 1-5 from Google Books, or null */
  rating?: number | null
  /** accessInfo.embeddable */
  embeddable?: boolean
  /** accessInfo.viewability — e.g. 'PARTIAL', 'ALL_PAGES', 'NO_PAGES' */
  viewability?: string
}

/** Which real data source produced these results. */
export type BookSource = 'google' | 'apple' | 'openlibrary' | 'isbndb'

export interface SearchResponse {
  /** The original query string (echoed back) */
  query: string
  /** 'title' = a single best-matching title was found (client should jump to detail). 'genre' = show results grid. */
  mode: 'title' | 'genre'
  /** Present (and equal to results[0]) only when mode === 'title'. Otherwise null. */
  bestMatch: Book | null
  /** Page of books for the grid (length <= maxResults). */
  results: Book[]
  /** Total items reported by the source (approximate). */
  totalItems: number
  /** The startIndex used for this page. */
  startIndex: number
  /** The maxResults used for this page. */
  maxResults: number
  /** The primary provider source */
  source: BookSource
}
