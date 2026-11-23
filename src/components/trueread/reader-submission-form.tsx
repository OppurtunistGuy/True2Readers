'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Edit3, CheckCircle2, AlertCircle, LogIn, Send, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from './auth-context'

export interface ReaderSubmissionFormProps {
  bookId: string
  existingFeedback?: {
    plotHook?: number
    progression?: number
    clarity?: number
    emotionalConn?: number
    writingStyle?: number
    genreFit?: number
    pacing?: number
    tone?: number
    dialogue?: number
    note?: string | null
  } | null
  onSuccess?: () => void
}

const DIMENSION_CONFIGS = [
  { key: 'plotHook', label: '1. Plot & Hook', description: 'Central story interest & initial hook', minLabel: 'Weak Hook', maxLabel: 'Strong Hook' },
  { key: 'progression', label: '2. Storyline & Progression', description: 'Pacing development vs. repetitive loops', minLabel: 'Dragging', maxLabel: 'Engaging' },
  { key: 'clarity', label: '3. Clarity & Context', description: 'Ease of understanding setting & events', minLabel: 'Confusing', maxLabel: 'Crystal Clear' },
  { key: 'emotionalConn', label: '4. Emotional Connection', description: 'Relatability & character care factor', minLabel: 'Distant', maxLabel: 'Deep Connection' },
  { key: 'writingStyle', label: '5. Writing & Vocabulary', description: 'Prose readability & sentence flow', minLabel: 'Clunky', maxLabel: 'Natural Flow' },
  { key: 'genreFit', label: '6. Genre & Expectations Fit', description: 'Match with genre/theme expectations', minLabel: 'Misleading', maxLabel: 'Perfect Fit' },
]

export function ReaderSubmissionForm({
  bookId,
  existingFeedback,
  onSuccess,
}: ReaderSubmissionFormProps) {
  const { user, openAuthModal } = useAuth()

  const [ratings, setRatings] = React.useState<Record<string, number>>({
    plotHook: existingFeedback?.plotHook ?? 4,
    progression: existingFeedback?.progression ?? 4,
    clarity: existingFeedback?.clarity ?? 5,
    emotionalConn: existingFeedback?.emotionalConn ?? 4,
    writingStyle: existingFeedback?.writingStyle ?? 4,
    genreFit: existingFeedback?.genreFit ?? 5,
  })

  const [note, setNote] = React.useState<string>(existingFeedback?.note ?? '')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [successMsg, setSuccessMsg] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const handleSliderChange = (key: string, val: number) => {
    setRatings((prev) => ({ ...prev, [key]: val }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      openAuthModal()
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)
    setSuccessMsg(false)

    try {
      const res = await fetch(`/api/books/${encodeURIComponent(bookId)}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ratings,
          pacing: ratings.progression,
          tone: ratings.emotionalConn,
          dialogue: ratings.writingStyle,
          note,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit feedback.')
      } else {
        setSuccessMsg(true)
        if (onSuccess) onSuccess()
        setTimeout(() => setSuccessMsg(false), 4000)
      }
    } catch (err) {
      console.error('Submission error:', err)
      setErrorMsg('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-blue-50/70 to-slate-50 p-5 ring-1 ring-blue-100">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Edit3 className="size-4.5" />
          </span>
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              Rate your reader experience across 6 core dimensions
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Sign in to contribute your breakdown & reader signals.
            </p>
          </div>
        </div>
        <div className="mt-3.5 flex justify-end">
          <Button
            onClick={openAuthModal}
            size="sm"
            className="w-full sm:w-auto rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs"
          >
            <LogIn className="mr-1.5 size-3.5" />
            Sign In to Share Feedback
          </Button>
        </div>
      </div>
    )
  }

  return (
    <section className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200/80">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Edit3 className="size-4" strokeWidth={2.25} />
          </span>
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Reader Experience Feedback (6 Dimensions)
            </h3>
            <p className="text-[10px] text-slate-500">
              Contribute your rating & signals to the Reader Breakdown
            </p>
          </div>
        </div>
        {existingFeedback && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
            Submitted
          </span>
        )}
      </div>

      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200"
        >
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>Your reader experience breakdown has been saved!</span>
        </motion.div>
      )}

      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-800 ring-1 ring-rose-200">
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {DIMENSION_CONFIGS.map((dim) => (
          <div key={dim.key} className="flex flex-col gap-1.5 rounded-xl border border-slate-100 bg-white p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">{dim.label}</span>
              <span className="font-bold text-blue-700 tabular-nums text-[11px]">
                {ratings[dim.key]}/5
              </span>
            </div>
            <p className="text-[10px] text-slate-500">{dim.description}</p>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={ratings[dim.key] || 3}
              onChange={(e) => handleSliderChange(dim.key, Number(e.target.value))}
              className="h-2 w-full cursor-pointer rounded-lg bg-slate-100 accent-blue-600"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-medium px-0.5">
              <span>{dim.minLabel}</span>
              <span>{dim.maxLabel}</span>
            </div>
          </div>
        ))}

        {/* Note */}
        <div className="pt-1">
          <label className="mb-1 block text-xs font-semibold text-slate-800">
            Turn-offs / Key Reader Signals & Notes
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Share what kept you hooked or caused dis-interest..."
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 self-end rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all"
        >
          <Send className="mr-1.5 size-3.5" />
          {isSubmitting ? 'Saving...' : existingFeedback ? 'Update Breakdown' : 'Submit Reader Breakdown'}
        </Button>
      </form>
    </section>
  )
}
