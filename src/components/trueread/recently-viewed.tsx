'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock3, X } from 'lucide-react'
import type { Book } from '@/components/trueread/types'
import { CoverImage } from './cover-image'

/**
 * "Recently viewed" horizontal strip — shows the last N books the user opened
 * in the detail view. Persists via the parent (page-level localStorage).
 *
 * Pure real data: the parent passes in the actual Book objects the user
 * navigated to. Nothing is fabricated or generated.
 *
 * Hidden entirely when there are no recently-viewed books — no empty state
 * needed (this is a secondary, ambient strip, not a primary surface).
 */

export interface RecentlyViewedProps {
  /** Most-recent-first list of recently-viewed books (capped by the parent). */
  books: Book[]
  /** Open a book's detail when its mini card is clicked. */
  onSelect: (book: Book) => void
  /** Optional clear-all callback. If omitted, no clear button is shown. */
  onClear?: () => void
  /** Remove a single book from the recents list. */
  onRemove?: (id: string) => void
}

export function RecentlyViewed({
  books,
  onSelect,
  onClear,
  onRemove,
}: RecentlyViewedProps) {
  if (books.length === 0) return null

  return (
    <section
      className="mx-auto w-full max-w-5xl px-4 py-8 md:py-10"
      aria-labelledby="recently-viewed-heading"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Clock3 className="size-3.5" strokeWidth={2.25} />
            </span>
            <h2
              id="recently-viewed-heading"
              className="text-sm font-semibold uppercase tracking-wide text-slate-700"
            >
              Recently viewed
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {books.length}
            </span>
          </div>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
              aria-label="Clear recently viewed"
            >
              Clear
            </button>
          )}
        </div>

        {/* Horizontal scroll strip — hides scrollbar for a clean look */}
        <div className="trueread-scroll-x -mx-1 overflow-x-auto px-1 pb-2">
          <div className="flex gap-3">
            <AnimatePresence initial={false}>
              {books.map((book, i) => (
                <motion.div
                  key={book.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{
                    duration: 0.25,
                    delay: Math.min(i * 0.03, 0.18),
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="group/rv relative w-32 shrink-0 sm:w-36"
                >
                  <button
                    type="button"
                    onClick={() => onSelect(book)}
                    className="block w-full rounded-lg p-1 text-left transition-all hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                    aria-label={`Open ${book.title} again`}
                    title={book.title}
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200/70">
                      <CoverImage
                        book={book}
                        sizes="140px"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover/rv:scale-[1.04]"
                      />
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-tight text-slate-700 group-hover/rv:text-blue-700">
                      {book.title}
                    </p>
                    {book.authors.length > 0 && (
                      <p className="mt-0.5 truncate text-[10px] text-slate-400">
                        {book.authors[0]}
                      </p>
                    )}
                  </button>
                  {/* Remove button — appears on hover */}
                  {onRemove && (
                    <button
                      type="button"
                      onClick={() => onRemove(book.id)}
                      className="absolute right-0 top-0 hidden size-5 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm ring-1 ring-slate-200 backdrop-blur-sm transition-all hover:bg-red-50 hover:text-red-500 group-hover/rv:flex focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      aria-label={`Remove ${book.title} from recently viewed`}
                    >
                      <X className="size-3" strokeWidth={2.5} />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

export default RecentlyViewed
