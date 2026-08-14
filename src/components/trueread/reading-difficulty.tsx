'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, TrendingUp } from 'lucide-react'
import type { ReadingDifficulty } from './reading-insights'
import { cn } from '@/lib/utils'

/**
 * Color mapping per difficulty kind — locked to the navy + blue palette
 * (no indigo / purple). Lower = cooler / softer; higher = warmer red
 * tones so the user gets an immediate visual cue.
 */
const KIND_STYLES: Record<
  ReadingDifficulty['kind'],
  { chip: string; bar: string; dot: string }
> = {
  easy: {
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    bar: 'bg-emerald-500',
    dot: 'bg-emerald-500',
  },
  accessible: {
    chip: 'bg-blue-50 text-blue-700 ring-blue-100',
    bar: 'bg-blue-500',
    dot: 'bg-blue-500',
  },
  moderate: {
    chip: 'bg-sky-50 text-sky-700 ring-sky-100',
    bar: 'bg-sky-500',
    dot: 'bg-sky-500',
  },
  challenging: {
    chip: 'bg-amber-50 text-amber-700 ring-amber-100',
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
  },
  dense: {
    chip: 'bg-red-50 text-red-700 ring-red-100',
    bar: 'bg-red-500',
    dot: 'bg-red-500',
  },
}

export interface ReadingDifficultyChipProps {
  /** The computed difficulty (from getReadingDifficulty). */
  difficulty: ReadingDifficulty
}

/**
 * Compact chip + 5-segment difficulty meter for the detail view.
 *
 * Renders as an inline-flex card with:
 *   - A label chip showing the difficulty name (Easy / Accessible / Moderate
 *     / Challenging / Dense).
 *   - A 5-segment progress bar that fills to the difficulty score.
 *   - A small subtitle with the underlying metrics (avg word length +
 *     avg sentence length — real derived data).
 *
 * The colors are locked to the Prototype 2 palette: cool blues/greens for
 * easier reads, warm ambers/reds for denser reads. No indigo / purple.
 */
export function ReadingDifficultyChip({
  difficulty,
}: ReadingDifficultyChipProps) {
  const styles = KIND_STYLES[difficulty.kind]
  // 5 segments; fill = score (rounded to nearest 0.5 then visualized as
  // filled / half / empty per segment).
  const filledWhole = Math.floor(difficulty.score)
  const hasHalf = difficulty.score - filledWhole >= 0.5

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="inline-flex flex-col gap-2 rounded-xl bg-white p-3 ring-1 ring-slate-200/70 trueread-shadow-card"
      role="group"
      aria-label={`Reading difficulty: ${difficulty.label}, score ${difficulty.score} out of 5`}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <BookOpen className="size-3.5" strokeWidth={2.25} />
        </span>
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Reading difficulty
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1',
              styles.chip,
            )}
          >
            <span className={cn('size-1.5 rounded-full', styles.dot)} />
            {difficulty.label}
          </span>
        </div>
        <span className="ml-auto text-xs font-bold tabular-nums text-slate-700">
          {difficulty.score.toFixed(1)}
          <span className="text-slate-400">/5</span>
        </span>
      </div>
      {/* 5-segment difficulty meter */}
      <div className="flex items-center gap-1" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < filledWhole
          const half = i === filledWhole && hasHalf
          return (
            <div
              key={i}
              className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"
            >
              <div
                className={cn(
                  'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
                  styles.bar,
                  filled ? 'w-full' : half ? 'w-1/2' : 'w-0',
                )}
              />
            </div>
          )
        })}
      </div>
      {/* Underlying metrics — real derived data, transparently shown */}
      <div className="flex items-center gap-3 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <TrendingUp className="size-3" strokeWidth={2} />
          <span className="tabular-nums">{difficulty.avgWordLength}</span> chars/word
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="tabular-nums">
            {difficulty.avgSentenceLength}
          </span>{' '}
          words/sentence
        </span>
      </div>
    </motion.div>
  )
}

export default ReadingDifficultyChip
