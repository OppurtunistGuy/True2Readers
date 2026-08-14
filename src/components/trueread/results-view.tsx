'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Grid3X3,
  Info,
  LayoutList,
  SearchX,
  Filter,
  Star,
  GitCompare,
  X,
  User,
} from 'lucide-react'
import type { Book, BookSource } from '@/components/trueread/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BookCard } from './book-card'
import { SearchBar } from './search-bar'
import { CompareModal } from './compare-modal'
import { formatQueryForDisplay, isAuthorSearch } from './query-format'
import { cn } from '@/lib/utils'

export interface ResultsViewProps {
  query: string
  results: Book[]
  totalItems: number
  page: number
  maxResults: number
  source: BookSource
  isLoading: boolean
  error: string | null
  onSearch: (q: string) => void
  onSelectBook: (book: Book) => void
  onPageChange: (page: number) => void
  onBack: () => void
  /** Reading list membership for bookmark badges. */
  bookmarkedIds?: Set<string>
  /** Toggle bookmark on a book. */
  onToggleBookmark?: (book: Book) => void
}

type SortKey = 'relevance' | 'newest' | 'oldest'
type ViewMode = 'grid' | 'list'

const SKELETON_COUNT = 12
/** Max books that can be selected for comparison. */
const MAX_COMPARE = 3

