'use client'

import * as React from 'react'
import { MessageSquareText, ThumbsUp, Quote, ShieldCheck } from 'lucide-react'
import type { FetchedReviewSignal } from '@/app/api/books/[id]/fetched-reviews/route'

export interface FetchedReviewsSectionProps {
  bookId: string
  title?: string
}

export function FetchedReviewsSection({ bookId, title }: FetchedReviewsSectionProps) {
  const [data, setData] = React.useState<FetchedReviewSignal | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let isMounted = true
    setLoading(true)

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
      .catch((err) => console.error('Failed to load fetched reviews:', err))
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [bookId, title])

  if (loading) {
    return (
      <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 animate-pulse">
        <div className="h-4 w-48 rounded bg-slate-200 mb-3" />
        <div className="h-3 w-64 rounded bg-slate-200" />
      </div>
    )
  }

  if (!data) return null

  return (
    <section className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200/80">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <MessageSquareText className="size-4" strokeWidth={2.25} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Fetched Reviews & AI Extraction
            </h3>
            <p className="text-[11px] text-slate-500">
              Aggregated from {data.totalReviewsAnalyzed} verified Goodreads & Amazon reader reviews
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
          <ThumbsUp className="size-3 text-emerald-600" />
          {data.sentimentScore}% Positive Vibe
        </span>
      </div>

      {/* Extracted Style Signals */}
      <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Pacing Signal
          </div>
          <div className="mt-1 font-bold text-slate-800 text-xs">
            {data.extractedPacing.label}
          </div>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full ${
                  step <= data.extractedPacing.score
                    ? 'bg-blue-600'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Tone Signal
          </div>
          <div className="mt-1 font-bold text-slate-800 text-xs">
            {data.extractedTone.label}
          </div>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full ${
                  step <= data.extractedTone.score
                    ? 'bg-blue-600'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Dialogue Signal
          </div>
          <div className="mt-1 font-bold text-slate-800 text-xs">
            {data.extractedDialogue.label}
          </div>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full ${
                  step <= data.extractedDialogue.score
                    ? 'bg-blue-600'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Extracted Quotes */}
      <div>
        <h4 className="mb-2 text-xs font-bold text-slate-700">
          Key Style Quotes Extracted by AI
        </h4>
        <div className="flex flex-col gap-2">
          {data.extractedQuotes.map((q, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200/60 bg-white p-3 text-xs text-slate-600 shadow-2xs"
            >
              <div className="flex items-start gap-2">
                <Quote className="mt-0.5 size-3.5 shrink-0 text-blue-500" />
                <div>
                  <p className="italic leading-relaxed text-slate-700">
                    &ldquo;{q.quote}&rdquo;
                  </p>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-600">
                      — {q.reviewer}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-blue-600">
                      <ShieldCheck className="size-3 text-blue-500" />
                      {q.sourceName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
