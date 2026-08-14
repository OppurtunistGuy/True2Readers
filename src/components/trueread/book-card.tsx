'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import type { Book } from '@/components/trueread/types'
import { CoverImage } from './cover-image'
import { cn } from '@/lib/utils'

export interface BookCardProps {
  book: Book
  onSelect: (book: Book) => void
  className?: string
  /** Index within the grid — used for staggered entrance animation. */
  index?: number
}

/**
 * A single result card — a <motion.button> for accessibility, keyboard nav,
 * and a subtle entrance + hover animation.
 */
export function BookCard({ book, onSelect, className, index = 0 }: BookCardProps) {
  const authorsText =
    book.authors.length > 0 ? book.authors.join(', ') : 'Unknown author'

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(book)}
      aria-label={`Open details for ${book.title} by ${authorsText}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.32,
        delay: Math.min(index * 0.035, 0.4),
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -4 }}
      whileFocus={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'group flex w-full flex-col gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 rounded-xl',
        className,
      )}
    >
      <div className="transition-shadow duration-300 group-hover:shadow-xl group-focus-visible:shadow-xl">
        <CoverImage book={book} className="w-full" />
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
        {book.year && (
          <p className="text-xs text-slate-400">{book.year}</p>
        )}
      </div>
    </motion.button>
  )
}

export default BookCard
