'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Tags } from 'lucide-react'
import { extractThemes, type Theme } from './themes-analyzer'
import { cn } from '@/lib/utils'

export interface ThemesCloudProps {
  /** The book's description (preferred) or preview snippet. */
  text: string
  /** Trigger a real search for the clicked theme word. */
  onSearch: (q: string) => void
  /** Max number of theme chips to render. */
  max?: number
}

/**
 * "Themes & keywords" cloud.
 *
 * Renders the most frequent meaningful words extracted from the book's real
 * description / preview as clickable chips. Clicking a chip runs the existing
 * search pipeline for that word — no fabricated suggestions, no AI call.
 *
 * The cloud hides itself entirely when there are fewer than 3 distinct
 * repeating themes (handled by `extractThemes`).
 *
 * Font size scales slightly with frequency (low → text-xs, high → text-sm)
 * so the most-prominent themes read first.
 */
export function ThemesCloud({ text, onSearch, max = 8 }: ThemesCloudProps) {
  const themes = React.useMemo<Theme[]>(
    () => extractThemes(text, max),
    [text, max],
  )

  if (themes.length === 0) return null

  // Compute a small size class based on count (min count is 2 by definition).
  const maxCount = themes[0]?.count ?? 1
  const sizeFor = (count: number) => {
    const ratio = count / maxCount
    if (ratio >= 0.8) return 'text-sm'
    return 'text-xs'
  }

  return (
    <section
      aria-labelledby="themes-heading"
      className="mt-8 border-t border-slate-200 pt-6"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Tags className="size-3.5" strokeWidth={2.25} />
        </span>
        <div className="flex items-baseline gap-2">
          <h3
            id="themes-heading"
            className="text-sm font-semibold text-slate-900"
          >
            Themes &amp; keywords
          </h3>
          <span className="text-[10px] text-slate-400">
            derived from description
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {themes.map((theme, i) => (
          <motion.button
            key={theme.word}
            type="button"
            onClick={() => onSearch(theme.word)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.22,
              delay: i * 0.04,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={cn(
              'trueread-focus inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-blue-50 to-blue-100/60 px-3 py-1.5 font-medium text-slate-700 ring-1 ring-blue-100/70 transition-all hover:from-blue-100 hover:to-blue-200/80 hover:text-blue-700 active:scale-95',
              sizeFor(theme.count),
            )}
            aria-label={`Search books about ${theme.word}`}
          >
            <span>{theme.word}</span>
            <span className="inline-flex items-center justify-center rounded-full bg-white/70 px-1.5 text-[10px] font-semibold tabular-nums text-blue-700 ring-1 ring-blue-100">
              ×{theme.count}
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  )
}

export default ThemesCloud
