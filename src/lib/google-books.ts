/**
 * Google Books API integration (server-only).
 *
 * Talks to the public Google Books REST API:
 *   https://www.googleapis.com/books/v1/volumes
 *
 * No `'use client'` / `'use server'` directive — this is a plain server module
 * imported by the Route Handler in `src/app/api/books/search/route.ts`.
 *
 * Conforms to the shared contract in `@/components/trueread/types`.
 */

import type { Book, BookSource } from '@/components/trueread/types'

export type { Book, BookSource }

/** TTL for the in-memory cache (10 minutes). */
const CACHE_TTL_MS = 600_000

/** In-memory cache entry. Module-level so it survives across requests in the same process. */
interface CacheEntry {
  ts: number
  data: { results: Book[]; totalItems: number }
}

const cache = new Map<string, CacheEntry>()

/** Build a deterministic cache key. */
function cacheKey(query: string, startIndex: number, maxResults: number): string {
  return `${query}::${startIndex}::${maxResults}`
}

/** Return cached payload if fresh; otherwise delete the stale entry and return undefined. */
function getCached(key: string): { results: Book[]; totalItems: number } | undefined {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key)
    return undefined
  }
  return entry.data
}

/** Store a fresh payload in the cache. */
function setCached(key: string, data: { results: Book[]; totalItems: number }): void {
  cache.set(key, { ts: Date.now(), data })
}

/**
 * Safely extract a `Book` from a Google Books volume object.
 *
 * Defensive: never throws on missing fields — falls back to sensible defaults
 * so a single malformed volume doesn't break an entire result page.
 */
