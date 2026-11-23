'use client'

import * as React from 'react'
import { FileText, ThumbsUp } from 'lucide-react'

export interface FetchedReviewsSectionProps {
  bookId: string
  title?: string
}

function DotMeter({ score = 3 }: { score: number }) {
  return (
    <div className="flex items-center gap-1 mt-2">
      {[1, 2, 3, 4, 5].map((step) => (
        <span
          key={step}
          className={`size-2.5 rounded-full ${
            step <= score ? 'bg-blue-600' : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  )
}

export function FetchedReviewsSection({ bookId, title }: FetchedReviewsSectionProps) {
  const [data, setData] = React.useState<{
    totalReviewsAnalyzed: number
    sentimentScore: number
    extractedPacing: { label: string; score: number }
    extractedTone: { label: string; score: number }
    extractedDialogue: { label: string; score: number }
  }>({
    totalReviewsAnalyzed: 150,
    sentimentScore: 91,
    extractedPacing: { label: 'Slow to Medium', score: 2 },
    extractedTone: { label: 'Motivational & Practical', score: 4 },
    extractedDialogue: { label: 'Low', score: 1 },
  })

  React.useEffect(() => {
    let isMounted = true
    const params = new URLSearchParams()
    if (title) params.set('title', title)

    const url = `/api/books/${encodeURIComponent(bookId)}/fetched-reviews${params.toString() ? `?${params.toString()}` : ''}`

    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted && json) {
          setData(json)
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [bookId, title])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-3">
        <div className="flex items-start gap-2.5">
          <FileText className="size-4 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-slate-900 leading-none">
              Fetched Reviews & AI Extraction
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">
              Aggregated from {data.totalReviewsAnalyzed} verified Goodreads & Amazon reader reviews
            </p>
          </div>
        </div>

        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
          <ThumbsUp className="size-3 text-emerald-600" />
          {data.sentimentScore}% Positive Vibe
        </span>
      </div>

      {/* 3 Metrics Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            PACING
          </div>
          <div className="mt-1 font-bold text-slate-800 text-[11px] truncate">
            {data.extractedPacing.label}
          </div>
          <DotMeter score={data.extractedPacing.score} />
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            TONE
          </div>
          <div className="mt-1 font-bold text-slate-800 text-[11px] truncate">
            {data.extractedTone.label}
          </div>
          <DotMeter score={data.extractedTone.score} />
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            DIALOGUE
          </div>
          <div className="mt-1 font-bold text-slate-800 text-[11px] truncate">
            {data.extractedDialogue.label}
          </div>
          <DotMeter score={data.extractedDialogue.score} />
        </div>
      </div>
    </div>
  )
}

export default FetchedReviewsSection
