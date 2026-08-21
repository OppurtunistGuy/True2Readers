'use client'

import * as React from 'react'
import type { ReadingDifficulty } from './reading-insights'

export interface ReadingDifficultyChipProps {
  /** The computed difficulty. */
  difficulty: ReadingDifficulty
}

export function ReadingDifficultyChip({ difficulty }: ReadingDifficultyChipProps) {
  const scorePercent = Math.min(Math.max((difficulty.score / 5) * 100, 10), 100)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
      {/* Header */}
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
        READING DIFFICULTY
      </h3>

      {/* Label & Score */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900">
          {difficulty.label}
        </span>
        <span className="text-sm font-bold text-slate-800">
          {difficulty.score.toFixed(1)}/5
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${scorePercent}%` }}
        />
      </div>

      {/* Metrics Footer */}
      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-medium">
        <span>{difficulty.avgWordLength} chars/word</span>
        <span>{difficulty.avgSentenceLength} words/sentence</span>
      </div>
    </div>
  )
}

export default ReadingDifficultyChip
