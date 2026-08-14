'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  Clock3,
  Layers,
  RotateCcw,
  Search,
  Sparkles,
  Zap,
  Globe,
  Shield,
  Eye,
  Library,
} from 'lucide-react'
import { SearchBar } from './search-bar'

export interface HomeViewProps {
  onSearch: (q: string) => void
  isLoading: boolean
  /** Recent searches (most-recent-first, deduped). In-memory only. */
  recentSearches?: string[]
  onClearRecent?: () => void
  /** Ref to forward to the hero search input (for the `/` shortcut). */
  searchInputRef?: React.Ref<HTMLInputElement>
  /** Number of books in reading list — shown as a stat. */
  readingListCount?: number
}

const SUGGESTIONS = [
  'Atomic Habits',
  'The Alchemist',
  'self-help',
  'Fantasy',
  'Mystery',
  'Science Fiction',
]

const STEPS = [
  {
    icon: Search,
    title: 'Search',
    desc: 'Type a title or topic.',
  },
  {
    icon: BookOpen,
    title: 'Select',
    desc: 'Pick a book from real results.',
  },
  {
    icon: BarChart3,
    title: 'Understand',
    desc: 'Read the preview & quick breakdown.',
  },
] as const

const FEATURES = [
  {
    icon: Zap,
    title: 'Instant Results',
    desc: 'Real book data from Google Books & Apple Books — no fabrication.',
  },
  {
    icon: Layers,
    title: 'AI-Style Breakdown',
    desc: 'Pacing, tone, dialogue & complexity at a glance.',
  },
  {
    icon: BookOpen,
    title: 'Reading List',
    desc: 'Save books to your list and come back anytime.',
  },
] as const

const TRUST_ITEMS = [
  {
    icon: Globe,
    text: '100% real data from Google Books & Apple Books',
  },
  {
    icon: Shield,
    text: 'No fabricated content or fake reviews',
  },
  {
    icon: Eye,
    text: 'Transparent source attribution on every result',
  },
] as const

/**
 * Landing / hero view. Centered headline + hero SearchBar + suggestion
 * tags + recent searches + "How TrueRead works" 3-step section.
 */
