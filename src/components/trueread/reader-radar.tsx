'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Zap,
  Flame,
  BrainCircuit,
  Compass,
  CheckCircle2,
  CalendarCheck2,
  Sparkles,
} from 'lucide-react'
import type { Book } from '@/components/trueread/types'
import {
  getHookVelocity,
  getReadingEffort,
  getMicroSessions,
  getReadingDifficulty,
  type HookVelocity,
  type ReadingEffort,
  type MicroSessionsInfo,
} from './reading-insights'
import { getBreakdown } from './mock-ai'
import { cn } from '@/lib/utils'

export interface ReaderRadarProps {
  book: Book
  className?: string
}

const HOOK_STYLES: Record<
  HookVelocity['speed'],
  { badge: string; dot: string; bar: string; iconColor: string }
> = {
  instant: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
    iconColor: 'text-emerald-600',
  },
  brisk: {
    badge: 'bg-blue-50 text-blue-700 ring-blue-200/80',
    dot: 'bg-blue-500',
    bar: 'bg-blue-500',
    iconColor: 'text-blue-600',
  },
  steady: {
    badge: 'bg-sky-50 text-sky-700 ring-sky-200/80',
    dot: 'bg-sky-500',
    bar: 'bg-sky-500',
    iconColor: 'text-sky-600',
  },
  gradual: {
    badge: 'bg-amber-50 text-amber-800 ring-amber-200/80',
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
    iconColor: 'text-amber-600',
  },
}

const EFFORT_STYLES: Record<
  ReadingEffort['level'],
  { badge: string; ring: string; icon: string }
> = {
  light: {
    badge: 'bg-emerald-50 text-emerald-700',
    ring: 'ring-emerald-200',
    icon: 'text-emerald-600',
  },
  moderate: {
    badge: 'bg-blue-50 text-blue-700',
    ring: 'ring-blue-200',
    icon: 'text-blue-600',
  },
  deep: {
    badge: 'bg-indigo-50 text-slate-800',
    ring: 'ring-slate-300',
    icon: 'text-blue-600',
  },
  demanding: {
    badge: 'bg-amber-50 text-amber-800',
    ring: 'ring-amber-200',
    icon: 'text-amber-600',
  },
}

/**
 * ReaderRadar: Solves Reader Disinterest & Reading Slump Friction.
 * Displays:
 * 1. Hook Velocity (Instant Hook vs Slow Burn)
 * 2. Reading Effort / Cognitive Bandwidth Required
 * 3. 10-Minute Micro-Sessions Habit Blueprint
 */
export function ReaderRadar({ book, className }: ReaderRadarProps) {
  const breakdown = React.useMemo(() => getBreakdown(book), [book])
  const hookVelocity = React.useMemo(
    () => getHookVelocity(book, breakdown?.pacing?.level),
    [book, breakdown],
  )
  const readingEffort = React.useMemo(
    () => getReadingEffort(book, breakdown?.complexity?.level),
    [book, breakdown],
  )
  const microSessions = React.useMemo(
    () => getMicroSessions(book.pageCount),
    [book.pageCount],
  )

  const hookStyle = HOOK_STYLES[hookVelocity.speed]
  const effortStyle = EFFORT_STYLES[readingEffort.level]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'w-full rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/70 p-4 shadow-xs ring-1 ring-slate-100',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Zap className="size-4" strokeWidth={2.25} />
          </span>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Reader Engagement Radar
            </h3>
            <p className="text-[11px] text-slate-500">
              Friction signals & attention match
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 ring-1 ring-blue-100">
          <Sparkles className="size-2.5" />
          Anti-Slump
        </span>
      </div>

      <div className="mt-3.5 space-y-3.5">
        {/* 1. Hook Velocity */}
        <div className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Flame className={cn('size-3.5', hookStyle.iconColor)} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Hook Velocity
              </span>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1',
                hookStyle.badge,
              )}
            >
              <span className={cn('size-1.5 rounded-full', hookStyle.dot)} />
              {hookVelocity.label}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"
              >
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    i < hookVelocity.score ? hookStyle.bar : 'w-0',
                  )}
                />
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
            {hookVelocity.description}
          </p>
        </div>

        {/* 2. Reading Effort / Bandwidth */}
        <div className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <BrainCircuit className={cn('size-3.5', effortStyle.icon)} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Mental Effort
              </span>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1',
                effortStyle.badge,
                effortStyle.ring,
              )}
            >
              {readingEffort.label}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] font-medium text-slate-700">
            {readingEffort.tagline}
          </p>
          <div className="mt-1 flex items-start gap-1 text-[10px] text-slate-500">
            <span className="font-semibold text-slate-600">Best for:</span>
            <span>{readingEffort.idealFor}</span>
          </div>
        </div>

        {/* 3. Micro-Sessions Habit Builder */}
        {microSessions && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
            <div className="flex items-center gap-1.5">
              <CalendarCheck2 className="size-3.5 text-blue-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                10-Min Micro-Goals
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-xs font-bold text-slate-900">
                {microSessions.totalMicroSessions} bites of 10 min
              </span>
              <span className="text-[10px] font-medium text-blue-700">
                Easy habit builder
              </span>
            </div>
            <p className="mt-1 text-[10px] text-slate-600 leading-normal">
              💡 {microSessions.habitRecommendation}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default ReaderRadar
