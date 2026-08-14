// Shared types for TrueRead — the single source of truth for the API contract.
// Both the backend (src/lib/google-books.ts, src/app/api/books/search/route.ts)
// and the frontend (src/components/trueread/*, src/app/page.tsx) MUST conform to these.

export interface Book {
  /** Google Books volume id */
  id: string
  title: string
  authors: string[]
  /** 4-digit year extracted from publishedDate, or null if unknown */
  year: string | null
  /** https cover image URL, or undefined if no cover available */
  cover?: string
  /** Full book description from Google Books (may be long) */
  description?: string
  /** Google Books searchInfo.textSnippet — real excerpt text. May contain <em>...</em> highlight tags. */
  previewSnippet?: string
  /** Google Books preview link (reader URL) */
  previewLink?: string
  categories?: string[]
  publisher?: string
  pageCount?: number | null
  /** averageRating 1-5 from Google Books, or null */
  rating?: number | null
  /** accessInfo.embeddable */
  embeddable?: boolean
  /** accessInfo.viewability — e.g. 'PARTIAL', 'ALL_PAGES', 'NO_PAGES' */
  viewability?: string
}

/** Which real data source produced these results. */
export type BookSource = 'google' | 'apple'

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
  /**
   * The real data source that produced these results.
   * - 'google' = Google Books API (primary; has preview snippets).
   * - 'apple'  = Apple Books / iTunes Search API (transparent fallback used only
   *              when Google Books is environmentally unavailable, e.g. shared-IP
   *              quota exhaustion. Real metadata + covers, but no preview text →
   *              detail view shows the spec'd "No preview available" empty state).
   */
  source: BookSource
}
