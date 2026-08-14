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
import { SearchProgress } from '@/components/trueread/search-progress'
import { ScrollToTop } from '@/components/trueread/scroll-to-top'
import { KeyboardHelp } from '@/components/trueread/keyboard-help'
import { useLocalStorage } from '@/components/trueread/use-local-storage'
import { useToast } from '@/hooks/use-toast'
import type { Book, BookSource, SearchResponse } from '@/components/trueread/types'

const MAX_RESULTS = 24
/** Max recent searches persisted to localStorage. */
const MAX_RECENT = 6
/** Max reading list books persisted to localStorage. */
const MAX_READING_LIST = 30
/** Max recently-viewed books kept in localStorage (most-recent-first). */
const MAX_RECENTLY_VIEWED = 8
/** localStorage keys (versioned so we can break schema later if needed). */
const LS_KEY_RECENT = 'trueread:recent:v1'
const LS_KEY_LIST = 'trueread:reading-list:v1'
const LS_KEY_RECENTLY_VIEWED = 'trueread:recently-viewed:v1'
/** "Mark as read" records — keyed by book id, value is an ISO timestamp. */
const LS_KEY_READ_BOOKS = 'trueread:read-books:v1'

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
  // Recent searches — persisted to localStorage (survives reload).
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>(
    LS_KEY_RECENT,
    [],
  )
  // Reading list — persisted to localStorage (survives reload).
  const [readingList, setReadingList] = useLocalStorage<Book[]>(
    LS_KEY_LIST,
    [],
  )
  // Recently-viewed books — persisted to localStorage. Each time the user
  // opens a book detail, we prepend it to this list (deduped by id, capped
  // at MAX_RECENTLY_VIEWED). The Home view shows these as a horizontal strip.
  const [recentlyViewed, setRecentlyViewed] = useLocalStorage<Book[]>(
    LS_KEY_RECENTLY_VIEWED,
    [],
  )
  // "Mark as read" records — a map of book id → ISO timestamp of when the
  // user marked the book as read. Persisted to localStorage so the user's
  // reading history survives reloads. Used by the reading-list panel
  // (filter + visual badge) and the detail view (mark-as-read button).
  const [readBooks, setReadBooks] = useLocalStorage<Record<string, string>>(
    LS_KEY_READ_BOOKS,
    {},
  )
  const [readingListOpen, setReadingListOpen] = React.useState(false)
  const [keyboardHelpOpen, setKeyboardHelpOpen] = React.useState(false)
  const lastResultsRef = React.useRef<LastResults | null>(null)
  // Tracks the source of the most recent search so a card click (which only
  // receives a Book) can still carry the correct source into the detail view.
  const sourceRef = React.useRef<BookSource>('google')
  // Ref to the home hero search input — used by the `/` keyboard shortcut.
  const homeSearchRef = React.useRef<HTMLInputElement>(null)
  // Toast notifications
  const { toast } = useToast()

  // Derived: set of bookmarked book IDs for quick lookup
  const bookmarkedIds = React.useMemo(
    () => new Set(readingList.map((b) => b.id)),
    [readingList],
  )
  // Derived: set of "read" book IDs for quick lookup
  const readIds = React.useMemo(
    () => new Set(Object.keys(readBooks)),
    [readBooks],
  )

  // Scroll to top on view changes (home↔results↔detail, including pagination).
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [view])

  // Keyboard shortcuts:
  //   `/`  → focus the home search box (only when not already typing in an input)
  //   `Esc`→ go back (detail→results/home, results→home) or close overlays
  //   `?`  → toggle the keyboard help overlay
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
        if (view.name === 'home' && !keyboardHelpOpen && !readingListOpen) {
          e.preventDefault()
          homeSearchRef.current?.focus()
        }
      }

      // `?` (Shift + /) toggles the keyboard help overlay — only when not typing.
      if (
        (e.key === '?' || (e.key === '/' && e.shiftKey)) &&
        !isTyping &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        e.preventDefault()
        setKeyboardHelpOpen((v) => !v)
      }

      // `Escape` navigates back (or closes overlays).
      if (e.key === 'Escape' && !isTyping) {
        if (keyboardHelpOpen) {
          e.preventDefault()
          setKeyboardHelpOpen(false)
        } else if (readingListOpen) {
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
  }, [view, readingListOpen, keyboardHelpOpen])

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
        toast({
          title: 'Removed from reading list',
          description: `${book.title}`,
          duration: 2000,
        })
        return prev.filter((b) => b.id !== book.id)
      }
      toast({
        title: 'Added to reading list',
        description: `${book.title}`,
        duration: 2000,
      })
      // Add to end, cap at MAX_READING_LIST
      return [...prev, book].slice(-MAX_READING_LIST)
    })
  }, [toast])

  const clearReadingList = React.useCallback(() => {
    setReadingList([])
    toast({
      title: 'Reading list cleared',
      duration: 2000,
    })
  }, [toast])

  // Toggle a book's "read" status. Records the timestamp when marked as read;
  // removes the record when un-marked. Persisted to localStorage so the
  // user's reading history survives reloads.
  const toggleRead = React.useCallback(
    (book: Book) => {
      setReadBooks((prev) => {
        if (prev[book.id]) {
          toast({
            title: 'Marked as not read',
            description: book.title,
            duration: 2000,
          })
          const next = { ...prev }
          delete next[book.id]
          return next
        }
        toast({
          title: 'Marked as read',
          description: book.title,
          duration: 2000,
        })
        return { ...prev, [book.id]: new Date().toISOString() }
      })
    },
    [setReadBooks, toast],
  )

  const removeReadingListItem = React.useCallback((id: string) => {
    setReadingList((prev) => {
      const book = prev.find((b) => b.id === id)
      if (book) {
        toast({
          title: 'Removed from reading list',
          description: book.title,
          duration: 2000,
        })
      }
      return prev.filter((b) => b.id !== id)
    })
  }, [toast])

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

  // Prepend a book to the recently-viewed list (deduped by id, capped).
  // Called whenever the user opens a book detail — from the grid, the
  // reading list, the "More from this author" section, or the recently-viewed
  // strip itself.
  const pushRecentlyViewed = React.useCallback((book: Book) => {
    setRecentlyViewed((prev) => {
      const without = prev.filter((b) => b.id !== book.id)
      return [book, ...without].slice(0, MAX_RECENTLY_VIEWED)
    })
  }, [setRecentlyViewed])

  const handleSelectBook = React.useCallback((book: Book) => {
    pushRecentlyViewed(book)
    setView({ name: 'detail', book, source: sourceRef.current })
  }, [pushRecentlyViewed])

  // Clear all recently-viewed books.
  const handleClearRecentlyViewed = React.useCallback(() => {
    setRecentlyViewed([])
  }, [setRecentlyViewed])

  // Remove a single recently-viewed book by id.
  const handleRemoveRecentlyViewed = React.useCallback((id: string) => {
    setRecentlyViewed((prev) => prev.filter((b) => b.id !== id))
  }, [setRecentlyViewed])

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
      {/* Search progress bar */}
      <SearchProgress isLoading={isLoading} />

      {/* Global sticky header — glass morphism */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
          <Logo size="md" onClick={handleLogoClick} />
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Reading list badge in header */}
            {readingList.length > 0 && (
              <button
                type="button"
                onClick={() => setReadingListOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
                aria-label={`Reading list: ${readingList.length} ${readingList.length === 1 ? 'book' : 'books'}`}
              >
                <span className="flex size-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                  {readingList.length}
                </span>
                Reading List
              </button>
            )}
            {/* Keyboard help button */}
            <button
              type="button"
              onClick={() => setKeyboardHelpOpen(true)}
              className="inline-flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
              aria-label="Show keyboard shortcuts"
              title="Keyboard shortcuts (?)"
            >
              <kbd className="text-xs font-semibold">?</kbd>
            </button>
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
                recentlyViewed={recentlyViewed}
                onSelectBook={handleSelectBook}
                onClearRecentlyViewed={handleClearRecentlyViewed}
                onRemoveRecentlyViewed={handleRemoveRecentlyViewed}
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
                isRead={readIds.has(view.book.id)}
                onToggleRead={toggleRead}
                onToast={toast}
                onSelectBook={handleSelectBook}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Sticky footer — pushed down naturally by flex-col + mt-auto */}
      <Footer className="mt-auto" />

      {/* Scroll to top button */}
      <ScrollToTop />

      {/* Reading list slide-out panel */}
      <ReadingList
        books={readingList}
        onRemove={removeReadingListItem}
        onClear={clearReadingList}
        onSelect={handleSelectBook}
        isOpen={readingListOpen}
        onToggle={() => setReadingListOpen((v) => !v)}
        onToast={toast}
        readBooks={readBooks}
        onToggleRead={toggleRead}
      />

      {/* Keyboard shortcuts help overlay */}
      <KeyboardHelp
        isOpen={keyboardHelpOpen}
        onClose={() => setKeyboardHelpOpen(false)}
      />
    </div>
  )
}
