'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  GitCompare,
  Check,
  Clock,
  BookOpen,
  Calendar,
  Star,
  Trophy,
  Layers,
  Sparkles,
} from 'lucide-react'
import type { Book } from '@/components/trueread/types'
import { CoverImage } from './cover-image'
import { StarRating } from './star-rating'
import { getBreakdown } from './mock-ai'
import { estimateReadingTime } from './reading-insights'
import { cn } from '@/lib/utils'

export interface CompareModalProps {
  /** Books to compare (2-3). */
  books: Book[]
  isOpen: boolean
  onClose: () => void
  onSelectBook: (book: Book) => void
}

/**
 * Determine which book "wins" a given metric.
 * Returns the index of the winning book, or -1 if a tie / no data.
 */
function pickWinner(
  books: Book[],
  metric: (b: Book) => number | null,
  higherIsBetter = true,
): number {
  let bestIdx = -1
  let bestVal: number | null = null
  books.forEach((b, i) => {
    const v = metric(b)
    if (v == null || !Number.isFinite(v)) return
    if (bestVal == null) {
      bestVal = v
      bestIdx = i
    } else if (higherIsBetter ? v > bestVal : v < bestVal) {
      bestVal = v
      bestIdx = i
    }
  })
  return bestIdx
}

/**
 * Book comparison modal — shows 2-3 books side-by-side with their key metrics.
 * Highlights the "winner" of each metric with a subtle blue badge.
 */