export function mapVolume(volume: any): Book {
  const volumeInfo = volume?.volumeInfo ?? {}
  const accessInfo = volume?.accessInfo ?? {}
  const searchInfo = volume?.searchInfo ?? {}

  // --- Title ---
  const title: string =
    typeof volumeInfo.title === 'string' && volumeInfo.title.trim().length > 0
      ? volumeInfo.title
      : 'Untitled'

  // --- Authors ---
  const authors: string[] = Array.isArray(volumeInfo.authors)
    ? volumeInfo.authors.filter((a: unknown) => typeof a === 'string' && a.length > 0)
    : []

  // --- Year (first 4 chars of publishedDate if it starts with 4 digits) ---
  let year: string | null = null
  if (typeof volumeInfo.publishedDate === 'string') {
    const match = volumeInfo.publishedDate.match(/^(\d{4})/)
    if (match) year = match[1]
  }

  // --- Cover (prefer largest available; force https) ---
  let cover: string | undefined
  const imageLinks = volumeInfo.imageLinks
  if (imageLinks && typeof imageLinks === 'object') {
    const candidates = [
      imageLinks.extraLarge,
      imageLinks.large,
      imageLinks.medium,
      imageLinks.thumbnail,
      imageLinks.smallThumbnail,
    ]
    for (const c of candidates) {
      if (typeof c === 'string' && c.length > 0) {
        // Google serves http:// — force https:// to avoid mixed-content blocking.
        cover = c.replace(/^http:\/\//i, 'https://')
        break
      }
    }
  }

  // --- Description ---
  const description: string | undefined =
    typeof volumeInfo.description === 'string' && volumeInfo.description.length > 0
      ? volumeInfo.description
      : undefined

  // --- Preview snippet (searchInfo.textSnippet — KEEP raw <em> tags) ---
  const previewSnippet: string | undefined =
    typeof searchInfo.textSnippet === 'string' && searchInfo.textSnippet.length > 0
      ? searchInfo.textSnippet
      : undefined

  // --- Preview link ---
  const previewLink: string | undefined =
    (typeof volumeInfo.previewLink === 'string' && volumeInfo.previewLink.length > 0
      ? volumeInfo.previewLink
      : undefined) ??
    (typeof accessInfo.webReaderLink === 'string' && accessInfo.webReaderLink.length > 0
      ? accessInfo.webReaderLink
      : undefined)

  // --- Categories ---
  const categories: string[] | undefined = Array.isArray(volumeInfo.categories)
    ? volumeInfo.categories.filter(
        (c: unknown) => typeof c === 'string' && (c as string).length > 0,
      )
    : undefined

  // --- Publisher ---
  const publisher: string | undefined =
    typeof volumeInfo.publisher === 'string' && volumeInfo.publisher.length > 0
      ? volumeInfo.publisher
      : undefined

  // --- Page count ---
  const pageCount: number | null =
    typeof volumeInfo.pageCount === 'number' && Number.isFinite(volumeInfo.pageCount)
      ? volumeInfo.pageCount
      : typeof volumeInfo.pageCount === 'string' && /^\d+$/.test(volumeInfo.pageCount)
        ? Number(volumeInfo.pageCount)
        : null

  // --- Average rating ---
  const rating: number | null =
    typeof volumeInfo.averageRating === 'number' && Number.isFinite(volumeInfo.averageRating)
      ? volumeInfo.averageRating
      : typeof volumeInfo.averageRating === 'string' &&
          /^\d+(\.\d+)?$/.test(volumeInfo.averageRating)
        ? Number(volumeInfo.averageRating)
        : null

  // --- Embeddable + viewability ---
  const embeddable: boolean = accessInfo?.embeddable === true
  const viewability: string | undefined =
    typeof accessInfo?.viewability === 'string' && accessInfo.viewability.length > 0
      ? accessInfo.viewability
      : undefined

  return {
    id: String(volume?.id ?? ''),
    title,
    authors,
    year,
    cover,
    description,
    previewSnippet,
    previewLink,
    categories,
    publisher,
    pageCount,
    rating,
    embeddable,
    viewability,
  }
}

/** Normalize a string for title matching: lowercase, strip non-alphanumeric (keep spaces), trim, collapse whitespace. */
function normalize(s: string): string {
  if (typeof s !== 'string') return ''
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // strip non-alphanumeric (keep spaces)
    .trim()
    .replace(/\s+/g, ' ')
}

/** Is token array `prefix` a leading sub-sequence of `full`? */
function isPrefixSequence(prefix: string[], full: string[]): boolean {
  if (prefix.length === 0 || prefix.length > full.length) return false
  for (let i = 0; i < prefix.length; i++) {
    if (prefix[i] !== full[i]) return false
  }
  return true
}

/**
 * Heuristic: does the query look like a specific title match for the given title?
 *
 * Goal: a query like "Atomic Habits" or "The Alchemist" should be treated as a
 * specific title (→ jump to detail), while a topic like "fantasy", "mystery",
 * "self-help" or "science fiction" should be treated as a genre browse (→ grid).
 *
 * Rules (in order):
 *   1. Normalize both. If either empty → false.
 *   2. Exact normalized equality → true.            ("the alchemist" == "The Alchemist")
 *   3. Query tokens are a leading prefix of the title tokens → true.
 *      ("atomic habits" vs "Atomic Habits: An Easy & Proven Way…")
 *   4. Title tokens are a leading prefix of the query tokens → true.
 *      ("the alchemist" vs "the alchemist paulo coelho")
 *   5. Token Jaccard similarity >= 0.75 → true.      (near-duplicate titles only)
 *   6. Else false (→ genre/topic browse).
 *
 * NOTE: a generic substring check is intentionally NOT used — it produced false
 * positives where a topic word ("fantasy") appeared inside a book title
 * ("Golden Curse: A Free Fantasy Romance") and wrongly triggered a title match.
 */
export function isTitleMatch(query: string, title: string): boolean {
  const q = normalize(query)
  const t = normalize(title)
  if (q.length === 0 || t.length === 0) return false
  if (q === t) return true

  const qTokens = q.split(' ').filter((tok) => tok.length > 0)
  const tTokens = t.split(' ').filter((tok) => tok.length > 0)
  if (qTokens.length === 0 || tTokens.length === 0) return false

  // Leading-prefix match in either direction.
  if (isPrefixSequence(qTokens, tTokens)) return true
  if (isPrefixSequence(tTokens, qTokens)) return true

  // Strict Jaccard — only near-duplicates (e.g. minor word-order differences).
  const qSet = new Set(qTokens)
  const tSet = new Set(tTokens)
  let intersection = 0
  for (const tok of qSet) if (tSet.has(tok)) intersection++
  const union = qSet.size + tSet.size - intersection
  if (union === 0) return false
  const similarity = intersection / union
  return similarity >= 0.75
}

/**
 * Search Google Books.
 *
 * @param query       Free-text query (title, author, genre, topic, …).
 * @param startIndex  Pagination offset (>= 0).
 * @param maxResults  Page size, clamped to 1..40 (Google's hard limit is 40).
 */
export async function searchBooks(
  query: string,
  startIndex = 0,
  maxResults = 24,
): Promise<{ results: Book[]; totalItems: number }> {
  const safeStart = Math.max(0, Math.floor(startIndex))
  const safeMax = Math.min(Math.max(Math.floor(maxResults), 1), 40)

  const key = cacheKey(query, safeStart, safeMax)
  const cached = getCached(key)
  if (cached) return cached

  const params = new URLSearchParams({
    q: query,
    startIndex: String(safeStart),
    maxResults: String(safeMax),
    printType: 'books',
  })
  // NOTE: langRestrict intentionally omitted — we want all languages.
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY
  if (apiKey && apiKey.length > 0) {
    params.set('key', apiKey)
  }

  const url = `https://www.googleapis.com/books/v1/volumes?${params.toString()}`

  let res: Response
  try {
    res = await fetch(url, { next: { revalidate: 600 } })
  } catch (err) {
    throw new Error(
      `Google Books fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  if (!res.ok) {
    throw new Error(
      `Google Books responded with HTTP ${res.status} ${res.statusText}`,
    )
  }

  let data: any
  try {
    data = await res.json()
  } catch (err) {
    throw new Error(
      `Google Books returned invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  const totalItems: number =
    typeof data?.totalItems === 'number' ? data.totalItems : 0

  if (totalItems === 0 || !Array.isArray(data?.items) || data.items.length === 0) {
    const empty = { results: [], totalItems: 0 }
    setCached(key, empty)
    return empty
  }

  const results: Book[] = data.items
    .map((v: any) => mapVolume(v))
    .filter((b: Book) => typeof b.id === 'string' && b.id.length > 0)

  const payload = { results, totalItems: totalItems || results.length }
  setCached(key, payload)
  return payload
}

/**
 * Decide whether the results represent a "title" match (jump straight to detail)
 * or a "genre" browse (show the grid).
 *
 * - 0 results → genre, no best match.
 * - 1 result  → title (single best match).
 * - >1 result → title only if the top result's title matches the query heuristically.
 */
export function decideMode(
  query: string,
  results: Book[],
): { mode: 'title' | 'genre'; bestMatch: Book | null } {
  if (results.length === 0) return { mode: 'genre', bestMatch: null }
  if (results.length === 1) return { mode: 'title', bestMatch: results[0] }
  if (isTitleMatch(query, results[0].title)) {
    return { mode: 'title', bestMatch: results[0] }
  }
  return { mode: 'genre', bestMatch: null }
}

// ---------------------------------------------------------------------------
// Transparent real-data fallback: Apple Books (iTunes Search API)
// ---------------------------------------------------------------------------
//
// Google Books' anonymous API has a per-IP daily quota. In shared/cloud
// environments that quota can be exhausted by other tenants on the same egress
// IP, causing HTTP 429 for the entire day. To keep TrueRead functional with
// REAL data (never fabricated), we fall back to the free, no-key iTunes Search
// API (media=ebook), which returns real ebook metadata + cover art from
// Apple's CDN. Apple has no "preview text" field, so those books show the
// spec'd "No preview available for this book." empty state in the detail view.
//
// The source is always disclosed to the client via `SearchResponse.source`.

/** Strip HTML tags and decode basic entities (iTunes descriptions are HTML). */
function stripHtml(html: string): string {
  if (typeof html !== 'string' || html.length === 0) return ''
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Upgrade an Apple artwork URL to a larger portrait crop (default is 100x100). */
function upgradeAppleCover(url: string): string {
  // Apple URLs end with /{w}x{h}bb.jpg — request a 400x600 portrait crop.
  return url.replace(/\/\d+x\d+bb\.jpg$/i, '/400x600bb.jpg')
}

/**
 * Map an iTunes Search API result (ebook) to the shared `Book` shape.
 * Defensive: never throws on missing fields.
 */
export function mapITunesResult(r: any): Book {
  const title: string =
    typeof r?.trackName === 'string' && r.trackName.trim().length > 0
      ? r.trackName
      : typeof r?.collectionName === 'string' && r.collectionName.trim().length > 0
        ? r.collectionName
        : 'Untitled'

  // artistName may be "James Clear" or "A, B & C" — split on , and &.
  let authors: string[] = []
  if (typeof r?.artistName === 'string' && r.artistName.length > 0) {
    authors = r.artistName
      .split(/[,&]/)
      .map((a: string) => a.trim())
      .filter((a: string) => a.length > 0)
  }

  let year: string | null = null
  if (typeof r?.releaseDate === 'string') {
    const m = r.releaseDate.match(/^(\d{4})/)
    if (m) year = m[1]
  }

  // Prefer the largest available artwork, then upgrade to a portrait crop.
  let cover: string | undefined
  const coverCandidates = [
    r?.artworkUrl600,
    r?.artworkUrl512,
    r?.artworkUrl100,
    r?.artworkUrl60,
  ]
  for (const c of coverCandidates) {
    if (typeof c === 'string' && c.length > 0) {
      cover = upgradeAppleCover(c)
      break
    }
  }

  const description: string | undefined =
    typeof r?.description === 'string' && r.description.length > 0
      ? stripHtml(r.description)
      : undefined

  const previewLink: string | undefined =
    typeof r?.trackViewUrl === 'string' && r.trackViewUrl.length > 0
      ? r.trackViewUrl
      : undefined

  // Genres include a generic "Books" entry — filter it out for cleaner chips.
  const categories: string[] | undefined = Array.isArray(r?.genres)
    ? r.genres
        .filter(
          (g: unknown) =>
            typeof g === 'string' && g.length > 0 && g !== 'Books',
        )
    : undefined

  // Apple doesn't expose a clean publisher field for ebooks; leave undefined.
  const id: string =
    r?.trackId != null
      ? `apple-${r.trackId}`
      : r?.collectionId != null
        ? `apple-c${r.collectionId}`
        : `apple-${Math.random().toString(36).slice(2)}`

  return {
    id,
    title,
    authors,
    year,
    cover,
    description,
    previewSnippet: undefined, // Apple has no preview text
    previewLink,
    categories,
    publisher: undefined,
    pageCount: null,
    rating: null,
    embeddable: false,
    viewability: 'NO_PAGES',
  }
}

/**
 * Search Apple Books via the iTunes Search API (free, no key).
 *
 * Note: iTunes `resultCount` is the number returned on THIS page, not a true
 * total. We report `totalItems = results.length` so the client renders an
 * honest count and doesn't fabricate pagination depth.
 */
export async function searchITunes(
  query: string,
  startIndex = 0,
  maxResults = 24,
): Promise<{ results: Book[]; totalItems: number }> {
  const safeStart = Math.max(0, Math.floor(startIndex))
  const safeMax = Math.min(Math.max(Math.floor(maxResults), 1), 200)

  const params = new URLSearchParams({
    term: query,
    media: 'ebook',
    limit: String(safeMax),
  })
  if (safeStart > 0) params.set('offset', String(safeStart))

  const url = `https://itunes.apple.com/search?${params.toString()}`

  let res: Response
  try {
    res = await fetch(url, { next: { revalidate: 600 } })
  } catch (err) {
    throw new Error(
      `iTunes fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  if (!res.ok) {
    throw new Error(
      `iTunes responded with HTTP ${res.status} ${res.statusText}`,
    )
  }

  let data: any
  try {
    data = await res.json()
  } catch (err) {
    throw new Error(
      `iTunes returned invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  const rawResults: any[] = Array.isArray(data?.results) ? data.results : []
  const results: Book[] = rawResults
    .map((r) => mapITunesResult(r))
    .filter((b: Book) => b.id.length > 0 && b.title !== 'Untitled')

  return { results, totalItems: results.length }
}

// Orchestrator cache — separate from the Google-only cache so a known-down
// Google (within TTL) doesn't get re-tried on every request.
interface OrchestratorCacheEntry {
  ts: number
  data: { results: Book[]; totalItems: number; source: BookSource }
}
const orchestratorCache = new Map<string, OrchestratorCacheEntry>()

/**
 * Search with a transparent real-data fallback.
 *
 *  1. Try Google Books (primary — has preview snippets).
 *  2. On any Google failure (429 quota, 5xx, network), fall back to Apple Books
 *     (iTunes Search API) — real metadata + covers, no preview text.
 *  3. If both fail, throw a combined error.
 *
 * Results (including which source succeeded) are cached for CACHE_TTL_MS so
 * subsequent requests for the same query are instant and don't re-trigger the
 * failed Google call.
 */
export async function searchBooksWithFallback(
  query: string,
  startIndex = 0,
  maxResults = 24,
): Promise<{ results: Book[]; totalItems: number; source: BookSource }> {
  const safeStart = Math.max(0, Math.floor(startIndex))
  const safeMax = Math.min(Math.max(Math.floor(maxResults), 1), 40)
  const key = `${query}::${safeStart}::${safeMax}`

  const cached = orchestratorCache.get(key)
  if (cached && Date.now() - cached.ts <= CACHE_TTL_MS) {
    return cached.data
  }

  // 1) Google Books (primary)
  try {
    const google = await searchBooks(query, safeStart, safeMax)
    const data = { results: google.results, totalItems: google.totalItems, source: 'google' as BookSource }
    orchestratorCache.set(key, { ts: Date.now(), data })
    return data
  } catch (googleErr) {
    const gmsg = googleErr instanceof Error ? googleErr.message : String(googleErr)
    console.warn(
      '[google-books] Google Books unavailable, falling back to Apple Books (iTunes). Reason:',
      gmsg,
    )

    // 2) Apple Books fallback (real data, no fabrication)
    try {
      const apple = await searchITunes(query, safeStart, safeMax)
      const data = { results: apple.results, totalItems: apple.totalItems, source: 'apple' as BookSource }
      orchestratorCache.set(key, { ts: Date.now(), data })
      return data
    } catch (appleErr) {
      const amsg = appleErr instanceof Error ? appleErr.message : String(appleErr)
      throw new Error(
        `Both book sources failed. Google Books: ${gmsg}. Apple Books: ${amsg}`,
      )
    }
  }
}
