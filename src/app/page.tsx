'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/trueread/logo'
import dynamic from 'next/dynamic'
import { Footer } from '@/components/trueread/footer'
import { SearchProgress } from '@/components/trueread/search-progress'
import { ScrollToTop } from '@/components/trueread/scroll-to-top'
import { DiscoverIntro } from '@/components/trueread/discover-intro'
import { useLocalStorage } from '@/components/trueread/use-local-storage'
import { useToast } from '@/hooks/use-toast'
import type { Book, BookSource, SearchResponse } from '@/components/trueread/types'
import { AuthProvider } from '@/components/trueread/auth-context'
import { AuthModal } from '@/components/trueread/auth-modal'
import { AuthButton } from '@/components/trueread/auth-button'
import { AUTH_ENABLED } from '@/lib/features'
import { NavMenu } from '@/components/trueread/nav-menu'
import { ReadingIntentView } from '@/components/trueread/reading-intent-view'
import type { UserReadingIntent } from '@/lib/intent-matcher'
import { Switch } from '@/components/ui/switch'
import { Bookmark, Compass } from 'lucide-react'
import './shelf-theme.css'
import { matchBooksByIntent } from '@/lib/intent-matcher'

// Everything the first screen (the mood quiz) does not need loads on demand,
// so the first visit downloads and runs far less JavaScript. These are only
// ever shown after the visitor acts, so skipping server rendering loses nothing.
const HomeView = dynamic(() => import('@/components/trueread/home-view').then((m) => m.HomeView), { ssr: false })
const ResultsView = dynamic(() => import('@/components/trueread/results-view').then((m) => m.ResultsView), { ssr: false })
const DetailView = dynamic(() => import('@/components/trueread/detail-view').then((m) => m.DetailView), { ssr: false })
const IntentResultsView = dynamic(
  () => import('@/components/trueread/intent-results-view').then((m) => m.IntentResultsView),
  { ssr: false },
)
const ShelfView = dynamic(() => import('@/components/trueread/shelf-view').then((m) => m.ShelfView), { ssr: false })
const ReadingList = dynamic(() => import('@/components/trueread/reading-list').then((m) => m.ReadingList), { ssr: false })
const KeyboardHelp = dynamic(() => import('@/components/trueread/keyboard-help').then((m) => m.KeyboardHelp), { ssr: false })

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
/** Which listing UI is active: the original grid or the experimental 3D shelf. */
const LS_KEY_UI_MODE = 'trueread:ui-mode:v1'

type UiMode = 'classic' | 'shelf'

/** Human-readable chips for a reading intent (shared by the shelf header). */
function intentChipLabels(intent: UserReadingIntent): string[] {
  const feel: Record<string, string> = {
    fast_gripping: 'Fast & gripping',
    thought_provoking: 'Thought-provoking',
    emotional: 'Emotional',
    immersive: 'Immersive',
    relaxing: 'Relaxing',
  }
  const effort = { low: 'Easy escape', moderate: 'Some focus', deep: 'Deep dive' }[intent.effort]
  const focus: Record<string, string> = {
    story: 'Story',
    characters: 'Characters',
    ideas: 'Ideas',
    writing: 'Writing',
  }
  return [
    ...intent.feel.map((f) => feel[f]).filter(Boolean),
    effort,
    ...intent.focus.map((f) => focus[f]).filter(Boolean),
  ]
}

