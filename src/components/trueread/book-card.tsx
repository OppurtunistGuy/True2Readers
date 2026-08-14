'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Eye } from 'lucide-react'
import type { Book } from '@/components/trueread/types'
import { CoverImage } from './cover-image'
import { StarRating } from './star-rating'
import { BookmarkButton } from './reading-list'
import { cn } from '@/lib/utils'

export interface BookCardProps {
  book: Book
  onSelect: (book: Book) => void
  className?: string
  /** Index within the grid — used for staggered entrance animation. */
  index?: number
  /** Whether this book is in the reading list. */
  isBookmarked?: boolean
  /** Toggle bookmark. */
  onToggleBookmark?: (book: Book) => void
  /** Display variant: grid card or list row. */
  variant?: 'grid' | 'list'
}

/**
 * A single result card — a <motion.button> for accessibility, keyboard nav,
 * and a subtle entrance + hover animation.
 *
 * Grid variant: vertical card with cover, title, author, year, rating.
 * List variant: horizontal row with mini cover, title, author, year, rating.
 */
export function BookCard({
  book,
  onSelect,
  className,
  index = 0,
  isBookmarked = false,
  onToggleBookmark,
  variant = 'grid',
}: BookCardProps) {
  const authorsText =
    book.authors.length > 0 ? book.authors.join(', ') : 'Unknown author'

  // Short description for hover tooltip
  const shortDesc =
    book.description && book.description.length > 20
      ? book.description.slice(0, 120).replace(/\s+\S*$/, '') + '…'
      : null

  if (variant === 'list') {
    return (
      <motion.button
        type="button"
        onClick={() => onSelect(book)}
        aria-label={`Open details for ${book.title} by ${authorsText}`}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.28,
          delay: Math.min(index * 0.025, 0.3),
          ease: [0.22, 1, 0.36, 1],
        }}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.995 }}
        className={cn(
          'group flex w-full items-center gap-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 rounded-xl p-3 transition-colors hover:bg-white',
          className,
        )}
      >
        <div className="w-16 shrink-0">
          <CoverImage book={book} sizes="64px" className="w-full" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-sm font-semibold text-slate-900 transition-colors group-hover:text-blue-700">
            {book.title}
          </h3>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {authorsText}
          </p>
          <div className="mt-1 flex items-center gap-2">
            {book.year && (
              <span className="text-xs text-slate-400">{book.year}</span>
            )}
            <StarRating rating={book.rating} size="sm" showValue={false} />
          </div>
        </div>
        <div className="shrink-0 self-center">
          <Eye className="size-4 text-slate-300 transition-colors group-hover:text-blue-500" />
        </div>
      </motion.button>
    )
  }

  // Grid variant (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.32,
        delay: Math.min(index * 0.035, 0.4),
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        'group relative flex w-full flex-col text-left',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(book)}
        aria-label={`Open details for ${book.title} by ${authorsText}`}
        className="flex w-full flex-col gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 rounded-xl"
      >
        <div className="relative overflow-hidden rounded-xl transition-all duration-300 group-hover:shadow-xl group-focus-visible:shadow-xl ring-1 ring-slate-200/50 group-hover:ring-blue-200/60">
          <CoverImage book={book} className="w-full" />
          {/* Hover overlay with quick-peek text */}
          {shortDesc && (
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <p className="line-clamp-3 text-xs leading-relaxed text-slate-100">
                {shortDesc}
              </p>
            </div>
          )}
          {/* Hover "View" badge */}
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-slate-600 opacity-0 shadow-sm backdrop-blur-sm transition-all duration-200 group-hover:opacity-100">
            <Eye className="size-3" strokeWidth={2.25} />
            View
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3
            className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 transition-colors group-hover:text-blue-700"
            title={book.title}
          >
            {book.title}
          </h3>
          <p className="truncate text-xs text-slate-500" title={authorsText}>
            {authorsText}
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            {book.year && (
              <span className="text-xs text-slate-400">{book.year}</span>
            )}
            <StarRating rating={book.rating} size="sm" showValue={false} />
          </div>
        </div>
      </button>

      {/* Bookmark button — top-right corner of the card */}
      {onToggleBookmark && (
        <div className="absolute right-2 top-2 z-10">
          <BookmarkButton
            isBookmarked={isBookmarked}
            onClick={() => onToggleBookmark(book)}
            size="sm"
            className="shadow-sm backdrop-blur-sm"
          />
        </div>
      )}
    </motion.div>
  )
}

export default BookCard
