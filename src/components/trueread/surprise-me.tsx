'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Shuffle } from 'lucide-react'

/**
 * "Surprise me" discovery button.
 *
 * Picks a random query from a curated list of REAL genres / topics and
 * triggers the existing search flow. The button itself holds no state — it
 * just calls `onSearch(randomQuery)`.
 *
 * The query pool is intentionally curated (not random words) so every surprise
 * lands on a real, populated genre that the Google Books / Apple Books APIs
 * serve well. No fabricated results — the search runs through the same real
 * pipeline as any other query.
 */
const SURPRISE_QUERIES = [
  'cozy mystery',
  'thriller',
  'romance',
  'fantasy',
  'science fiction',
  'horror',
  'self-help',
  'historical fiction',
  'memoir',
  'biography',
  'mystery',
  'adventure',
  'noir',
  'fairytale',
  'detective',
  'literary fiction',
  'magical realism',
  'coming of age',
  'true crime',
  'mythology',
] as const

export interface SurpriseMeProps {
  /** Called with a randomly-chosen query when the button is clicked. */
  onSearch: (query: string) => void
  /** Visual variant — "hero" sits below the hero search; "inline" is smaller. */
  variant?: 'hero' | 'inline'
  /** Disable the button (e.g. while a search is in progress). */
  disabled?: boolean
  className?: string
}

export function SurpriseMe({
  onSearch,
  variant = 'hero',
  disabled = false,
  className,
}: SurpriseMeProps) {
  // Track a per-instance pool rotation so the same query doesn't repeat twice
  // in a row. Uses a ref so re-renders don't reset it.
  const lastQueryRef = React.useRef<string | null>(null)

  const handleSurprise = React.useCallback(() => {
    if (disabled) return
    const pool = SURPRISE_QUERIES.filter((q) => q !== lastQueryRef.current)
    const pick = pool[Math.floor(Math.random() * pool.length)] ?? SURPRISE_QUERIES[0]
    lastQueryRef.current = pick
    onSearch(pick)
  }, [disabled, onSearch])

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleSurprise}
        disabled={disabled}
        className={className}
        aria-label="Surprise me with a random genre"
        title="Surprise me"
      >
        <Shuffle className="size-4" strokeWidth={2} />
      </button>
    )
  }

  return (
    <motion.button
      type="button"
      onClick={handleSurprise}
      disabled={disabled}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={
        'group/surprise inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50' +
        (className ? ` ${className}` : '')
      }
      aria-label="Surprise me with a random genre"
    >
      <Shuffle
        className="size-4 transition-transform duration-300 group-hover/surprise:rotate-180"
        strokeWidth={2.25}
      />
      Surprise me
      <span className="hidden text-slate-400 sm:inline">·</span>
      <span className="hidden text-xs font-normal text-slate-500 sm:inline">
        random real genre
      </span>
    </motion.button>
  )
}

export default SurpriseMe