export function CompareModal({
  books,
  isOpen,
  onClose,
  onSelectBook,
}: CompareModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [isOpen])

  if (books.length < 2) return null

  // Pre-compute breakdowns + reading times
  const breakdowns = books.map((b) => getBreakdown(b))
  const readingTimes = books.map((b) => estimateReadingTime(b.pageCount))

  // Winners
  const ratingWinner = pickWinner(books, (b) => b.rating ?? null)
  const pagesWinner = pickWinner(books, (b) => b.pageCount ?? null)
  const yearWinner = pickWinner(books, (b) => (b.year ? Number(b.year) : null))
  const readTimeWinner = pickWinner(
    books,
    (b) => estimateReadingTime(b.pageCount)?.minutes ?? null,
    false, // shorter is better
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
              role="dialog"
              aria-modal="true"
              aria-labelledby="compare-title"
            >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-transparent px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <GitCompare className="size-5" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h2
                      id="compare-title"
                      className="text-base font-semibold text-slate-900"
                    >
                      Compare Books
                    </h2>
                    <p className="text-xs text-slate-500">
                      {books.length} books side-by-side · winners highlighted in blue
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close comparison"
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
              </div>

              {/* Body — scrollable */}
              <div className="flex-1 overflow-y-auto">
                {/* Book headers row */}
                <div
                  className="grid gap-4 border-b border-slate-100 p-5"
                  style={{
                    gridTemplateColumns: `140px repeat(${books.length}, minmax(0, 1fr))`,
                  }}
                >
                  <div className="flex items-end">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Book
                    </span>
                  </div>
                  {books.map((book, i) => (
                    <div key={book.id} className="flex flex-col gap-2">
                      <div className="mx-auto w-24">
                        <CoverImage
                          book={book}
                          sizes="96px"
                          className="w-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectBook(book)
                          onClose()
                        }}
                        className="line-clamp-2 text-center text-sm font-semibold text-slate-900 transition-colors hover:text-blue-700"
                        title={book.title}
                      >
                        {book.title}
                      </button>
                      <p className="truncate text-center text-xs text-slate-500">
                        {book.authors.length > 0
                          ? book.authors.join(', ')
                          : 'Unknown author'}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Metric rows */}
                <MetricRow
                  label="Rating"
                  icon={<Star className="size-3.5 text-amber-500" strokeWidth={2} />}
                  winnerIdx={ratingWinner}
                >
                  {books.map((book, i) => (
                    <MetricCell key={book.id} isWinner={i === ratingWinner}>
                      {book.rating != null && book.rating > 0 ? (
                        <div className="flex flex-col items-center gap-1">
                          <StarRating rating={book.rating} size="sm" showValue />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </MetricCell>
                  ))}
                </MetricRow>

                <MetricRow
                  label="Pages"
                  icon={<BookOpen className="size-3.5 text-blue-500" strokeWidth={2} />}
                  winnerIdx={pagesWinner}
                >
                  {books.map((book, i) => (
                    <MetricCell key={book.id} isWinner={i === pagesWinner}>
                      {book.pageCount != null && book.pageCount > 0 ? (
                        <span className="text-sm font-medium text-slate-700">
                          {book.pageCount}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </MetricCell>
                  ))}
                </MetricRow>

                <MetricRow
                  label="Reading Time"
                  icon={<Clock className="size-3.5 text-blue-500" strokeWidth={2} />}
                  winnerIdx={readTimeWinner}
                  winnerLabel="shortest"
                >
                  {readingTimes.map((rt, i) => (
                    <MetricCell key={i} isWinner={i === readTimeWinner}>
                      {rt ? (
                        <span className="text-sm font-medium text-slate-700">
                          {rt.label}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </MetricCell>
                  ))}
                </MetricRow>

                <MetricRow
                  label="Published"
                  icon={<Calendar className="size-3.5 text-blue-500" strokeWidth={2} />}
                  winnerIdx={yearWinner}
                  winnerLabel="newest"
                >
                  {books.map((book, i) => (
                    <MetricCell key={book.id} isWinner={i === yearWinner}>
                      {book.year ? (
                        <span className="text-sm font-medium text-slate-700">
                          {book.year}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </MetricCell>
                  ))}
                </MetricRow>

                {/* AI breakdown comparison */}
                <div className="border-t border-slate-100 bg-slate-50/40">
                  <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                    <Sparkles className="size-4 text-blue-500" strokeWidth={2.25} />
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      AI-Style Breakdown
                    </h3>
                    <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-blue-700 ring-1 ring-blue-100">
                      Mock
                    </span>
                  </div>

                  {(['pacing', 'tone', 'dialogue', 'complexity'] as const).map(
                    (key) => (
                      <MetricRow
                        key={key}
                        label={key.charAt(0).toUpperCase() + key.slice(1)}
                        icon={
                          <Layers className="size-3.5 text-slate-400" strokeWidth={2} />
                        }
                        winnerIdx={pickWinner(
                          books,
                          (b) => {
                            const bd = getBreakdown(b)
                            return bd[key].level
                          },
                          true,
                        )}
                      >
                        {breakdowns.map((bd, i) => (
                          <MetricCell
                            key={i}
                            isWinner={
                              i ===
                              pickWinner(
                                books,
                                (b) => getBreakdown(b)[key].level,
                                true,
                              )
                            }
                          >
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, si) => (
                                  <span
                                    key={si}
                                    className={cn(
                                      'h-1.5 w-3 rounded-full',
                                      si < bd[key].level
                                        ? 'bg-blue-500'
                                        : 'bg-slate-200',
                                    )}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] font-medium text-slate-500">
                                {bd[key].label}
                              </span>
                            </div>
                          </MetricCell>
                        ))}
                      </MetricRow>
                    ),
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="shrink-0 border-t border-slate-100 bg-slate-50/50 px-5 py-3">
                <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
                  <Trophy className="size-3 text-amber-500" strokeWidth={2} />
                  Winners are determined by real book data only
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

/** A single metric comparison row. */
function MetricRow({
  label,
  icon,
  winnerIdx,
  winnerLabel,
  children,
}: {
  label: string
  icon: React.ReactNode
  winnerIdx: number
  winnerLabel?: string
  children: React.ReactNode
}) {
  return (
    <div
      className="grid items-center gap-4 border-b border-slate-100 px-5 py-3"
      style={{
        gridTemplateColumns: `140px repeat(${React.Children.count(children)}, minmax(0, 1fr))`,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex size-7 items-center justify-center rounded-lg bg-slate-100">
          {icon}
        </span>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-600">{label}</span>
          {winnerIdx >= 0 && winnerLabel && (
            <span className="text-[9px] font-medium uppercase tracking-wide text-amber-600">
              {winnerLabel}
            </span>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

/** A single cell in a metric row. */
function MetricCell({
  isWinner,
  children,
}: {
  isWinner: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg py-2 transition-colors',
        isWinner && 'bg-blue-50/60 ring-1 ring-blue-200/60',
      )}
    >
      {children}
      {isWinner && (
        <span className="ml-1.5 inline-flex size-4 items-center justify-center rounded-full bg-blue-600 text-white">
          <Check className="size-2.5" strokeWidth={3} />
        </span>
      )}
    </div>
  )
}

export default CompareModal
