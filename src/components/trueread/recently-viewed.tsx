'use client'

import * as React from 'react'
import { ChevronRight, Clock } from 'lucide-react'
import type { Book } from '@/components/trueread/types'
import { CoverImage } from './cover-image'

const DEFAULT_RECENT_ITEMS: Book[] = [
  {
    id: 'atomic-habits',
    title: 'Atomic Habits',
    authors: ['James Clear'],
    year: '2018',
    cover: 'https://books.google.com/books/content?id=f2ScDwAAQBAJ&printsec=frontcover&img=1&zoom=1',
  },
  {
    id: 'girls-in-snow',
    title: 'The Girls in the Snow',
    authors: ['Stacy Green'],
    year: '2020',
  },
  {
    id: 'short-fiction',
    title: 'Short Fiction',
    authors: ['Vsevolod Garshin'],
    year: '1888',
  },
  {
    id: 'the-alchemist',
    title: 'The Alchemist',
    authors: ['Paulo Coelho'],
    year: '1988',
  },
]

export interface RecentlyViewedProps {
  /** Most-recent-first list of recently-viewed books. */
  books?: Book[]
  /** Open a book's detail when clicked. */
  onSelect?: (book: Book) => void
  /** Optional clear-all callback. */
  onClear?: () => void
  /** Remove a single book. */
  onRemove?: (id: string) => void
}

export function RecentlyViewed({
  books = [],
  onSelect,
}: RecentlyViewedProps) {
  const displayBooks = React.useMemo(() => {
    if (books && books.length > 0) {
      return books.slice(0, 4)
    }
    return DEFAULT_RECENT_ITEMS
  }, [books])

  return (
    <section
      className="mx-auto w-full max-w-4xl px-4 py-6"
      aria-labelledby="recently-viewed-heading"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-200/60">
            <Clock className="size-3.5" strokeWidth={2.25} />
          </span>
          <h2
            id="recently-viewed-heading"
            className="text-sm font-bold tracking-tight text-slate-800"
          >
            Recently viewed
          </h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
            {displayBooks.length}
          </span>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
        >
          <span>View all</span>
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        {displayBooks.map((book, index) => (
          <button
            key={book.id || index}
            type="button"
            onClick={() => onSelect?.(book)}
            className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50/80 focus:outline-none ${
              index !== displayBooks.length - 1 ? 'border-b border-slate-100' : ''
            }`}
          >
            <div className="flex items-center gap-3 truncate pr-4 text-sm">
              {/* Cover thumbnail image */}
              <div className="relative h-11 w-8 shrink-0 overflow-hidden rounded bg-slate-100 shadow-2xs border border-slate-200">
                <CoverImage book={book} className="h-full w-full object-cover" />
              </div>
              <div className="flex items-center gap-2 truncate">
                <span className="font-bold text-slate-900 truncate">
                  {book.title}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 truncate font-medium">
                  {book.authors?.join(', ') || 'Unknown Author'}
                </span>
              </div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-slate-400" strokeWidth={2} />
          </button>
        ))}
      </div>
    </section>
  )
}

export default RecentlyViewed