type View =
  | { name: 'intent' }
  | { name: 'intent-results'; intent: UserReadingIntent }
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
  const [view, setView] = React.useState<View>({ name: 'intent' })
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
  const [uiMode, setUiMode] = useLocalStorage<UiMode>(LS_KEY_UI_MODE, 'classic')
  const [readingListOpen, setReadingListOpen] = React.useState(false)
  const [keyboardHelpOpen, setKeyboardHelpOpen] = React.useState(false)
  const lastResultsRef = React.useRef<LastResults | null>(null)
  // The mood-quiz intent whose picks the user last viewed, so "Back" from a
  // book detail returns to those picks instead of the home search.
  const lastIntentRef = React.useRef<UserReadingIntent | null>(null)
  // Which book the shelf was centred on, restored when returning from a detail.
  const shelfIndexRef = React.useRef(0)
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
      shelfIndexRef.current = 0
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
    } else if (lastIntentRef.current) {
      setView({ name: 'intent-results', intent: lastIntentRef.current })
    } else {
      setView({ name: 'home' })
    }
  }, [])

  const handleBackFromResults = React.useCallback(() => {
    lastResultsRef.current = null
    setError(null)
    setView({ name: 'intent' })
  }, [])

  const handleLogoClick = React.useCallback(() => {
    lastResultsRef.current = null
    setError(null)
    setView({ name: 'intent' })
  }, [])

  const handleIntentSubmit = React.useCallback((intent: UserReadingIntent) => {
    lastIntentRef.current = intent
    shelfIndexRef.current = 0
    setView({ name: 'intent-results', intent })
  }, [])

  const handleSkipToSearch = React.useCallback(() => {
    setView({ name: 'home' })
  }, [])

  const handleAdjustIntent = React.useCallback(() => {
    setView({ name: 'intent' })
  }, [])

  const handleClearRecent = React.useCallback(() => {
    setRecentSearches([])
  }, [])

  const [isAdultMode, setIsAdultMode] = React.useState(false)

  // Shelf mode shows every curated book (not just the top 10), ranked by intent.
  const shelfIntentBooks = React.useCallback(
    (intent: UserReadingIntent) => matchBooksByIntent(intent, 100),
    [],
  )

  // A stable key per view for AnimatePresence exit animations.
  const viewKey =
    view.name === 'intent'
      ? 'intent'
      : view.name === 'intent-results'
        ? `intent-results-${view.intent.feel.join('-')}-${uiMode}`
        : view.name === 'results'
          ? `results-${view.query}-${view.page}-${uiMode}`
          : view.name === 'detail'
            ? `detail-${view.book.id}`
            : 'home'

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
        {/* Search progress bar */}
        <SearchProgress isLoading={isLoading} />

        {/* Global sticky header — glass morphism */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-2xs">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-y-2 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <Logo size="md" onClick={handleLogoClick} />
              {/* Classic / Shelf view switch — same data, two ways to browse. */}
              <div
                role="group"
                aria-label="Browsing style"
                className="inline-flex rounded-full border border-slate-200 bg-white p-0.5 text-[11px] font-semibold shadow-2xs"
              >
                {(['classic', 'shelf'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setUiMode(m)}
                    aria-pressed={uiMode === m}
                    className={`rounded-full px-2.5 py-1 capitalize transition-colors ${
                      uiMode === m
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
              {/* Reading Mood Match Quick Button */}
              <button
                type="button"
                onClick={() => setView({ name: 'intent' })}
                className={`items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-all hover:bg-blue-100/80 shadow-2xs active:scale-95 ${
                  uiMode === 'shelf' ? 'hidden sm:inline-flex' : 'inline-flex'
                }`}
              >
                <Compass className="size-3.5 text-blue-600" />
                <span>Reading Mood</span>
              </button>

              {/* Sign In Button */}
              {AUTH_ENABLED && <AuthButton />}

              {/* Saved Books button */}
              <button
                type="button"
                onClick={() => setReadingListOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 shadow-2xs active:scale-95"
                aria-label={`Saved books: ${readingList.length}`}
              >
                <Bookmark className="size-3.5 text-slate-500" />
                <span className={uiMode === 'shelf' ? 'hidden sm:inline' : undefined}>Saved Books</span>
                {readingList.length > 0 && (
                  <span className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                    {readingList.length}
                  </span>
                )}
              </button>

              {/* 18+ Mode Toggle */}
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className={uiMode === 'shelf' ? 'hidden sm:inline' : undefined}>18+ Mode</span>
                {uiMode === 'shelf' && <span className="sm:hidden">18+</span>}
                <Switch
                  checked={isAdultMode}
                  onCheckedChange={setIsAdultMode}
                  aria-label="Toggle 18+ Mode"
                />
              </div>

              {/* Keyboard Help (?) Button */}
              <button
                type="button"
                onClick={() => setKeyboardHelpOpen(true)}
                className={`size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-95 shadow-2xs ${
                  // Shelf mode: hidden for now (shortcuts still work, and the menu still has the entry).
                  uiMode === 'shelf' ? 'hidden' : 'inline-flex'
                }`}
                aria-label="Show keyboard shortcuts"
                title="Help & Shortcuts (?)"
              >
                <span className="text-xs font-bold font-mono">?</span>
              </button>

              {/* Hamburger Menu Dropdown & Modal */}
              <NavMenu onOpenKeyboardHelp={() => setKeyboardHelpOpen(true)} />
            </div>
          </div>
        </header>

      {/* Main view — animated transitions between intent/intent-results/home/results/detail */}
      <main className="flex-1">
        {/* initial={false}: the first view is already in the server HTML at full opacity.
            Fading it in from 0 after hydration hid the page (and the Largest Contentful
            Paint) until all the JavaScript had run. */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={viewKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {view.name === 'intent' && (
              <>
                <ReadingIntentView
                  onSubmitIntent={handleIntentSubmit}
                  onSkipToSearch={handleSkipToSearch}
                />
                {/* Server-rendered text and structured data for search and AI crawlers. */}
                <DiscoverIntro />
              </>
            )}

            {view.name === 'intent-results' && uiMode === 'shelf' && (
              <ShelfView
                books={shelfIntentBooks(view.intent).map((m) => m.book)}
                heading="Books that fit what you're looking for"
                subheading="Curated picks matched to your reading mood."
                chips={intentChipLabels(view.intent)}
                backLabel="Adjust reading mood"
                onBack={handleAdjustIntent}
                onSelectBook={handleSelectBook}
                onSearch={(q) => handleSearch(q, 1)}
                isLoading={isLoading}
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={toggleBookmark}
                initialIndex={shelfIndexRef.current}
                onActiveChange={(i) => {
                  shelfIndexRef.current = i
                }}
                getNote={(b) => {
                  const m = shelfIntentBooks(view.intent).find((x) => x.book.id === b.id)
                  return m ? { why: m.whySurfaced, mismatch: m.potentialMismatch } : undefined
                }}
              />
            )}

            {view.name === 'intent-results' && uiMode === 'classic' && (
              <IntentResultsView
                intent={view.intent}
                onSelectBook={handleSelectBook}
                onAdjustIntent={handleAdjustIntent}
                onDirectSearch={(q) => handleSearch(q, 1)}
                isLoading={isLoading}
              />
            )}

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

            {view.name === 'results' && uiMode === 'shelf' && (
              <ShelfView
                books={view.results}
                heading={`Results for “${view.query}”`}
                subheading={`About ${view.totalItems} results from ${
                  view.source === 'apple' ? 'Apple Books' : 'Google Books'
                }`}
                backLabel="Back to mood"
                onBack={handleBackFromResults}
                onSelectBook={handleSelectBook}
                onSearch={(q) => handleSearch(q, 1)}
                isLoading={isLoading}
                bookmarkedIds={bookmarkedIds}
                onToggleBookmark={toggleBookmark}
                initialIndex={shelfIndexRef.current}
                onActiveChange={(i) => {
                  shelfIndexRef.current = i
                }}
                pagination={{
                  page: view.page,
                  totalItems: view.totalItems,
                  maxResults: MAX_RESULTS,
                  onPageChange: (p) => handleSearch(view.query, p),
                }}
              />
            )}

            {view.name === 'results' && uiMode === 'classic' && (
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
              <div className={uiMode === 'shelf' ? 'shelf-theme' : undefined}>
              <DetailView
                lean={uiMode === 'shelf'}
                book={view.book}
                source={view.source}
                backLabel={
                  lastResultsRef.current
                    ? 'Back to results'
                    : lastIntentRef.current
                      ? 'Back to your picks'
                      : 'Back to mood discovery'
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
              </div>
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

      {/* Global Auth Modal */}
      {AUTH_ENABLED && <AuthModal />}
    </div>
    </AuthProvider>
  )
}
