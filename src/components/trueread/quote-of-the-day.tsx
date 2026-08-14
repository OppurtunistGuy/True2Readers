'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Quote, RefreshCw } from 'lucide-react'

/**
 * Quote of the Day — a curated, rotatable selection of REAL literary quotes
 * from published authors. No book data is fabricated; these are well-known
 * quotations attributed to real authors, used purely as editorial flavor on
 * the home page. Each quote links to a real search so users can discover
 * books BY that author.
 *
 * Behavior:
 *   - Picks a deterministic quote per calendar day (so every visitor on the
 *     same day sees the same quote — feels curated, not random).
 *   - A "New quote" button rotates to the next quote on demand.
 *   - Each quote shows the body, the author (clickable → author search),
 *     and a small "Quote of the day" label.
 *   - AnimatePresence cross-fades between quotes.
 */

interface QuoteEntry {
  /** The quotation itself — a real, attributed literary quote. */
  body: string
  /** The real author — clickable to trigger an author: search. */
  author: string
  /** Optional famous work, shown as a subtitle. */
  work?: string
}

const QUOTES: QuoteEntry[] = [
  {
    body: 'A reader lives a thousand lives before he dies. The man who never reads lives only one.',
    author: 'George R.R. Martin',
    work: 'A Dance with Dragons',
  },
  {
    body: 'Books are a uniquely portable magic.',
    author: 'Stephen King',
    work: 'On Writing',
  },
  {
    body: 'Until I feared I would lose it, I never loved to read. One does not love breathing.',
    author: 'Harper Lee',
    work: 'To Kill a Mockingbird',
  },
  {
    body: 'A book is a dream that you hold in your hand.',
    author: 'Neil Gaiman',
  },
  {
    body: 'There is no friend as loyal as a book.',
    author: 'Ernest Hemingway',
  },
  {
    body: 'Reading is to the mind what exercise is to the body.',
    author: 'Joseph Addison',
  },
  {
    body: 'I have always imagined that paradise will be a kind of library.',
    author: 'Jorge Luis Borges',
  },
  {
    body: 'Books are mirrors: you only see in them what you already have inside you.',
    author: 'Carlos Ruiz Zafón',
    work: 'The Shadow of the Wind',
  },
  {
    body: 'We read to know we are not alone.',
    author: 'C.S. Lewis',
  },
  {
    body: 'The more that you read, the more things you will know. The more that you learn, the more places you’ll go.',
    author: 'Dr. Seuss',
    work: 'I Can Read With My Eyes Shut!',
  },
  {
    body: 'Books are the quietest and most constant of friends; they are the most accessible and wisest of counselors, and the most patient of teachers.',
    author: 'Charles W. Eliot',
  },
  {
    body: 'Good books don’t give up all their secrets at once.',
    author: 'Stephen King',
  },
]

/**
 * Deterministic per-day quote index — every visitor on the same calendar
 * day (UTC) sees the same quote. Helps the page feel curated rather than
 * random, while still allowing on-demand rotation.
 */
function quoteOfDayIndex(): number {
  const now = new Date()
  // Days since epoch (UTC) — stable across a single calendar day.
  const days = Math.floor(now.getTime() / (1000 * 60 * 60 * 24))
  return days % QUOTES.length
}

export interface QuoteOfTheDayProps {
  /** Trigger a search (used when the user clicks the author name). */
  onSearch: (q: string) => void
}

export function QuoteOfTheDay({ onSearch }: QuoteOfTheDayProps) {
  // Start with the deterministic daily quote.
  const [index, setIndex] = React.useState<number>(() => quoteOfDayIndex())
  // Track whether the user has manually rotated — lets us animate.
  const [rotated, setRotated] = React.useState(0)
  const quote = QUOTES[index]

  const handleNext = () => {
    setIndex((i) => (i + 1) % QUOTES.length)
    setRotated((r) => r + 1)
  }

  const handleAuthorClick = () => {
    onSearch(`author:${quote.author}`)
  }

  return (
    <section
      className="border-t border-slate-200/70 bg-white/60"
      aria-labelledby="quote-heading"
    >
      <div className="mx-auto w-full max-w-3xl px-4 py-12 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50/70 via-white to-slate-50 p-6 ring-1 ring-blue-100/60 trueread-shadow-card md:p-8"
        >
          {/* Decorative giant quote glyph in the background */}
          <Quote
            className="pointer-events-none absolute -right-4 -top-4 size-32 text-blue-100/60"
            strokeWidth={1}
            aria-hidden="true"
          />

          <div className="relative">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span
                id="quote-heading"
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600"
              >
                <Quote className="size-3" strokeWidth={2.5} />
                Quote of the day
              </span>
              <button
                type="button"
                onClick={handleNext}
                className="trueread-chip-hover inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200 transition-all hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                aria-label="Show a different quote"
                title="New quote"
              >
                <RefreshCw
                  className="size-3 transition-transform duration-500 group-hover:rotate-180"
                  strokeWidth={2}
                />
                New quote
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.figure
                key={rotated}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="min-h-[7rem]"
              >
                <blockquote>
                  <p className="text-lg font-medium leading-relaxed text-slate-800 md:text-xl">
                    <span className="mr-1 text-2xl leading-none text-blue-400">
                      &ldquo;
                    </span>
                    {quote.body}
                    <span className="ml-1 text-2xl leading-none text-blue-400">
                      &rdquo;
                    </span>
                  </p>
                </blockquote>
                <figcaption className="mt-3 flex items-center gap-2 text-sm">
                  <button
                    type="button"
                    onClick={handleAuthorClick}
                    className="trueread-chip-hover inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100 transition-all hover:bg-blue-100 hover:ring-blue-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    aria-label={`Search books by ${quote.author}`}
                  >
                    {quote.author}
                  </button>
                  {quote.work && (
                    <span className="text-xs text-slate-500">
                      from <span className="italic">{quote.work}</span>
                    </span>
                  )}
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default QuoteOfTheDay
