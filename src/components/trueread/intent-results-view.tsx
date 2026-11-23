'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Compass,
  ArrowLeft,
  Search,
  BookOpen,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Filter,
  CheckCircle2,
} from 'lucide-react'
import type { Book } from '@/components/trueread/types'
import {
  matchBooksByIntent,
  type UserReadingIntent,
  type MatchedIntentBook,
} from '@/lib/intent-matcher'
import { CoverImage } from './cover-image'
import { SearchBar } from './search-bar'

export interface IntentResultsViewProps {
  intent: UserReadingIntent
  onSelectBook: (book: Book) => void
  onAdjustIntent: () => void
  onDirectSearch: (query: string) => void
  isLoading?: boolean
}

const GENRE_FILTERS = [
  'All',
  'Psychology',
  'Science Fiction',
  'Thriller',
  'Fantasy',
  'Classic',
  'Contemporary',
  'Finance',
]

export function IntentResultsView({
  intent,
  onSelectBook,
  onAdjustIntent,
  onDirectSearch,
  isLoading = false,
}: IntentResultsViewProps) {
  const [activeGenre, setActiveGenre] = React.useState<string>('All')
  const [searchQuery, setSearchQuery] = React.useState<string>('')

  // Re-match books based on active genre filter
  const matchedBooks: MatchedIntentBook[] = React.useMemo(() => {
    return matchBooksByIntent({
      ...intent,
      genre: activeGenre === 'All' ? undefined : activeGenre,
    })
  }, [intent, activeGenre])

  // Format intent chips for display
  const intentChips = React.useMemo(() => {
    const chips: string[] = []
    if (intent.feel.includes('fast_gripping')) chips.push('Fast & gripping')
    if (intent.feel.includes('thought_provoking')) chips.push('Thought-provoking')
    if (intent.feel.includes('emotional')) chips.push('Emotional')
    if (intent.feel.includes('immersive')) chips.push('Immersive')
    if (intent.feel.includes('relaxing')) chips.push('Relaxing')

    if (intent.effort === 'low') chips.push('Easy escape')
    else if (intent.effort === 'moderate') chips.push('Some focus')
    else if (intent.effort === 'deep') chips.push('Deep dive')

    for (const f of intent.focus) {
      if (f === 'story') chips.push('Story')
      if (f === 'characters') chips.push('Characters')
      if (f === 'ideas') chips.push('Ideas')
      if (f === 'writing') chips.push('Writing')
    }
    return chips
  }, [intent])

  return (
    <div className="relative min-h-[calc(100vh-140px)] bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Top bar with back and chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <button
            type="button"
            onClick={onAdjustIntent}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Adjust reading mood</span>
          </button>

          {/* Active Intent Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 mr-1">Your mood:</span>
            {intentChips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
            Books that fit what you&apos;re looking for
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Here are books that fit your current reading mood, informed by real reader experiences.
          </p>
        </div>

        {/* Genre Refinement Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
            <Filter className="size-3 text-slate-400" />
            Refine:
          </span>
          {GENRE_FILTERS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setActiveGenre(g)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                activeGenre === g
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {matchedBooks.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            No curated books in &ldquo;{activeGenre}&rdquo; yet. Pick another genre or search below.
          </p>
        )}

        {/* 10 Book Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {matchedBooks.map((item) => (
            <motion.article
              key={item.profile.bookKey}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
              onClick={() => onSelectBook(item.book)}
            >
              <div className="space-y-3">
                {/* Header: Title, Author, Tags */}
                <div className="flex items-start gap-4">
                  {/* Mock/Real Cover Thumbnail */}
                  <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 shadow-sm border border-slate-200">
                    <CoverImage book={item.book} className="h-full w-full object-cover" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                      {item.profile.title}
                    </h2>
                    <p className="text-xs font-medium text-slate-500">{item.profile.author}</p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.tags.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Signals */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  {/* Why it surfaced */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Why it surfaced
                    </span>
                    <p className="text-slate-700 leading-snug">{item.whySurfaced}</p>
                  </div>

                  {/* Reader signal */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      Reader signal
                    </span>
                    <p className="text-slate-600 leading-snug">{item.readerSignal}</p>
                  </div>

                  {/* Potential mismatch (Critical Differentiator) */}
                  {item.potentialMismatch && (
                    <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-2.5 text-xs text-amber-900 space-y-0.5">
                      <div className="flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider text-amber-800">
                        <AlertTriangle className="size-3 text-amber-600" />
                        <span>Potential mismatch</span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-snug">
                        {item.potentialMismatch}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* View Details Action */}
              <div className="mt-4 flex items-center justify-end border-t border-slate-100/80 pt-3 text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                <span>View book experience</span>
                <ChevronRight className="size-3.5 ml-0.5" />
              </div>
            </motion.article>
          ))}
        </div>

        {/* Fallback Direct Search Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-3 mt-12 text-center">
          <h3 className="text-sm font-bold text-slate-900">
            Have a specific book in mind?
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Search any title or author to see its real reader experience and potential drawbacks.
          </p>
          <div className="max-w-lg mx-auto pt-2">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSubmit={(q) => onDirectSearch(q)}
              isLoading={isLoading}
              variant="hero"
              placeholder="Search by title, author, or keyword..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
