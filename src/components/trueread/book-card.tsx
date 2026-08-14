'use client'

import * as React from 'react'
import type { Book } from '@/components/trueread/types'
import { CoverImage } from './cover-image'
import { cn } from '@/lib/utils'

export interface BookCardProps {
  book: Book
  onSelect: (book: Book) => void
  className?: string
}

/**
 * A single result card — a <button> for accessibility & keyboard nav,
 * containing a cover image (with hover lift) and a left-aligned text block.
 */
export function BookCard({ book, onSelect, className }: BookCardProps) {
  const authorsText =
    book.authors.length > 0 ? book.authors.join(', ') : 'Unknown author'

  return (
    <button
      type="button"
      onClick={() => onSelect(book)}
      aria-label={`Open details for ${book.title} by ${authorsText}`}
      className={cn(
        'group flex w-full flex-col gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 rounded-xl',
        className,
      )}
    >
      <div className="transition-transform duration-300 group-hover:-translate-y-1 group-focus-visible:-translate-y-1">
        <CoverImage
          book={book}
          className="group-hover:shadow-lg group-focus-visible:shadow-lg transition-shadow duration-300"
        />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h3
          className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900"
          title={book.title}
        >
          {book.title}
        </h3>
        <p className="truncate text-xs text-slate-500" title={authorsText}>
          {authorsText}
        </p>
        {book.year && (
          <p className="text-xs text-slate-400">{book.year}</p>
        )}
      </div>
    </button>
  )
}

export default BookCard
