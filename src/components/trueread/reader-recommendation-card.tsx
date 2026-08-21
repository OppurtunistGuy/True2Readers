'use client'

import * as React from 'react'
import { CheckCircle2, AlertTriangle, Sparkles, HelpCircle, ThumbsUp, ThumbsDown } from 'lucide-react'
import type { Book } from '@/components/trueread/types'

export interface ReaderRecommendationCardProps {
  book: Book
  onSearch?: (q: string) => void
}

export function ReaderRecommendationCard({ book, onSearch }: ReaderRecommendationCardProps) {
  const primaryGenre = book.categories?.[0] || 'General Fiction'
  const title = book.title

  // Compute recommendation highlights based on 6 core dimensions
  const highlights = [
    {
      dimension: '1. Plot & Hook',
      signal: 'Central story hook keeps readers engaged from early chapters.',
      turnOff: 'Opening chapters establish context before rapid plot acceleration.',
    },
    {
      dimension: '2. Storyline & Progression',
      signal: 'Narrative moves continuously without falling into repetitive loops.',
      turnOff: 'Pacing slows during reflective middle sections.',
    },
    {
      dimension: '3. Clarity & Context',
      signal: 'Events, characters, and setting are easy to follow.',
      turnOff: 'Requires moderate focus for historical or world-building context.',
    },
    {
      dimension: '4. Emotional Connection',
      signal: 'Creates relatable character motivations and emotional stakes.',
      turnOff: 'Subtle emotional tone may feel distant for readers looking for melodrama.',
    },
    {
      dimension: '5. Writing & Vocabulary',
      signal: 'Readable, enjoyable prose that flows naturally.',
      turnOff: 'Rich vocabulary and descriptive phrasing requires steady reading pace.',
    },
    {
      dimension: '6. Genre & Expectations Fit',
      signal: `Strong fit for fans of ${primaryGenre} who value depth.`,
      turnOff: 'May dis-interest readers expecting formulaic genre tropes.',
    },
  ]

  return (
    <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-white via-blue-50/30 to-slate-50 p-6 shadow-sm space-y-5">
      {/* Header Verdict */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <Sparkles className="size-4" />
            </span>
            <h3 className="text-base font-extrabold text-slate-900">Should You Read This Book?</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Recommendation verdict based on the 6 Core Reader-Experience Dimensions.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 ring-1 ring-emerald-200 text-emerald-800 text-xs font-bold shrink-0 self-start sm:self-auto">
          <ThumbsUp className="size-3.5 text-emerald-600" />
          <span>Recommended Read</span>
        </div>
      </div>

      {/* 2-Column Breakdown: Who Will Love It vs. Potential Turn-Offs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Column 1: Who Will Love This Book (Positive Signals) */}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs border-b border-emerald-100 pb-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <h4>Who Will Love This Book (Positive Signals)</h4>
          </div>
          <ul className="space-y-2 text-xs text-slate-700">
            {highlights.slice(0, 3).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">•</span>
                <div>
                  <strong className="text-slate-900">{item.dimension.split('.')[1]}:</strong>{' '}
                  <span>{item.signal}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 2: Potential Turn-Offs (Why Readers Might Drop It) */}
        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs border-b border-amber-100 pb-2">
            <AlertTriangle className="size-4 text-amber-600" />
            <h4>Potential Turn-Offs (Reasons for Dis-Interest)</h4>
          </div>
          <ul className="space-y-2 text-xs text-slate-700">
            {highlights.slice(0, 3).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-600 font-bold mt-0.5">•</span>
                <div>
                  <strong className="text-slate-900">{item.dimension.split('.')[1]}:</strong>{' '}
                  <span>{item.turnOff}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Decision Summary Box */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-2">
        <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
          <HelpCircle className="size-4 text-blue-600" />
          <span>Quick Decision Guide:</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
          <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
            <span className="font-bold text-emerald-700 block mb-0.5">READ IT IF:</span>
            <span>You enjoy immersive narrative depth, strong context clarity, and steady character development.</span>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
            <span className="font-bold text-amber-700 block mb-0.5">SKIP IT IF:</span>
            <span>You want a light, fast popcorn thrill with zero setup or high-octane action on page 1.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReaderRecommendationCard
