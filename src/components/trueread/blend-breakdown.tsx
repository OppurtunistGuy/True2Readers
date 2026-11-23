'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Users, Clock, Smile, MessagesSquare, MessageCircle, Brain } from 'lucide-react'
import type { Book } from '@/components/trueread/types'
import { getBreakdown, type Breakdown } from './mock-ai'
import { AiBreakdown } from './ai-breakdown'

export interface FeedbackData {
  count: number
  averages: {
    pacing: number
    tone: number
    dialogue: number
  } | null
  userFeedback?: {
    id: string
    pacing: number
    tone: number
    dialogue: number
    note?: string | null
  } | null
  feedbacks: Array<{
    id: string
    pacing: number
    tone: number
    dialogue: number
    note?: string | null
    createdAt: string
    authorName: string
  }>
}

export interface BlendBreakdownProps {
  book: Book
  feedbackData?: FeedbackData | null
}

const PACING_LABELS = ['Slow', 'Steady', 'Medium', 'Brisk', 'Fast']
const TONE_LABELS = ['Contemplative', 'Thoughtful', 'Motivational', 'Light-hearted', 'Dark']
const DIALOGUE_LABELS = ['Sparse', 'Low', 'Medium-Low', 'Medium', 'High']

function getLabelForLevel(level: number, labels: string[]): string {
  const idx = Math.min(Math.max(Math.round(level) - 1, 0), labels.length - 1)
  return labels[idx]
}

function SegmentedBar({ level, color = 'bg-blue-600' }: { level: number; color?: string }) {
  return (
    <div className="flex flex-1 items-center gap-1" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={
            i < Math.round(level)
              ? `h-2 flex-1 rounded-full ${color}`
              : 'h-2 flex-1 rounded-full bg-slate-200'
          }
        />
      ))}
    </div>
  )
}

function BreakdownRow({
  icon,
  label,
  value,
  labelText,
  color = 'bg-blue-600',
}: {
  icon: React.ReactNode
  label: string
  value: number
  labelText: string
  color?: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </span>
      <span className="w-20 shrink-0 text-xs font-semibold text-slate-700">
        {label}
      </span>
      <SegmentedBar level={value} color={color} />
      <span className="w-20 shrink-0 text-right text-[11px] font-semibold tabular-nums text-slate-500">
        {labelText}
      </span>
    </div>
  )
}

export function BlendBreakdown({ book, feedbackData }: BlendBreakdownProps) {
  const aiBreakdown: Breakdown = React.useMemo(() => getBreakdown(book), [book])
  const count = feedbackData?.count || 0

  // If zero submissions, show AI breakdown alone (no fake averages)
  if (count === 0 || !feedbackData?.averages) {
    return <AiBreakdown book={book} />
  }

  const readerAverages = feedbackData.averages
  const readerNotes = feedbackData.feedbacks.filter((f) => f.note && f.note.trim().length > 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Header bar */}
      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-900 to-slate-900 p-3 px-4 text-white shadow-md">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
            Style Comparison
          </span>
          <span className="text-xs font-medium text-slate-300">|</span>
          <span className="text-xs font-semibold text-white">AI vs. Reader Consensus</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-blue-200 ring-1 ring-blue-400/30">
          <Users className="size-3" />
          {count} {count === 1 ? 'Reader Review' : 'Reader Reviews'}
        </span>
      </div>

      {/* Side-by-side grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left Column: AI Breakdown */}
        <div className="flex flex-col justify-between rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Sparkles className="size-3.5" />
                </span>
                <h4 className="text-xs font-bold text-slate-900">AI Analysis</h4>
              </div>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-700 ring-1 ring-blue-100">
                Algorithmic
              </span>
            </div>

            <div className="flex flex-col gap-3.5">
              <BreakdownRow
                icon={<Clock className="size-3.5" />}
                label="Pacing"
                value={aiBreakdown.pacing.level}
                labelText={aiBreakdown.pacing.label}
              />
              <BreakdownRow
                icon={<Smile className="size-3.5" />}
                label="Tone"
                value={aiBreakdown.tone.level}
                labelText={aiBreakdown.tone.label}
              />
              <BreakdownRow
                icon={<MessagesSquare className="size-3.5" />}
                label="Dialogue"
                value={aiBreakdown.dialogue.level}
                labelText={aiBreakdown.dialogue.label}
              />
              <BreakdownRow
                icon={<Brain className="size-3.5" />}
                label="Complexity"
                value={aiBreakdown.complexity.level}
                labelText={aiBreakdown.complexity.label}
              />
            </div>
          </div>

          <p className="mt-4 text-[10px] text-slate-500">
            Algorithmic parsing derived from description & structural markers.
          </p>
        </div>

        {/* Right Column: Reader Breakdown */}
        <div className="flex flex-col justify-between rounded-2xl bg-blue-50/40 p-4 ring-1 ring-blue-200/60">
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-blue-200/60 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Users className="size-3.5" />
                </span>
                <h4 className="text-xs font-bold text-slate-900">Reader Breakdown</h4>
              </div>
              <span className="rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
                {count} {count === 1 ? 'Submission' : 'Submissions'}
              </span>
            </div>

            <div className="flex flex-col gap-3.5">
              <BreakdownRow
                icon={<Clock className="size-3.5 text-emerald-600" />}
                label="Pacing"
                value={readerAverages.pacing}
                labelText={getLabelForLevel(readerAverages.pacing, PACING_LABELS)}
                color="bg-emerald-600"
              />
              <BreakdownRow
                icon={<Smile className="size-3.5 text-emerald-600" />}
                label="Tone"
                value={readerAverages.tone}
                labelText={getLabelForLevel(readerAverages.tone, TONE_LABELS)}
                color="bg-emerald-600"
              />
              <BreakdownRow
                icon={<MessagesSquare className="size-3.5 text-emerald-600" />}
                label="Dialogue"
                value={readerAverages.dialogue}
                labelText={getLabelForLevel(readerAverages.dialogue, DIALOGUE_LABELS)}
                color="bg-emerald-600"
              />
            </div>
          </div>

          {/* Reader Notes snippet if available */}
          {readerNotes.length > 0 ? (
            <div className="mt-4 rounded-xl bg-white/90 p-2.5 ring-1 ring-blue-100">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                <MessageCircle className="size-3 text-blue-600" />
                <span>Reader Note ({readerNotes[0].authorName}):</span>
              </div>
              <p className="mt-1 text-[11px] italic text-slate-600 line-clamp-2">
                &ldquo;{readerNotes[0].note}&rdquo;
              </p>
            </div>
          ) : (
            <p className="mt-4 text-[10px] text-slate-500">
              Real community feedback average.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
