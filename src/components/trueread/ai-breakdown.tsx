'use client'

import * as React from 'react'
import {
  Brain,
  Clock,
  MessagesSquare,
  Smile,
  Sparkles,
  Zap,
} from 'lucide-react'
import { motion } from 'framer-motion'
import type { Book } from '@/components/trueread/types'
import { getBreakdown, type Breakdown } from './mock-ai'

export interface AiBreakdownProps {
  book: Book
}

/**
 * Animated segmented progress bar with 5 segments.
 * Filled segments are blue-600, empty segments are slate-200.
 * Each segment animates in with a staggered delay.
 */
function SegmentedBar({ level, delay = 0 }: { level: number; delay?: number }) {
  return (
    <div className="flex flex-1 items-center gap-1" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{
            duration: 0.3,
            delay: delay + i * 0.06,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={
            i < level
              ? 'h-2 flex-1 rounded-full bg-blue-600 origin-left'
              : 'h-2 flex-1 rounded-full bg-slate-200 origin-left'
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
  delay = 0,
}: {
  icon: React.ReactNode
  label: string
  value: { label: string; level: number }
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3"
    >
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </span>
      <span className="w-28 shrink-0 text-sm font-medium text-slate-700 sm:w-24">
        {label}
      </span>
      <SegmentedBar level={value.level} delay={delay + 0.1} />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: delay + 0.35 }}
        className="w-20 shrink-0 text-right text-xs font-medium text-slate-500"
      >
        {value.label}
      </motion.span>
    </motion.div>
  )
}

/**
 * "AI-Style Breakdown (Mock)" panel.
 *
 * A bg-slate-50 rounded card with a Sparkles icon header and four rows
 * (Pacing / Tone / Dialogue Density / Complexity), each showing an animated
 * segmented progress bar. Includes a tiny disclaimer that this is mock, not real AI.
 */
export function AiBreakdown({ book }: AiBreakdownProps) {
  const breakdown: Breakdown = React.useMemo(() => getBreakdown(book), [book])

  return (
    <section
      aria-label="AI-style breakdown (mock)"
      className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200/70"
    >
      <div className="mb-5 flex items-center gap-2">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <Sparkles className="size-4" strokeWidth={2.25} />
        </span>
        <h3 className="text-base font-semibold text-slate-900">
          AI-Style Breakdown
        </h3>
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 ring-1 ring-blue-100">
          Mock
        </span>
      </div>

      <div className="flex flex-col gap-5">
        <Row
          icon={<Clock className="size-5" strokeWidth={2} />}
          label="Pacing"
          value={breakdown.pacing}
          delay={0}
        />
        <Row
          icon={<Smile className="size-5" strokeWidth={2} />}
          label="Tone"
          value={breakdown.tone}
          delay={0.08}
        />
        <Row
          icon={<MessagesSquare className="size-5" strokeWidth={2} />}
          label="Dialogue"
          value={breakdown.dialogue}
          delay={0.16}
        />
        <Row
          icon={<Brain className="size-5" strokeWidth={2} />}
          label="Complexity"
          value={breakdown.complexity}
          delay={0.24}
        />
      </div>

      <p className="mt-5 text-[11px] text-slate-400">
        Mock analysis — not a real AI call.
      </p>
    </section>
  )
}

export default AiBreakdown
