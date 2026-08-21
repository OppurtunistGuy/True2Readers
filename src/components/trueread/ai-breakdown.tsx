'use client'

import * as React from 'react'
import { Sparkles, AlertTriangle, CheckCircle } from 'lucide-react'
import type { Book } from '@/components/trueread/types'

export interface AiBreakdownProps {
  book?: Book
}

export interface DimensionMetric {
  id: number
  title: string
  description: string
  signalType: 'positive' | 'warning'
  signalText: string
  rating: number // 1 to 5
}

function DotMeter({ dots = 3 }: { dots: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`size-2 rounded-full ${
            i < dots ? 'bg-blue-600' : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  )
}

export const CORE_READER_DIMENSIONS: DimensionMetric[] = [
  {
    id: 1,
    title: 'Plot & Hook',
    description: 'Central story or idea that keeps you engaged from the start.',
    signalType: 'positive',
    signalText: 'Generally strong',
    rating: 5,
  },
  {
    id: 2,
    title: 'Storyline & Progression',
    description: 'How well the content develops and moves forward.',
    signalType: 'warning',
    signalText: 'May feel slow in parts',
    rating: 4,
  },
  {
    id: 3,
    title: 'Clarity & Context',
    description: "How easy it is to understand the author's ideas and messages.",
    signalType: 'positive',
    signalText: 'Clear and well-structured',
    rating: 4,
  },
  {
    id: 4,
    title: 'Emotional Connection',
    description: 'How well the book creates relatable emotions or moments.',
    signalType: 'warning',
    signalText: 'Some moments may feel distant',
    rating: 3,
  },
  {
    id: 5,
    title: 'Writing & Vocabulary',
    description: 'Quality of writing style and word choice.',
    signalType: 'positive',
    signalText: 'Simple, clear, and enjoyable',
    rating: 4,
  },
  {
    id: 6,
    title: 'Genre & Expectations Fit',
    description: 'How well it matches what readers in this genre usually expect.',
    signalType: 'positive',
    signalText: 'Well-aligned with the genre',
    rating: 4,
  },
]

export function AiBreakdown({ book }: AiBreakdownProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
      {/* Top Header */}
      <div className="flex flex-col gap-1 border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Reader Experience Framework
            </h3>
          </div>
          <span className="flex size-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
            6
          </span>
        </div>
        <p className="text-[11px] text-slate-500">
          Core dimensions that shape your reading experience.
        </p>
      </div>

      {/* 6 Core Reader Dimensions */}
      <div className="space-y-3">
        {CORE_READER_DIMENSIONS.map((dim) => (
          <div
            key={dim.id}
            className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1.5 hover:border-blue-200 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="flex size-4 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                  {dim.id}
                </span>
                {dim.title}
              </span>
              <DotMeter dots={dim.rating} />
            </div>

            <p className="text-[11px] text-slate-600 leading-snug">
              {dim.description}
            </p>

            <div className="pt-1 border-t border-slate-100/80 text-[10px]">
              {dim.signalType === 'positive' ? (
                <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle className="size-3 shrink-0 text-emerald-600" />
                  <span>{dim.signalText}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-700 font-semibold">
                  <AlertTriangle className="size-3 shrink-0 text-amber-600" />
                  <span>{dim.signalText}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-400 italic text-center border-t border-slate-100 pt-2">
        Mock analysis — not a real AI call.
      </p>
    </div>
  )
}

export default AiBreakdown
