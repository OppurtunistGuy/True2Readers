'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Compass, Search, BookOpen } from 'lucide-react'
import type { Book } from '@/components/trueread/types'

export interface ExploreRelatedProps {
  book: Book
  onSearch: (q: string) => void
}

/**
 * "Explore related topics" section in the detail view.
 * Uses the book's real categories to suggest genre searches the user might
 * want to try next. Strengthens the discovery loop without fabricating data.
 */
export function ExploreRelatedProps({ book, onSearch }: ExploreRelatedProps) {
  // Deduplicate and limit categories
  const categories = React.useMemo(() => {
    if (!book.categories || book.categories.length === 0) return []
    return [...new Set(book.categories)].slice(0, 4)
  }, [book.categories])

  if (categories.length === 0) return null

  return (
    <section
      aria-label="Explore related topics"
      className="rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 p-5 ring-1 ring-slate-200/70"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <Compass className="size-4" strokeWidth={2.25} />
        </span>
        <h3 className="text-sm font-semibold text-slate-900">
          Explore related
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        {categories.map((cat, i) => (
          <motion.button
            key={cat}
            type="button"
            onClick={() => onSearch(cat)}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="group/rel flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-left ring-1 ring-slate-200/50 transition-all hover:bg-blue-50/50 hover:ring-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]"
            aria-label={`Search books in ${cat}`}
          >
            <BookOpen className="size-4 text-slate-400 transition-colors group-hover/rel:text-blue-500" strokeWidth={2} />
            <span className="flex-1 text-sm font-medium text-slate-700 transition-colors group-hover/rel:text-blue-700">
              {cat}
            </span>
            <Search className="size-3.5 text-slate-300 transition-colors group-hover/rel:text-blue-400" strokeWidth={2.5} />
          </motion.button>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-slate-400">
        Click to discover more books in these genres
      </p>
    </section>
  )
}

export default ExploreRelatedProps
export type { ExploreRelatedProps as ExploreRelatedPropsType }
