'use client'

import * as React from 'react'
import { Clock, MessagesSquare, Smile, Sparkles } from 'lucide-react'
import type { Book } from '@/components/trueread/types'
import { getBreakdown, type Breakdown } from './mock-ai'

export interface AiBreakdownProps {
  book: Book
}

/**
 * Segmented progress bar with 5 segments.
 * Filled segments are blue-600, empty segments are slate-200.
 */
function SegmentedBar({ level }: { level: number }) {
  return (
    <div className="flex flex-1 items-center gap-1" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={
            i < level
              ? 'h-1.5 flex-1 rounded-full bg-blue-600'
              : 'h-1.5 flex-1 rounded-full bg-slate-200'
          }
        />
      ))}
    </div>
  )
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: { label: string; level: number }
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </span>
      <span className="w-28 shrink-0 text-sm font-medium text-slate-700 sm:w-24">
        {label}
      </span>
      <SegmentedBar level={value.level} />
      <span className="w-20 shrink-0 text-right text-xs text-slate-500">
        {value.label}
      </span>
    </div>
  )
}

/**
 * "AI-Style Breakdown (Mock)" panel.
 *
 * A bg-slate-50 rounded card with a Sparkles icon header and three rows
 * (Pacing / Tone / Dialogue Density), each showing a segmented progress
 * bar. Includes a tiny disclaimer that this is mock, not real AI.
 */
export function AiBreakdown({ book }: AiBreakdownProps) {
  const breakdown: Breakdown = React.useMemo(() => getBreakdown(book), [book])

  return (
    <section
      aria-label="AI-style breakdown (mock)"
      className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200/70"
    >
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="size-5 text-blue-600" strokeWidth={2.25} />
        <h3 className="text-base font-semibold text-slate-900">
          AI-Style Breakdown
        </h3>
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
          Mock
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <Row
          icon={<Clock className="size-5" strokeWidth={2} />}
          label="Pacing"
          value={breakdown.pacing}
        />
        <Row
          icon={<Smile className="size-5" strokeWidth={2} />}
          label="Tone"
          value={breakdown.tone}
        />
        <Row
          icon={<MessagesSquare className="size-5" strokeWidth={2} />}
          label="Dialogue"
          value={breakdown.dialogue}
        />
      </div>

      <p className="mt-4 text-[11px] text-slate-400">
        Mock analysis — not a real AI call.
      </p>
    </section>
  )
}

export default AiBreakdown
