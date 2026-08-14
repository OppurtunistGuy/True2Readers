'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Check, Eye, GitCompare } from 'lucide-react'
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
  /** Whether compare mode is active (shows a select checkbox on the card). */
  compareMode?: boolean
  /** Whether this book is currently selected for comparison. */
  isCompareSelected?: boolean
  /** Toggle comparison selection. */
  onToggleCompare?: (book: Book) => void
  /** Whether this card is currently keyboard-focused (arrow-key nav). */
  isFocused?: boolean
  /** Ref to attach to the main click target (for arrow-key focus management). */
  mainButtonRef?: React.Ref<HTMLButtonElement>
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
  compareMode = false,
  isCompareSelected = false,
  onToggleCompare,
  isFocused = false,
  mainButtonRef,
}: BookCardProps) {
  const authorsText =
    book.authors.length > 0 ? book.authors.join(', ') : 'Unknown author'

  // Short description for hover tooltip
  const shortDesc =
    book.description && book.description.length > 20
      ? book.description.slice(0, 120).replace(/\s+\S*$/, '') + '…'
      : null

  // Handle the compare-select click — stops propagation so the card itself
  // doesn't navigate to detail.
  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleCompare?.(book)
  }

  if (variant === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.28,
          delay: Math.min(index * 0.025, 0.3),
          ease: [0.22, 1, 0.36, 1],
        }}
        className={cn(
          'group relative flex w-full items-center gap-4 rounded-xl p-3 transition-colors hover:bg-white',
          isCompareSelected && 'bg-blue-50/60 ring-1 ring-blue-200',
          className,
        )}
      >
        <button
          type="button"
          ref={mainButtonRef}
          onClick={() => onSelect(book)}
          aria-label={`Open details for ${book.title} by ${authorsText}`}
          className={cn(
            'flex flex-1 items-center gap-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 rounded-lg',
            isFocused && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-50',
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
            <div className="mt-0.5 flex items-center gap-2">
              {book.year && (
                <span className="text-xs tabular-nums text-slate-400">{book.year}</span>
              )}
              <StarRating rating={book.rating} size="sm" showValue={false} />
            </div>
          </div>
        </button>
        {/* Compare select button (sibling, not nested) */}
        {compareMode && onToggleCompare && (
          <button
            type="button"
            onClick={handleCompareClick}
            className={cn(
              'shrink-0 self-center inline-flex size-8 items-center justify-center rounded-full transition-all active:scale-90',
              isCompareSelected
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-400 hover:bg-blue-100 hover:text-blue-600',
            )}
            aria-label={isCompareSelected ? `Remove ${book.title} from comparison` : `Add ${book.title} to comparison`}
            aria-pressed={isCompareSelected}
          >
            {isCompareSelected ? (
              <Check className="size-4" strokeWidth={2.5} />
            ) : (
              <GitCompare className="size-4" strokeWidth={2} />
            )}
          </button>
        )}
        {/* Bookmark button (sibling, not nested) — hidden in compare mode */}
        {!compareMode && onToggleBookmark && (
          <BookmarkButton
            isBookmarked={isBookmarked}
            onClick={() => onToggleBookmark(book)}
            size="sm"
            className="shrink-0 self-center"
          />
        )}
        {!compareMode && !onToggleBookmark && (
          <div className="shrink-0 self-center">
            <Eye className="size-4 text-slate-300 transition-colors group-hover:text-blue-500" />
          </div>
        )}
      </motion.div>
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
        isCompareSelected && 'rounded-xl',
        className,
      )}
    >
      <button
        type="button"
        ref={mainButtonRef}
        onClick={() => onSelect(book)}
        aria-label={`Open details for ${book.title} by ${authorsText}`}
        className={cn(
          'flex w-full flex-col gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 rounded-xl',
          isFocused && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-50 rounded-xl',
        )}
      >
        <div className={cn(
          'relative overflow-hidden rounded-xl transition-all duration-300 group-hover:shadow-xl group-focus-visible:shadow-xl ring-1 group-hover:ring-blue-200/60',
          isCompareSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'ring-slate-200/50',
        )}>
          <div className="transition-transform duration-300 ease-out group-hover:scale-[1.03]">
            <CoverImage book={book} className="w-full" />
          </div>
          {/* Hover overlay with quick-peek text */}
          {shortDesc && !compareMode && (
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <p className="line-clamp-3 text-xs leading-relaxed text-slate-100">
                {shortDesc}
              </p>
            </div>
          )}
          {/* Hover "View" badge — hidden in compare mode. Bottom-left to
              avoid colliding with the bookmark button at top-right. */}
          {!compareMode && (
            <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-slate-600 opacity-0 shadow-sm backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1">
              <Eye className="size-3" strokeWidth={2.25} />
              View
            </div>
          )}
          {/* Selected checkmark overlay (top-left in compare mode) */}
          {compareMode && isCompareSelected && (
            <div className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
              <Check className="size-2.5" strokeWidth={3} />
              Selected
            </div>
          )}
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
              <span className="text-xs tabular-nums text-slate-400">{book.year}</span>
            )}
            <StarRating rating={book.rating} size="sm" showValue={false} />
          </div>
        </div>
      </button>

      {/* Bookmark button — top-right corner of the card (hidden in compare mode) */}
      {!compareMode && onToggleBookmark && (
        <div className="absolute right-2 top-2 z-10">
          <BookmarkButton
            isBookmarked={isBookmarked}
            onClick={() => onToggleBookmark(book)}
            size="sm"
            className="shadow-sm backdrop-blur-sm"
          />
        </div>
      )}

      {/* Compare select badge — only in compare mode. Rendered as a SIBLING
          of the main card button (not nested inside it) so the browser
          doesn't strip the inner <button>. */}
      {compareMode && onToggleCompare && (
        <button
          type="button"
          onClick={handleCompareClick}
          className={cn(
            'absolute right-2 top-2 z-10 inline-flex size-9 items-center justify-center rounded-full shadow-md backdrop-blur-sm transition-all active:scale-90',
            isCompareSelected
              ? 'bg-blue-600 text-white ring-2 ring-blue-300'
              : 'bg-white/95 text-slate-600 hover:bg-blue-50 hover:text-blue-600',
          )}
          aria-label={isCompareSelected ? `Remove ${book.title} from comparison` : `Add ${book.title} to comparison`}
          aria-pressed={isCompareSelected}
        >
          {isCompareSelected ? (
            <Check className="size-4" strokeWidth={2.5} />
          ) : (
            <GitCompare className="size-4" strokeWidth={2} />
          )}
        </button>
      )}
    </motion.div>
  )
}

export default BookCard
