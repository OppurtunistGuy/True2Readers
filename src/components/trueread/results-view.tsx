'use client'

import * as React from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Grid3X3,
  Info,
  LayoutList,
  Library,
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

  const sourceLabel = source === 'apple' ? 'Apple Books' : 'Google Books'

  // Reset sort + decade filter when the query changes (new search = fresh page).
  React.useEffect(() => {
    setSort('relevance')
    setSearchValue('')
    setActiveDecade(null)
    setViewMode('grid')
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

  // Apply the decade filter on top of the sorted list (client-side only).
  const visibleResults = React.useMemo(() => {
    if (activeDecade == null) return sortedResults
    return sortedResults.filter((b) => {
      if (!b.year) return false
      const y = Number(b.year)
      return Number.isFinite(y) && Math.floor(y / 10) * 10 === activeDecade
    })
  }, [sortedResults, activeDecade])

  // Pagination math. Sources don't reliably serve deep pages — cap at 8.
  const totalPages = Math.min(8, Math.max(1, Math.ceil(totalItems / maxResults)))
  const showPagination = totalItems > maxResults
  const visiblePages = pageWindow(page, totalPages, 5)

  const handleSortChange = (v: string) => {
    setSort(v as SortKey)
  }

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
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2
            className="truncate text-2xl font-bold text-slate-900"
            title={query}
          >
            {query}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            About{' '}
            <span className="font-medium text-slate-700">
              {totalItems.toLocaleString()}
            </span>{' '}
            results from {sourceLabel}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
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
      </div>

      {/* Transparent source banner — shown only when results came from the
          Apple Books fallback (Google Books environmentally unavailable). */}
      {source === 'apple' && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-slate-600">
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
        </div>
      )}

      {/* Decade jump-bar — client-side filter derived from the current page. */}
      {decades.length > 1 && !error && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
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
        </div>
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
          <EmptyState query={query} />
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
                onToggleBookmark={onToggleBookmark}
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
                onToggleBookmark={onToggleBookmark}
              />
            ))}
          </div>
        )}

        {/* Decade filter empty state — when the filter yields no books. */}
        {!error &&
          !isLoading &&
          visibleResults.length === 0 &&
          sortedResults.length > 0 &&
          activeDecade != null && (
            <div className="mt-6 flex flex-col items-center gap-2 rounded-xl bg-white px-6 py-8 text-center ring-1 ring-slate-200/70">
              <p className="text-sm text-slate-500">
                No books from the {activeDecade}s on this page.
              </p>
              <button
                type="button"
                onClick={() => setActiveDecade(null)}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Show all years
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
    </div>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-slate-200/70 trueread-shadow-card">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Library className="size-7" strokeWidth={1.75} />
      </span>
      <h3 className="text-lg font-semibold text-slate-900">
        No books found for &ldquo;{query}&rdquo;
      </h3>
      <p className="text-sm text-slate-500">Try a different title or topic.</p>
    </div>
  )
}

export default ResultsView