/** Build a sliding window of visible page numbers, capped at `maxVisible`. */
function pageWindow(current: number, total: number, maxVisible = 5): number[] {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const half = Math.floor(maxVisible / 2)
  let start = current - half
  let end = current + half
  if (start < 1) {
    start = 1
    end = maxVisible
  }
  if (end > total) {
    end = total
    start = total - maxVisible + 1
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

/** Derive sorted decade buckets from the current page's books. */
function deriveDecades(books: Book[]): { decade: number; label: string; count: number }[] {
  const counts = new Map<number, number>()
  for (const b of books) {
    if (!b.year) continue
    const y = Number(b.year)
    if (!Number.isFinite(y)) continue
    const decade = Math.floor(y / 10) * 10
    counts.set(decade, (counts.get(decade) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([decade, count]) => ({ decade, label: `${decade}s`, count }))
    .sort((a, b) => a.decade - b.decade)
}

/** Animated number counter. */
function AnimatedCount({ value }: { value: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="inline-block font-medium text-slate-700"
    >
      {value.toLocaleString()}
    </motion.span>
  )
}

/** Rating filter options. */
const RATING_FILTERS = [
  { value: 0, label: 'Any rating' },
  { value: 4, label: '4+ stars' },
  { value: 3, label: '3+ stars' },
] as const

/**
 * Results grid view. Shows a compact header (back + search), the results
 * header (query + count + sort), an optional decade jump-bar, the responsive
 * BookCard grid, and pagination. Includes skeleton / empty / error states.
 */
export function ResultsView({
  query,
  results,
  totalItems,
  page,
  maxResults,
  source,
  isLoading,
  error,
  onSearch,
  onSelectBook,
  onPageChange,
  onBack,
  bookmarkedIds,
  onToggleBookmark,
}: ResultsViewProps) {
  const [sort, setSort] = React.useState<SortKey>('relevance')
  const [searchValue, setSearchValue] = React.useState('')
  const [activeDecade, setActiveDecade] = React.useState<number | null>(null)
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid')
  const [minRating, setMinRating] = React.useState<number>(0)
  const [compareMode, setCompareMode] = React.useState(false)
  const [compareSelected, setCompareSelected] = React.useState<Book[]>([])
  const [compareOpen, setCompareOpen] = React.useState(false)
  // Index of the keyboard-focused book card (-1 = none). Used by arrow-key
  // navigation between result cards. Reset whenever the visible results change.
  const [focusedIndex, setFocusedIndex] = React.useState<number>(-1)
  // Refs to each card button — used to call .focus() on the active card so
  // the browser's native focus ring matches our keyboard nav.
  const cardRefs = React.useRef<Array<HTMLButtonElement | null>>([])

  const sourceLabel = source === 'apple' ? 'Apple Books' : 'Google Books'
  const displayQuery = formatQueryForDisplay(query)
  const isAuthor = isAuthorSearch(query)

  // Reset sort + decade filter + compare mode when the query changes (new search = fresh page).
  React.useEffect(() => {
    setSort('relevance')
    setSearchValue('')
    setActiveDecade(null)
    setViewMode('grid')
    setMinRating(0)
    setCompareMode(false)
    setCompareSelected([])
    setFocusedIndex(-1)
  }, [query])

  // Client-side sort of the current page's results.
  const sortedResults = React.useMemo(() => {
    if (sort === 'relevance') return results
    const withYear = (b: Book) => (b.year ? Number(b.year) : -Infinity)
    const copy = [...results]
    copy.sort((a, b) => {
      const ya = withYear(a)
      const yb = withYear(b)
      if (ya === -Infinity && yb === -Infinity) return 0
      if (ya === -Infinity) return 1
      if (yb === -Infinity) return -1
      return sort === 'newest' ? yb - ya : ya - yb
    })
    return copy
  }, [results, sort])

  // Decade buckets derived from the (sorted) current page.
  const decades = React.useMemo(
    () => deriveDecades(sortedResults),
    [sortedResults],
  )

  // Apply the decade + rating filters on top of the sorted list (client-side only).
  const visibleResults = React.useMemo(() => {
    return sortedResults.filter((b) => {
      // Decade filter
      if (activeDecade != null) {
        if (!b.year) return false
        const y = Number(b.year)
        if (!Number.isFinite(y) || Math.floor(y / 10) * 10 !== activeDecade) return false
      }
      // Rating filter
      if (minRating > 0) {
        if (b.rating == null || !Number.isFinite(b.rating) || b.rating < minRating) return false
      }
      return true
    })
  }, [sortedResults, activeDecade, minRating])

  // Reset focused index whenever the visible results change (filter/sort/page).
  React.useEffect(() => {
    setFocusedIndex(-1)
  }, [visibleResults, activeDecade, minRating, sort, page])

  // Arrow-key navigation between cards. Detects the current grid column
  // count from the viewport width (matches the Tailwind grid breakpoints).
  // Only active in grid view mode and when the user isn't typing in an input.
  React.useEffect(() => {
    if (viewMode !== 'grid') return
    const colsForWidth = (w: number) => {
      if (w >= 1280) return 5 // xl
      if (w >= 1024) return 4 // lg
      if (w >= 640) return 3  // sm
      return 2                // base
    }
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isTyping =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.tagName === 'SELECT')
      if (isTyping) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const cols = colsForWidth(window.innerWidth)
      const max = visibleResults.length
      if (max === 0) return

      let next = focusedIndex
      if (e.key === 'ArrowRight') next = Math.min(max - 1, focusedIndex + 1)
      else if (e.key === 'ArrowLeft') next = Math.max(0, focusedIndex - 1)
      else if (e.key === 'ArrowDown') next = Math.min(max - 1, focusedIndex + cols)
      else if (e.key === 'ArrowUp') next = Math.max(0, focusedIndex - cols)
      else if (e.key === 'Home') next = 0
      else if (e.key === 'End') next = max - 1
      else return

      e.preventDefault()
      if (next !== focusedIndex) {
        setFocusedIndex(next)
        // Defer focus to next tick so the ref array is up to date.
        requestAnimationFrame(() => {
          cardRefs.current[next]?.focus()
        })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [viewMode, focusedIndex, visibleResults.length])

  // Pagination math. Sources don't reliably serve deep pages — cap at 8.
  const totalPages = Math.min(8, Math.max(1, Math.ceil(totalItems / maxResults)))
  const showPagination = totalItems > maxResults
  const visiblePages = pageWindow(page, totalPages, 5)

  const handleSortChange = (v: string) => {
    setSort(v as SortKey)
  }

  // Toggle compare selection (max MAX_COMPARE).
  const handleToggleCompare = (book: Book) => {
    setCompareSelected((prev) => {
      const idx = prev.findIndex((b) => b.id === book.id)
      if (idx >= 0) {
        return prev.filter((b) => b.id !== book.id)
      }
      if (prev.length >= MAX_COMPARE) return prev
      return [...prev, book]
    })
  }

  // Exit compare mode clears selections.
  const handleExitCompareMode = () => {
    setCompareMode(false)
    setCompareSelected([])
  }

  // Compare selected IDs for quick lookup
  const compareSelectedIds = React.useMemo(
    () => new Set(compareSelected.map((b) => b.id)),
    [compareSelected],
  )

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:py-10">
      {/* Compact header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="h-10 w-fit gap-2 px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Button>

        <SearchBar
          value={searchValue}
          onChange={setSearchValue}
          onSubmit={onSearch}
          isLoading={isLoading}
          variant="compact"
          placeholder="Search again…"
          className="sm:w-80 md:w-96"
        />
      </div>

      {/* Results header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isAuthor && (
              <span className="inline-flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <User className="size-3.5" strokeWidth={2.25} />
              </span>
            )}
            <h2
              className="truncate text-2xl font-bold text-slate-900"
              title={displayQuery}
            >
              {displayQuery}
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            About{' '}
            <AnimatedCount value={totalItems} />{' '}
            results from {sourceLabel}
            {totalItems > 0 && (
              <span className="ml-2 hidden text-xs text-slate-400 sm:inline">
                · Showing{' '}
                <span className="font-medium text-slate-500">
                  {(page - 1) * maxResults + 1}–
                  {Math.min(page * maxResults, totalItems)}
                </span>
              </span>
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Compare toggle button */}
          {results.length >= 2 && (
            <button
              type="button"
              onClick={() => {
                if (compareMode) {
                  handleExitCompareMode()
                } else {
                  setCompareMode(true)
                }
              }}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-all active:scale-95',
                compareMode
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
              )}
              aria-pressed={compareMode}
              aria-label="Toggle compare mode"
            >
              <GitCompare className="size-3.5" strokeWidth={2.25} />
              <span className="hidden sm:inline">Compare</span>
            </button>
          )}

          <span className="text-sm text-slate-500" id="sort-label">
            Sort:
          </span>
          <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger
              size="sm"
              className="h-9 w-36 bg-white"
              aria-label="Sort results"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'inline-flex size-8 items-center justify-center rounded-md transition-all',
                viewMode === 'grid'
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600',
              )}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <Grid3X3 className="size-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'inline-flex size-8 items-center justify-center rounded-md transition-all',
                viewMode === 'list'
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600',
              )}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
            >
              <LayoutList className="size-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Transparent source banner — shown only when results came from the
          Apple Books fallback (Google Books environmentally unavailable). */}
      {source === 'apple' && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-slate-600"
        >
          <Info className="mt-0.5 size-4 shrink-0 text-blue-600" />
          <p>
            <span className="font-medium text-slate-800">
              Google Books is temporarily unavailable
            </span>{' '}
            from this environment (shared-IP quota). Showing real results from{' '}
            <span className="font-medium text-blue-700">Apple Books</span>{' '}
            instead — covers and metadata are real; book previews will show
            &ldquo;No preview available.&rdquo;
          </p>
        </motion.div>
      )}

      {/* Compare mode banner — appears when compare mode is active */}
      <AnimatePresence>
        {compareMode && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <GitCompare className="size-4 text-blue-600" strokeWidth={2.25} />
                <span className="font-medium">
                  Select {compareSelected.length}/{MAX_COMPARE} books to compare
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setCompareOpen(true)}
                  disabled={compareSelected.length < 2}
                  className="h-8 gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
                >
                  <GitCompare className="size-3.5" strokeWidth={2.25} />
                  Compare {compareSelected.length >= 2 ? `${compareSelected.length} books` : '(need 2+)'}
                </Button>
                <button
                  type="button"
                  onClick={handleExitCompareMode}
                  className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white hover:text-slate-700"
                  aria-label="Exit compare mode"
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decade + rating filters — client-side filters derived from the current page. */}
      {(decades.length > 1 || minRating > 0 || sortedResults.some((b) => b.rating != null && b.rating > 0)) && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-4 flex flex-wrap items-center gap-2"
        >
          <Filter className="size-3.5 text-slate-400" strokeWidth={2} />

          {/* Year filter */}
          {decades.length > 1 && (
            <>
              <span className="text-xs font-medium text-slate-500">Year:</span>
              <button
                type="button"
                onClick={() => setActiveDecade(null)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50',
                  activeDecade == null
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
                )}
              >
                All
              </button>
              {decades.map((d) => (
                <button
                  key={d.decade}
                  type="button"
                  onClick={() =>
                    setActiveDecade((cur) => (cur === d.decade ? null : d.decade))
                  }
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50',
                    activeDecade === d.decade
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
                  )}
                  aria-pressed={activeDecade === d.decade}
                >
                  {d.label}
                  <span className="ml-1 opacity-60">{d.count}</span>
                </button>
              ))}
            </>
          )}

          {/* Rating filter — only shown if some books have ratings */}
          {sortedResults.some((b) => b.rating != null && b.rating > 0) && (
            <>
              <span className="ml-2 text-xs font-medium text-slate-500">Rating:</span>
              {RATING_FILTERS.map((rf) => (
                <button
                  key={rf.value}
                  type="button"
                  onClick={() => setMinRating(rf.value)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50',
                    minRating === rf.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
                  )}
                  aria-pressed={minRating === rf.value}
                >
                  {rf.value > 0 && <Star className="size-3 fill-current" strokeWidth={0} />}
                  {rf.label}
                </button>
              ))}
            </>
          )}
        </motion.div>
      )}

      {/* Body */}
      <div className="mt-6">
        {error ? (
          <Alert variant="destructive" className="bg-white">
            <AlertCircle className="size-4" />
            <AlertTitle>Search failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : isLoading && results.length === 0 ? (
          <div className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              : 'flex flex-col gap-3',
          )}>
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              viewMode === 'grid' ? (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="trueread-shimmer aspect-[2/3] w-full rounded-lg" />
                  <Skeleton className="trueread-shimmer h-4 w-5/6" />
                  <Skeleton className="trueread-shimmer h-3 w-3/4" />
                  <Skeleton className="trueread-shimmer h-3 w-1/3" />
                </div>
              ) : (
                <div key={i} className="flex items-center gap-4 rounded-xl p-3">
                  <Skeleton className="trueread-shimmer size-16 rounded-lg shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <Skeleton className="trueread-shimmer h-4 w-2/3" />
                    <Skeleton className="trueread-shimmer h-3 w-1/2" />
                  </div>
                </div>
              )
            ))}
          </div>
        ) : visibleResults.length === 0 ? (
          <EmptyState query={displayQuery} />
        ) : viewMode === 'grid' ? (
          <div
            className={cn(
              'grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
              isLoading && 'opacity-60 transition-opacity',
            )}
          >
            {visibleResults.map((book, i) => (
              <BookCard
                key={book.id}
                book={book}
                onSelect={onSelectBook}
                index={i}
                variant="grid"
                isBookmarked={bookmarkedIds?.has(book.id) ?? false}
                onToggleBookmark={compareMode ? undefined : onToggleBookmark}
                compareMode={compareMode}
                isCompareSelected={compareSelectedIds.has(book.id)}
                onToggleCompare={handleToggleCompare}
                isFocused={focusedIndex === i}
                mainButtonRef={(el) => {
                  cardRefs.current[i] = el
                }}
              />
            ))}
          </div>
        ) : (
          <div
            className={cn(
              'flex flex-col gap-2 rounded-2xl bg-white p-2 ring-1 ring-slate-200/70 trueread-shadow-card',
              isLoading && 'opacity-60 transition-opacity',
            )}
          >
            {visibleResults.map((book, i) => (
              <BookCard
                key={book.id}
                book={book}
                onSelect={onSelectBook}
                index={i}
                variant="list"
                isBookmarked={bookmarkedIds?.has(book.id) ?? false}
                onToggleBookmark={compareMode ? undefined : onToggleBookmark}
                compareMode={compareMode}
                isCompareSelected={compareSelectedIds.has(book.id)}
                onToggleCompare={handleToggleCompare}
                isFocused={focusedIndex === i}
                mainButtonRef={(el) => {
                  cardRefs.current[i] = el
                }}
              />
            ))}
          </div>
        )}

        {/* Filter empty state — when filters yield no books. */}
        {!error &&
          !isLoading &&
          visibleResults.length === 0 &&
          sortedResults.length > 0 &&
          (activeDecade != null || minRating > 0) && (
            <div className="mt-6 flex flex-col items-center gap-2 rounded-xl bg-white px-6 py-8 text-center ring-1 ring-slate-200/70">
              <p className="text-sm text-slate-500">
                {activeDecade != null && minRating > 0
                  ? `No books from the ${activeDecade}s with ${minRating}+ stars on this page.`
                  : activeDecade != null
                    ? `No books from the ${activeDecade}s on this page.`
                    : `No books with ${minRating}+ stars on this page.`}
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveDecade(null)
                  setMinRating(0)
                }}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
      </div>

      {/* Pagination */}
      {showPagination && !error && sortedResults.length > 0 && (
        <nav
          aria-label="Results pagination"
          className="mt-12 flex flex-wrap items-center justify-center gap-2"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="h-9 gap-1.5 border-slate-200 bg-white px-3 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Prev</span>
          </Button>

          {visiblePages.map((p) => {
            const isActive = p === page
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                disabled={isLoading}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Go to page ${p}`}
                className={cn(
                  'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 active:scale-95',
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )}
              >
                {p}
              </button>
            )
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="h-9 gap-1.5 border-slate-200 bg-white px-3 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <span className="hidden sm:inline">Next</span>
            <ArrowRight className="size-4" />
          </Button>
        </nav>
      )}

      {/* Compare modal */}
      <CompareModal
        books={compareSelected}
        isOpen={compareOpen}
        onClose={() => setCompareOpen(false)}
        onSelectBook={onSelectBook}
      />
    </div>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-slate-200/70 trueread-shadow-card"
    >
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <SearchX className="size-7" strokeWidth={1.75} />
      </span>
      <h3 className="text-lg font-semibold text-slate-900">
        No books found for &ldquo;{query}&rdquo;
      </h3>
      <p className="text-sm text-slate-500">Try a different title or topic.</p>
    </motion.div>
  )
}

export default ResultsView
