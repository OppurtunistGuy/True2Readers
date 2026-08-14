'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bookmark,
  BookmarkCheck,
  Clock,
  Copy,
  FolderTree,
  LayoutList,
  ListX,
  Sparkles,
  X,
} from 'lucide-react'
import type { Book } from '@/components/trueread/types'
import { CoverImage } from './cover-image'
import { Button } from '@/components/ui/button'
import { estimateReadingTime } from './reading-insights'
import { useLocalStorage } from './use-local-storage'
import { cn } from '@/lib/utils'

/**
 * Reading-list capacity — used purely for the progress bar visual. Books are
 * still accepted past this cap (the parent enforces its own hard cap of 30
 * via MAX_READING_LIST in page.tsx). This is a "goal" indicator, not a limit.
 */
const READING_LIST_GOAL = 20
/** localStorage key for the saved view-mode preference. */
const LS_KEY_VIEW = 'trueread:reading-list-view:v1'

export interface ReadingListProps {
  books: Book[]
  onRemove: (id: string) => void
  onClear: () => void
  onSelect: (book: Book) => void
  isOpen: boolean
  onToggle: () => void
  /** Optional toast notifier (used for the "Copy all titles" feedback). */
  onToast?: (toast: { title: string; description?: string; duration?: number }) => void
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
  onToast,
}: ReadingListProps) {
  // View mode: "list" (default — flat list of horizontal cards) or
  // "category" (grouped by primary category). Persisted to localStorage.
  const [viewMode, setViewMode] = useLocalStorage<'list' | 'category'>(
    LS_KEY_VIEW,
    'list',
  )

  // "Copy all titles" — copies a real, plain-text list of every saved book
  // (title + author + year) to the clipboard. Surfaces a toast on both
  // success and failure so the user always knows what happened.
  const handleCopyAll = React.useCallback(async () => {
    if (books.length === 0) return
    const lines = books.map((b, i) => {
      const author = b.authors.length > 0 ? b.authors.join(', ') : 'Unknown author'
      const year = b.year ? ` (${b.year})` : ''
      return `${i + 1}. ${b.title} — ${author}${year}`
    })
    const text = `My TrueRead reading list (${books.length} book${books.length !== 1 ? 's' : ''}):\n\n${lines.join('\n')}`
    let succeeded = false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        succeeded = true
      }
    } catch {
      succeeded = false
    }
    if (succeeded) {
      onToast?.({
        title: 'Reading list copied',
        description: `${books.length} book${books.length !== 1 ? 's' : ''} ready to paste anywhere.`,
        duration: 2400,
      })
    } else {
      onToast?.({
        title: 'Couldn’t copy automatically',
        description: 'Your browser blocked clipboard access.',
        duration: 3000,
      })
    }
  }, [books, onToast])

  // Progress toward the soft "goal" — capped at 100% for the bar width.
  const progressPct = Math.min(100, (books.length / READING_LIST_GOAL) * 100)
  const goalReached = books.length >= READING_LIST_GOAL

  // Group books by primary category for the "By category" view. Sorted
  // alphabetically by category name; books with no categories land in an
  // "Uncategorized" bucket.
  const grouped = React.useMemo(() => {
    const map = new Map<string, Book[]>()
    for (const b of books) {
      const cat =
        b.categories && b.categories.length > 0 ? b.categories[0] : 'Uncategorized'
      const existing = map.get(cat)
      if (existing) existing.push(b)
      else map.set(cat, [b])
    }
    return Array.from(map.entries())
      .map(([category, items]) => ({ category, items }))
      .sort((a, b) => {
        // Uncategorized always goes last.
        if (a.category === 'Uncategorized') return 1
        if (b.category === 'Uncategorized') return -1
        return a.category.localeCompare(b.category)
      })
  }, [books])

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
                        onClick={handleCopyAll}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700"
                        aria-label="Copy all titles to clipboard"
                        title="Copy all titles"
                      >
                        <Copy className="size-3.5" strokeWidth={2} />
                        <span className="hidden sm:inline">Copy all</span>
                      </button>
                    )}
                    {books.length > 0 && (
                      <button
                        type="button"
                        onClick={onClear}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Clear reading list"
                      >
                        <ListX className="size-3.5" strokeWidth={2} />
                        <span className="hidden sm:inline">Clear</span>
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

                {/* Progress toward soft goal — only shown when there's at least 1 book. */}
                {books.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      <span>{goalReached ? 'Goal reached' : 'Reading goal'}</span>
                      <span className="tabular-nums text-slate-500">
                        {books.length} / {READING_LIST_GOAL}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className={cn(
                          'h-full rounded-full',
                          goalReached
                            ? 'bg-gradient-to-r from-blue-500 to-blue-700'
                            : 'bg-blue-500',
                        )}
                      />
                    </div>
                  </div>
                )}

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
                      <span className="ml-auto text-xs font-bold tabular-nums text-blue-700">
                        {timeLabel}
                      </span>
                    </div>
                  )
                })()}

                {/* View-mode toggle — List vs. By category. Hidden when the
                    list is empty (empty state shows instead). Persisted to
                    localStorage so the user's preference sticks across
                    sessions. */}
                {books.length > 0 && (
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      View
                    </span>
                    <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
                      <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                          viewMode === 'list'
                            ? 'bg-blue-50 text-blue-600 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600',
                        )}
                        aria-label="Show as flat list"
                        aria-pressed={viewMode === 'list'}
                      >
                        <LayoutList className="size-3.5" strokeWidth={2.25} />
                        List
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('category')}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                          viewMode === 'category'
                            ? 'bg-blue-50 text-blue-600 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600',
                        )}
                        aria-label="Group by category"
                        aria-pressed={viewMode === 'category'}
                      >
                        <FolderTree className="size-3.5" strokeWidth={2.25} />
                        By category
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Book list */}
              <div className="flex-1 overflow-y-auto">
                {books.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
                    <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-slate-100 text-blue-500 ring-1 ring-blue-100/60">
                      <Bookmark className="size-7" strokeWidth={1.75} />
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-700">
                        Your reading list is empty
                      </p>
                      <p className="text-xs text-slate-500">
                        Save books as you browse and they&rsquo;ll appear here —
                        complete with estimated reading time.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onToggle}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      <Sparkles className="size-3.5" strokeWidth={2.25} />
                      Browse books
                    </button>
                  </div>
                ) : viewMode === 'list' ? (
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
                              <p className="text-xs tabular-nums text-slate-400">
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
                ) : (
                  // "By category" view — groups books by their primary
                  // category, with a section heading + count chip per group.
                  <div className="flex flex-col gap-4 px-4 py-4">
                    {grouped.map((group, gi) => {
                      const headingId = `reading-list-cat-${gi}`
                      return (
                        <motion.section
                          key={group.category}
                          aria-labelledby={headingId}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.22,
                            delay: gi * 0.05,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <div className="mb-1.5 flex items-center gap-2 px-1">
                            <h3
                              id={headingId}
                              className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500"
                              title={group.category}
                            >
                              {group.category}
                            </h3>
                            <span className="inline-flex items-center justify-center rounded-full bg-blue-50 px-1.5 text-[10px] font-bold tabular-nums text-blue-700 ring-1 ring-blue-100">
                              {group.items.length}
                            </span>
                          </div>
                          <ul className="divide-y divide-slate-100 rounded-lg ring-1 ring-slate-200/60">
                            {group.items.map((book) => (
                              <li key={book.id} className="group relative px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelect(book)
                                    onToggle()
                                  }}
                                  className="flex w-full items-start gap-3 text-left transition-colors hover:bg-slate-50 rounded-lg p-1 -m-1"
                                >
                                  <div className="w-11 shrink-0">
                                    <CoverImage
                                      book={book}
                                      sizes="44px"
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
                                      <p className="text-xs tabular-nums text-slate-400">
                                        {book.year}
                                      </p>
                                    )}
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRemove(book.id)}
                                  className="absolute right-3 top-3 hidden size-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 group-hover:flex"
                                  aria-label={`Remove ${book.title} from reading list`}
                                >
                                  <X className="size-3" strokeWidth={2} />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </motion.section>
                      )
                    })}
                  </div>
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
