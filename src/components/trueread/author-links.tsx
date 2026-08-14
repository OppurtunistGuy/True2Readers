'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { User, Search } from 'lucide-react'
import type { Book } from '@/components/trueread/types'

export interface AuthorLinksProps {
  book: Book
  onSearch: (q: string) => void
}

/**
 * "More by this author" section in the detail view.
 * Shows clickable author links that trigger a search for more books by that author.
 * Uses real author data from the book — no fabrication.
 */
export function AuthorLinks({ book, onSearch }: AuthorLinksProps) {
  if (book.authors.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {book.authors.map((author) => (
        <button
          key={author}
          type="button"
          onClick={() => onSearch(`author:${author}`)}
          className="group/author inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200/70 transition-all hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-95"
          aria-label={`Search more books by ${author}`}
        >
          <User className="size-3.5 text-slate-400 transition-colors group-hover/author:text-blue-500" strokeWidth={2} />
          <span>{author}</span>
          <Search className="size-3 text-slate-300 transition-colors group-hover/author:text-blue-400" strokeWidth={2.5} />
        </button>
      ))}
    </div>
  )
}

export default AuthorLinks
