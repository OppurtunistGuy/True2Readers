'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Library, Loader2 } from 'lucide-react'
import type { Book, SearchResponse } from '@/components/trueread/types'
import { CoverImage } from './cover-image'
import { cn } from '@/lib/utils'

export interface MoreFromAuthorProps {
  /** The book whose author we'll search for more works. */
  book: Book
  /** Called when the user clicks one of the related-book cards. */
  onSelect: (book: Book) => void
}

/**
 * "More from this author" — fetches up to 5 other books by the same author
 * (excluding the current book) using the existing /api/books/search endpoint
 * with the `author:` query prefix. All results are REAL data — no fabrication.
 *
 * Renders nothing if the book has no authors, the search fails, or there are
 * no additional books by that author.
 */
export function MoreFromAuthor({ book, onSelect }: MoreFromAuthorProps) {
  const [related, setRelated] = React.useState<Book[]>([])
  const [status, setStatus] = React.useState<
    'idle' | 'loading' | 'done' | 'error'
  >('idle')

  const primaryAuthor = book.authors[0]

  React.useEffect(() => {
    if (!primaryAuthor) {
      setStatus('idle')
      return
    }
    let cancelled = false
    const controller = new AbortController()

    const run = async () => {
      setStatus('loading')
      try {
        const params = new URLSearchParams({
          q: `author:${primaryAuthor}`,
          startIndex: '0',
          maxResults: '12',
        })
        const res = await fetch(
          `/api/books/search?${params.toString()}`,
          { signal: controller.signal },
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as SearchResponse
        if (cancelled) return
        // Exclude the current book + dedupe by id. Cap at 5 for layout.
        const seen = new Set<string>([book.id])
        const filtered: Book[] = []
        const norm = (s: string) => s.trim().toLowerCase()
        const wantAuthor = norm(primaryAuthor)
        for (const b of data.results) {
          if (seen.has(b.id)) continue
          // The search is fuzzy: keep only books that really list this author,
          // and skip other editions of the book being viewed.
          if (!b.authors.some((a) => norm(a) === wantAuthor)) continue
          if (norm(b.title) === norm(book.title)) continue
          seen.add(b.id)
          filtered.push(b)
          if (filtered.length >= 5) break
        }
        setRelated(filtered)
        setStatus('done')
      } catch (err) {
        if (cancelled || controller.signal.aborted) return
        // Silent failure — section just doesn't render.
        setStatus('error')
      }
    }
    run()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [primaryAuthor, book.id])

  // Don't render the section at all if there's nothing useful to show.
  if (!primaryAuthor) return null
  if (status === 'loading') return <MoreFromAuthorSkeleton />
  if (status === 'error' || related.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
      aria-labelledby="more-author-heading"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Library className="size-4" strokeWidth={2.25} />
        </span>
        <h2
          id="more-author-heading"
          className="text-sm font-semibold text-slate-900"
        >
          More from{' '}
          <span className="text-blue-700">{primaryAuthor}</span>
        </h2>
        <span className="ml-auto text-xs text-slate-400">
          {related.length} more book{related.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {related.map((b, i) => (
          <motion.button
            key={b.id}
            type="button"
            onClick={() => onSelect(b)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: Math.min(i * 0.05, 0.25),
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            className="group/rel flex flex-col gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-lg"
            aria-label={`Open details for ${b.title} by ${b.authors.join(', ')}`}
          >
            <div className="overflow-hidden rounded-lg ring-1 ring-slate-200 transition-all group-hover/rel:ring-blue-200 group-hover/rel:shadow-md">
              <CoverImage book={b} className="w-full" />
            </div>
            <h3
              className={cn(
                'line-clamp-2 text-xs font-semibold leading-snug text-slate-900',
                'transition-colors group-hover/rel:text-blue-700',
              )}
              title={b.title}
            >
              {b.title}
            </h3>
            {b.year && (
              <p className="text-[11px] text-slate-400">{b.year}</p>
            )}
          </motion.button>
        ))}
      </div>
    </motion.section>
  )
}

/** Loading skeleton — 5 shimmer placeholder cards. */
function MoreFromAuthorSkeleton() {
  return (
    <section
      className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 md:p-6"
      aria-busy="true"
      aria-label="Loading more from this author"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Loader2 className="size-4 animate-spin" strokeWidth={2.25} />
        </span>
        <h2 className="text-sm font-semibold text-slate-700">
          Finding more from this author…
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="trueread-shimmer aspect-[2/3] w-full rounded-lg bg-slate-100" />
            <div className="trueread-shimmer h-3 w-full rounded bg-slate-100" />
            <div className="trueread-shimmer h-2 w-1/2 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </section>
  )
}

export default MoreFromAuthor