export function HomeView({
  onSearch,
  isLoading,
  recentSearches = [],
  onClearRecent,
  searchInputRef,
  readingListCount = 0,
}: HomeViewProps) {
  const [value, setValue] = React.useState('')

  const handleSubmit = (q: string) => {
    onSearch(q)
  }

  const handleSuggestion = (tag: string) => {
    setValue('')
    onSearch(tag)
  }

  return (
    <div className="relative">
      {/* Hero */}
      <section
        className="trueread-aurora relative isolate overflow-hidden"
        aria-labelledby="hero-heading"
      >
        {/* Floating decorative accents — subtle, low-opacity book + sparkles */}
        <div
          className="trueread-float-slow pointer-events-none absolute left-[6%] top-[18%] hidden text-blue-100/60 lg:block"
          aria-hidden="true"
        >
          <BookOpen className="size-28" strokeWidth={1} />
        </div>
        <div
          className="trueread-float-slower pointer-events-none absolute right-[8%] top-[12%] hidden text-blue-200/50 lg:block"
          aria-hidden="true"
        >
          <Sparkles className="size-16" strokeWidth={1.25} />
        </div>
        <div
          className="trueread-float-slow pointer-events-none absolute bottom-[14%] right-[14%] hidden text-blue-100/50 lg:block"
          aria-hidden="true"
        >
          <BookOpen className="size-20" strokeWidth={1} />
        </div>

        <div className="relative mx-auto w-full max-w-3xl px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1 text-xs font-medium text-blue-700">
                <Sparkles className="size-3.5" strokeWidth={2.25} />
                Understand any book in seconds
              </span>
              {readingListCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                  <Library className="size-3.5 text-blue-500" strokeWidth={2.25} />
                  {readingListCount} in your list
                </span>
              )}
            </div>
            <h1
              id="hero-heading"
              className="text-center text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl"
            >
              What do you want to read?
            </h1>
            <p className="mt-4 text-center text-lg text-slate-500">
              Search any book title or topic — then understand it in seconds.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-8 w-full max-w-2xl"
          >
            <SearchBar
              value={value}
              onChange={setValue}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              variant="hero"
              placeholder="Search for a book title or topic…"
              inputRef={searchInputRef}
              showHint
              recentSearches={recentSearches}
            />
          </motion.div>

          {/* Suggestion tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center"
          >
            <span className="text-sm text-slate-500">Try searching:</span>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleSuggestion(tag)}
                  className="trueread-chip-focus group/tag rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 shadow-sm transition-all hover:bg-blue-100 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 active:scale-95"
                >
                  <span className="inline-block transition-transform group-hover/tag:translate-x-0.5">
                    {tag}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Recent searches (in-memory, session-only) */}
          {recentSearches.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center"
            >
              <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                <Clock3 className="size-3.5" strokeWidth={2} />
                Recent:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {recentSearches.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSuggestion(q)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 active:scale-95"
                  >
                    {q}
                  </button>
                ))}
                {onClearRecent && (
                  <button
                    type="button"
                    onClick={onClearRecent}
                    aria-label="Clear recent searches"
                    className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-slate-400 transition-colors hover:text-slate-600"
                  >
                    <RotateCcw className="size-3" strokeWidth={2} />
                    Clear
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* How TrueRead works */}
      <section
        className="mx-auto w-full max-w-5xl px-4 py-16 md:py-20"
        aria-labelledby="how-heading"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2
            id="how-heading"
            className="text-center text-sm font-semibold uppercase tracking-wide text-blue-600"
          >
            How TrueRead works
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            Three steps to understand any book
          </p>
        </motion.div>

        <div className="mt-8 flex flex-col items-stretch gap-4 md:flex-row md:items-center">
          {STEPS.map((step, i) => (
            <React.Fragment key={step.title}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex-1 rounded-2xl bg-white p-6 ring-1 ring-slate-200/70 trueread-shadow-card transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <step.icon className="size-6" strokeWidth={2} />
                  </span>
                  <span className="flex size-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{step.desc}</p>
              </motion.div>
              {i < STEPS.length - 1 && (
                <div className="hidden items-center justify-center md:flex">
                  <ChevronRight className="size-5 text-slate-300" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Feature highlights */}
      <section
        className="border-t border-slate-200/70 bg-white/50"
        aria-labelledby="features-heading"
      >
        <div className="mx-auto w-full max-w-5xl px-4 py-16 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2
              id="features-heading"
              className="text-center text-sm font-semibold uppercase tracking-wide text-blue-600"
            >
              Why TrueRead
            </h2>
            <p className="mt-2 text-center text-sm text-slate-500">
              Built for readers who want to decide fast
            </p>
          </motion.div>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="rounded-2xl bg-white p-6 ring-1 ring-slate-200/70 trueread-shadow-card transition-shadow hover:shadow-md"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <feat.icon className="size-5" strokeWidth={2.25} />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900">
                  {feat.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / transparency bar */}
      <section
        className="border-t border-slate-200/50 bg-slate-50/50"
        aria-labelledby="trust-heading"
      >
        <div className="mx-auto w-full max-w-5xl px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2
              id="trust-heading"
              className="text-center text-sm font-semibold uppercase tracking-wide text-blue-600"
            >
              Real data, always
            </h2>
            <p className="mt-2 text-center text-sm text-slate-500">
              Zero fabrication — every result comes from a real source
            </p>
          </motion.div>

          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {TRUST_ITEMS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{
                  duration: 0.3,
                  delay: i * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex items-center gap-2 text-sm text-slate-600"
              >
                <item.icon className="size-4 text-blue-500" strokeWidth={2} />
                <span>{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomeView
