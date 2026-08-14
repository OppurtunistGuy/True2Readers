'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Clock,
  ListX,
  X,
} from 'lucide-react'
import type { Book } from '@/components/trueread/types'
import { CoverImage } from './cover-image'
import { Button } from '@/components/ui/button'
import { estimateReadingTime } from './reading-insights'
import { cn } from '@/lib/utils'

export interface ReadingListProps {
  books: Book[]
  onRemove: (id: string) => void
  onClear: () => void
  onSelect: (book: Book) => void
  isOpen: boolean
  onToggle: () => void
}

/**
 * Slide-out reading list panel.
 * Shows bookmarked books with mini covers, titles, and authors.
 * Can remove individual items or clear all.
 */
export function ReadingList({
  books,
  onRemove,
  onClear,
  onSelect,
  isOpen,
  onToggle,
}: ReadingListProps) {
  return (
    <>
      {/* Floating trigger button — visible when panel is closed */}
      <AnimatePresence>
        {!isOpen && books.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            type="button"
            onClick={onToggle}
            className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-shadow hover:bg-blue-700 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-95"
            aria-label={`Reading list: ${books.length} book${books.length !== 1 ? 's' : ''}`}
          >
            <BookmarkCheck className="size-4" strokeWidth={2.25} />
            <span className="hidden sm:inline">{books.length}</span>
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white ring-2 ring-blue-600">
              {books.length}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Slide-out panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
              onClick={onToggle}
              aria-hidden="true"
            />

            {/* Panel */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl ring-1 ring-slate-200"
              role="dialog"
              aria-label="Reading list"
            >
              {/* Header */}
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <BookmarkCheck className="size-4" strokeWidth={2.25} />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">
                        Reading List
                      </h2>
                      <p className="text-xs text-slate-500">
                        {books.length} book{books.length !== 1 ? 's' : ''} saved
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {books.length > 0 && (
                      <button
                        type="button"
                        onClick={onClear}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Clear reading list"
                      >
                        <ListX className="size-3.5" strokeWidth={2} />
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onToggle}
                      className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Close reading list"
                    >
                      <X className="size-4" strokeWidth={2} />
                    </button>
                  </div>
                </div>
                {/* Stats row — total reading time derived from real page counts */}
                {books.length > 0 && (() => {
                  const totalMinutes = books.reduce((sum, b) => {
                    const rt = estimateReadingTime(b.pageCount)
                    return sum + (rt?.minutes ?? 0)
                  }, 0)
                  const withPages = books.filter(
                    (b) => b.pageCount != null && b.pageCount > 0,
                  ).length
                  if (totalMinutes === 0 && withPages === 0) return null
                  let timeLabel: string
                  if (totalMinutes < 60) {
                    timeLabel = `${totalMinutes} min`
                  } else {
                    const h = Math.floor(totalMinutes / 60)
                    const m = Math.round(totalMinutes % 60)
                    timeLabel = m === 0 ? `${h}h` : `${h}h ${m}m`
                  }
                  return (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50/60 px-3 py-2 ring-1 ring-blue-100/60">
                      <span className="inline-flex size-6 items-center justify-center rounded-md bg-white text-blue-600 shadow-sm">
                        <Clock className="size-3.5" strokeWidth={2.25} />
                      </span>
                      <span className="text-xs font-medium text-slate-700">
                        Est. reading time
                      </span>
                      <span className="ml-auto text-xs font-bold text-blue-700">
                        {timeLabel}
                      </span>
                    </div>
                  )
                })()}
              </div>

              {/* Book list */}
              <div className="flex-1 overflow-y-auto">
                {books.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                    <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Bookmark className="size-6" strokeWidth={1.75} />
                    </span>
                    <p className="text-sm font-medium text-slate-600">
                      No books saved yet
                    </p>
                    <p className="text-xs text-slate-400">
                      Click the bookmark icon on any book to save it here.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {books.map((book) => (
                      <li key={book.id} className="group relative px-5 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(book)
                            onToggle()
                          }}
                          className="flex w-full items-start gap-3 text-left transition-colors hover:bg-slate-50 rounded-lg p-1 -m-1"
                        >
                          <div className="w-12 shrink-0">
                            <CoverImage
                              book={book}
                              sizes="48px"
                              className="w-full"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-medium text-slate-900 group-hover:text-blue-700">
                              {book.title}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {book.authors.length > 0
                                ? book.authors.join(', ')
                                : 'Unknown author'}
                            </p>
                            {book.year && (
                              <p className="text-xs text-slate-400">
                                {book.year}
                              </p>
                            )}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemove(book.id)}
                          className="absolute right-4 top-4 hidden size-7 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 group-hover:flex"
                          aria-label={`Remove ${book.title} from reading list`}
                        >
                          <X className="size-3.5" strokeWidth={2} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

/**
 * Bookmark toggle button — heart or bookmark icon.
 * Used in book cards and detail view.
 */
export function BookmarkButton({
  isBookmarked,
  onClick,
  size = 'md',
  className,
}: {
  isBookmarked: boolean
  onClick: () => void
  size?: 'sm' | 'md'
  className?: string
}) {
  const iconSize = size === 'sm' ? 'size-4' : 'size-5'
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-all active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        isBookmarked
          ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          : 'bg-slate-100/80 text-slate-400 hover:bg-slate-200 hover:text-slate-600',
        size === 'sm' ? 'size-7' : 'size-8',
        className,
      )}
      aria-label={isBookmarked ? 'Remove from reading list' : 'Add to reading list'}
      aria-pressed={isBookmarked}
    >
      {isBookmarked ? (
        <BookmarkCheck className={iconSize} strokeWidth={2.25} />
      ) : (
        <Bookmark className={iconSize} strokeWidth={2} />
      )}
    </button>
  )
}

export default ReadingList
