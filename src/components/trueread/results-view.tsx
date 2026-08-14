'use client'

import * as React from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Info,
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
}

type SortKey = 'relevance' | 'newest' | 'oldest'

const SKELETON_COUNT = 12

/**
 * Build a sliding window of visible page numbers, capped at `maxVisible`.
 */
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

/**
 * Results grid view. Shows a compact header (back + search), the results
 * header (query + count + sort), the responsive BookCard grid, and
 * pagination. Includes skeleton / empty / error states.
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
}: ResultsViewProps) {
  const [sort, setSort] = React.useState<SortKey>('relevance')
  const [searchValue, setSearchValue] = React.useState('')

  const sourceLabel = source === 'apple' ? 'Apple Books' : 'Google Books'

  // Reset sort when the query changes (new search = fresh page).
  React.useEffect(() => {
    setSort('relevance')
    setSearchValue('')
  }, [query])

  // Client-side sort of the current page's results.
  const sortedResults = React.useMemo(() => {
    if (sort === 'relevance') return results
    const withYear = (b: Book) => (b.year ? Number(b.year) : -Infinity)
    const copy = [...results]
    copy.sort((a, b) => {
      const ya = withYear(a)
      const yb = withYear(b)
      // missing-year always last (regardless of direction)
      if (ya === -Infinity && yb === -Infinity) return 0
      if (ya === -Infinity) return 1
      if (yb === -Infinity) return -1
      return sort === 'newest' ? yb - ya : ya - yb
    })
    return copy
  }, [results, sort])

  // Pagination math. Google Books doesn't reliably serve deep pages — cap at 8.
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
        </div>
      </div>

      {/* Transparent source banner — shown only when the Google Books primary
          source is unavailable and real results came from the Apple Books fallback. */}
      {source === 'apple' && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-slate-600">
          <Info className="mt-0.5 size-4 shrink-0 text-blue-600" />
          <p>
            <span className="font-medium text-slate-800">Google Books is temporarily unavailable</span>{' '}
            from this environment (shared-IP quota). Showing real results from{' '}
            <span className="font-medium text-blue-700">Apple Books</span> instead —
            covers and metadata are real; book previews will show
            “No preview available.”
          </p>
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
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : sortedResults.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          <div
            className={cn(
              'grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
              isLoading && 'opacity-60 transition-opacity',
            )}
          >
            {sortedResults.map((book) => (
              <BookCard key={book.id} book={book} onSelect={onSelectBook} />
            ))}
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
                  'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50',
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
      <p className="text-sm text-slate-500">
        Try a different title or topic.
      </p>
    </div>
  )
}

export default ResultsView
