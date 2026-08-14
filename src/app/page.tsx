'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/trueread/logo'
import { HomeView } from '@/components/trueread/home-view'
import { ResultsView } from '@/components/trueread/results-view'
import { DetailView } from '@/components/trueread/detail-view'
import { Footer } from '@/components/trueread/footer'
import { ReadingList } from '@/components/trueread/reading-list'
import type { Book, BookSource, SearchResponse } from '@/components/trueread/types'

const MAX_RESULTS = 24
/** Max recent searches kept in-memory (session only — no persistence). */
const MAX_RECENT = 6
/** Max reading list books kept in-memory. */
const MAX_READING_LIST = 30

type View =
  | { name: 'home' }
  | {
      name: 'results'
      query: string
      results: Book[]
      totalItems: number
      page: number
      source: BookSource
    }
  | { name: 'detail'; book: Book; source: BookSource }

interface LastResults {
  query: string
  results: Book[]
  totalItems: number
  page: number
  source: BookSource
}

export default function Page() {
  const [view, setView] = React.useState<View>({ name: 'home' })
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  // Recent searches (in-memory, session-only). Most-recent-first, deduped.
  const [recentSearches, setRecentSearches] = React.useState<string[]>([])
  // Reading list (in-memory, session-only). Order of addition.
  const [readingList, setReadingList] = React.useState<Book[]>([])
  const [readingListOpen, setReadingListOpen] = React.useState(false)
  const lastResultsRef = React.useRef<LastResults | null>(null)
  // Tracks the source of the most recent search so a card click (which only
  // receives a Book) can still carry the correct source into the detail view.
  const sourceRef = React.useRef<BookSource>('google')
  // Ref to the home hero search input — used by the `/` keyboard shortcut.
  const homeSearchRef = React.useRef<HTMLInputElement>(null)

  // Derived: set of bookmarked book IDs for quick lookup
  const bookmarkedIds = React.useMemo(
    () => new Set(readingList.map((b) => b.id)),
    [readingList],
  )

  // Scroll to top on view changes (home↔results↔detail, including pagination).
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [view])

  // Keyboard shortcuts:
  //   `/`  → focus the home search box (only when not already typing in an input)
  //   `Esc`→ go back (detail→results/home, results→home)
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isTyping =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)

      // `/` focuses the home search — but only on the home view, and only
      // when the user isn't already typing somewhere.
      if (e.key === '/' && !isTyping && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (view.name === 'home') {
          e.preventDefault()
          homeSearchRef.current?.focus()
        }
      }

      // `Escape` navigates back (or closes reading list).
      if (e.key === 'Escape' && !isTyping) {
        if (readingListOpen) {
          e.preventDefault()
          setReadingListOpen(false)
        } else if (view.name === 'detail') {
          e.preventDefault()
          handleBackFromDetail()
        } else if (view.name === 'results') {
          e.preventDefault()
          handleBackFromResults()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [view, readingListOpen])

  // Push a query onto the recent-searches list (deduped, most-recent-first).
  const pushRecent = React.useCallback((q: string) => {
    const trimmed = q.trim()
    if (trimmed.length === 0) return
    setRecentSearches((prev) => {
      const without = prev.filter((x) => x.toLowerCase() !== trimmed.toLowerCase())
      return [trimmed, ...without].slice(0, MAX_RECENT)
    })
  }, [])

  // Toggle a book in/out of the reading list.
  const toggleBookmark = React.useCallback((book: Book) => {
    setReadingList((prev) => {
      const idx = prev.findIndex((b) => b.id === book.id)
      if (idx >= 0) {
        return prev.filter((b) => b.id !== book.id)
      }
      // Add to end, cap at MAX_READING_LIST
      return [...prev, book].slice(-MAX_READING_LIST)
    })
  }, [])

  const clearReadingList = React.useCallback(() => {
    setReadingList([])
  }, [])

  const removeReadingListItem = React.useCallback((id: string) => {
    setReadingList((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const handleSearch = React.useCallback(
    async (q: string, page = 1) => {
      const query = q.trim()
      if (query.length === 0) {
        lastResultsRef.current = null
        setError(null)
        setView({ name: 'home' })
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          q: query,
          startIndex: String((page - 1) * MAX_RESULTS),
          maxResults: String(MAX_RESULTS),
        })
        const res = await fetch(`/api/books/search?${params.toString()}`)
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`)
        }
        const data = (await res.json()) as SearchResponse

        // Validate the basic shape — defensive against a malformed backend response.
        if (!data || typeof data !== 'object' || !Array.isArray(data.results)) {
          throw new Error('Malformed response from server.')
        }

        // Track the real data source (google | apple) for transparent attribution.
        sourceRef.current = data.source ?? 'google'

        // Record this query in recent searches (page-1 only, to avoid spamming
        // on pagination).
        if (page === 1) {
          pushRecent(query)
        }

        if (data.mode === 'title' && data.bestMatch) {
          // Specific title match — jump straight to detail, clear last results.
          lastResultsRef.current = null
          setView({
            name: 'detail',
            book: data.bestMatch,
            source: sourceRef.current,
          })
        } else {
          // Genre / topic browse — show results grid, store for "back from detail".
          const snapshot: LastResults = {
            query: data.query || query,
            results: data.results,
            totalItems: data.totalItems ?? 0,
            page,
            source: sourceRef.current,
          }
          lastResultsRef.current = snapshot
          setView({
            name: 'results',
            query: snapshot.query,
            results: snapshot.results,
            totalItems: snapshot.totalItems,
            page: snapshot.page,
            source: snapshot.source,
          })
        }
      } catch (err) {
        console.error('[TrueRead] search failed:', err)
        setError('Something went wrong while searching. Please try again.')
      } finally {
        setIsLoading(false)
      }
    },
    [pushRecent],
  )

  const handleSelectBook = React.useCallback((book: Book) => {
    setView({ name: 'detail', book, source: sourceRef.current })
  }, [])

  const handleBackFromDetail = React.useCallback(() => {
    const last = lastResultsRef.current
    if (last) {
      setView({
        name: 'results',
        query: last.query,
        results: last.results,
        totalItems: last.totalItems,
        page: last.page,
        source: last.source,
      })
    } else {
      setView({ name: 'home' })
    }
  }, [])

  const handleBackFromResults = React.useCallback(() => {
    lastResultsRef.current = null
    setError(null)
    setView({ name: 'home' })
  }, [])

  const handleLogoClick = React.useCallback(() => {
    lastResultsRef.current = null
    setError(null)
    setView({ name: 'home' })
  }, [])

  const handleClearRecent = React.useCallback(() => {
    setRecentSearches([])
  }, [])

  // A stable key per view for AnimatePresence exit animations.
  const viewKey =
    view.name === 'results'
      ? `results-${view.query}-${view.page}`
      : view.name === 'detail'
        ? `detail-${view.book.id}`
        : 'home'

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
      {/* Global sticky header — glass morphism */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
          <Logo size="md" onClick={handleLogoClick} />
          <div className="flex items-center gap-3">
            {/* Reading list badge in header */}
            {readingList.length > 0 && (
              <button
                type="button"
                onClick={() => setReadingListOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
                aria-label={`Reading list: ${readingList.length} books`}
              >
                <span className="flex size-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                  {readingList.length}
                </span>
                Reading List
              </button>
            )}
            <Badge
              variant="outline"
              className="hidden border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 md:inline-flex"
            >
              Powered by Google Books API
            </Badge>
          </div>
        </div>
      </header>

      {/* Main view — animated transitions between home/results/detail */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {view.name === 'home' && (
              <HomeView
                onSearch={handleSearch}
                isLoading={isLoading}
                recentSearches={recentSearches}
                onClearRecent={handleClearRecent}
                searchInputRef={homeSearchRef}
                readingListCount={readingList.length}
              />
            )}

            {view.name === 'results' && (
              <ResultsView
                query={view.query}
                results={view.results}
                totalItems={view.totalItems}
                page={view.page}
                maxResults={MAX_RESULTS}
                source={view.source}
                isLoading={isLoading}
                error={error}
                onSearch={(q) => handleSearch(q, 1)}
                onSelectBook={handleSelectBook}
                onPageChange={(p) => handleSearch(view.query, p)}
                onBack={handleBackFromResults}
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={toggleBookmark}
              />
            )}

            {view.name === 'detail' && (
              <DetailView
                book={view.book}
                source={view.source}
                backLabel={
                  lastResultsRef.current ? 'Back to results' : 'Back to home'
                }
                onBack={handleBackFromDetail}
                onSearch={(q) => handleSearch(q, 1)}
                isBookmarked={bookmarkedIds.has(view.book.id)}
                onToggleBookmark={toggleBookmark}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Sticky footer — pushed down naturally by flex-col + mt-auto */}
      <Footer className="mt-auto" />

      {/* Reading list slide-out panel */}
      <ReadingList
        books={readingList}
        onRemove={removeReadingListItem}
        onClear={clearReadingList}
        onSelect={handleSelectBook}
        isOpen={readingListOpen}
        onToggle={() => setReadingListOpen((v) => !v)}
      />
    </div>
  )
}
