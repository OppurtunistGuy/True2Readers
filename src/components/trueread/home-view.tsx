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
  Heart,
  Flame,
  Brain,
  Sword,
  GraduationCap,
  Moon,
  Wand2,
  Coffee,
} from 'lucide-react'
import { SearchBar } from './search-bar'
import { SurpriseMe } from './surprise-me'
import { RecentlyViewed } from './recently-viewed'
import { QuoteOfTheDay } from './quote-of-the-day'
import type { Book } from '@/components/trueread/types'

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
  /** Recently-viewed books (most-recent-first). Shown as a strip on home. */
  recentlyViewed?: Book[]
  /** Open a recently-viewed book's detail. */
  onSelectBook?: (book: Book) => void
  /** Clear the recently-viewed list. */
  onClearRecentlyViewed?: () => void
  /** Remove a single book from recently-viewed. */
  onRemoveRecentlyViewed?: (id: string) => void
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
 * Mood Match — quick-pick chips that map a felt mood to a real genre/topic
 * search. All queries are real (no fabricated "mood-engine"); the mapping is
 * a curated, opinionated shortcut to genuine genre results.
 */
const MOODS = [
  { icon: Coffee, label: 'Cozy', query: 'cozy mystery', hint: 'Warm & gentle' },
  { icon: Flame, label: 'Thrilling', query: 'thriller', hint: 'Pulse-raising' },
  { icon: Heart, label: 'Romantic', query: 'romance', hint: 'Love stories' },
  { icon: Brain, label: 'Mind-bending', query: 'science fiction', hint: 'Big ideas' },
  { icon: Sword, label: 'Epic', query: 'fantasy', hint: 'Swords & quests' },
  { icon: GraduationCap, label: 'Educational', query: 'self-help', hint: 'Grow yourself' },
  { icon: Moon, label: 'Dark', query: 'horror', hint: 'Spine-chilling' },
  { icon: Wand2, label: 'Whimsical', query: 'fairytale', hint: 'Wonder & magic' },
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
  recentlyViewed = [],
  onSelectBook,
  onClearRecentlyViewed,
  onRemoveRecentlyViewed,
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
        {/* Animated mesh background — very subtle multi-radial gradient
            drift. Sits behind the hero content; pointer-events-none so it
            never interferes with the search bar. Respects
            prefers-reduced-motion (static mesh). */}
        <div
          aria-hidden="true"
          className="trueread-hero-mesh pointer-events-none absolute inset-0 -z-10"
        />
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

        <div className="relative mx-auto w-full max-w-3xl px-4 py-12 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1
              id="hero-heading"
              className="text-center text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl lg:text-6xl"
            >
              Understand any book <br />
              <span className="text-blue-600">in seconds.</span>
            </h1>
            <p className="mt-4 text-center text-base sm:text-lg font-medium text-slate-500">
              Find a book. Get key insights. Decide what’s worth your time.
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
              placeholder="Search by title, author, ISBN, or topic..."
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
            className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-slate-500"
          >
            <span className="font-medium">Try:</span>
            {['Atomic Habits', 'The Alchemist', 'Fantasy', 'Mystery'].map((tag, idx, arr) => (
              <React.Fragment key={tag}>
                <button
                  type="button"
                  onClick={() => handleSuggestion(tag)}
                  className="rounded-full bg-blue-50/90 px-3 py-1 font-semibold text-blue-600 hover:bg-blue-100 transition-colors focus:outline-none"
                >
                  {tag}
                </button>
                {idx < arr.length - 1 && <span className="text-slate-300">•</span>}
              </React.Fragment>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Quote of the Day card */}
      <QuoteOfTheDay onSearch={onSearch} className="py-6" />

      {/* RECENTLY VIEWED list section */}
      <RecentlyViewed
        books={recentlyViewed}
        onSelect={onSelectBook}
        onClear={onClearRecentlyViewed}
        onRemove={onRemoveRecentlyViewed}
      />




      {/* Trust / transparency bar */}
      <section
        className="border-t border-slate-200/60 bg-slate-50/50"
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
              className="text-center text-xs font-bold uppercase tracking-wider text-blue-600"
            >
              Real data, always
            </h2>
            <p className="mt-2 text-center text-sm text-slate-500 font-medium">
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
                className="flex items-center gap-2 text-xs font-semibold text-slate-600 rounded-full bg-white px-4 py-2 border border-slate-200/70 shadow-2xs"
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
