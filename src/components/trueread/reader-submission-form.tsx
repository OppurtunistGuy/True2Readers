'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Clock, Smile, MessagesSquare, Send, CheckCircle2, AlertCircle, LogIn, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from './auth-context'

export interface ReaderSubmissionFormProps {
  bookId: string
  existingFeedback?: {
    pacing: number
    tone: number
    dialogue: number
    note?: string | null
  } | null
  onSuccess?: () => void
}

const PACING_LABELS = ['Slow', 'Steady', 'Medium', 'Brisk', 'Fast']
const TONE_LABELS = ['Contemplative', 'Thoughtful', 'Motivational', 'Light-hearted', 'Dark']
const DIALOGUE_LABELS = ['Sparse', 'Low', 'Medium-Low', 'Medium', 'High']

export function ReaderSubmissionForm({
  bookId,
  existingFeedback,
  onSuccess,
}: ReaderSubmissionFormProps) {
  const { user, openAuthModal } = useAuth()

  const [pacing, setPacing] = React.useState<number>(existingFeedback?.pacing ?? 3)
  const [tone, setTone] = React.useState<number>(existingFeedback?.tone ?? 3)
  const [dialogue, setDialogue] = React.useState<number>(existingFeedback?.dialogue ?? 3)
  const [note, setNote] = React.useState<string>(existingFeedback?.note ?? '')

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [successMsg, setSuccessMsg] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (existingFeedback) {
      setPacing(existingFeedback.pacing)
      setTone(existingFeedback.tone)
      setDialogue(existingFeedback.dialogue)
      setNote(existingFeedback.note ?? '')
    }
  }, [existingFeedback])

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
        body: JSON.stringify({ pacing, tone, dialogue, note }),
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
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
            <Edit3 className="size-5" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              How did this book actually feel to you?
            </h4>
            <p className="text-xs text-slate-500">
              Sign in to contribute your reader breakdown & notes.
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={openAuthModal}
            size="sm"
            className="rounded-xl bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 shadow-xs"
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
            <h3 className="text-sm font-bold text-slate-900">
              How did this book actually feel to you?
            </h3>
            <p className="text-[11px] text-slate-500">
              Your feedback is averaged into the Reader Breakdown
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
          <span>Your style feedback has been saved and included in the Reader Breakdown!</span>
        </motion.div>
      )}

      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-800 ring-1 ring-rose-200">
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Pacing Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <Clock className="size-3.5 text-blue-600" /> Pacing
            </span>
            <span className="font-semibold text-blue-700 tabular-nums">
              {PACING_LABELS[pacing - 1]} ({pacing}/5)
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={pacing}
            onChange={(e) => setPacing(Number(e.target.value))}
            className="h-2 w-full cursor-pointer rounded-lg bg-slate-200 accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-medium px-0.5">
            <span>Slow</span>
            <span>Fast</span>
          </div>
        </div>

        {/* Tone Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <Smile className="size-3.5 text-blue-600" /> Tone
            </span>
            <span className="font-semibold text-blue-700 tabular-nums">
              {TONE_LABELS[tone - 1]} ({tone}/5)
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={tone}
            onChange={(e) => setTone(Number(e.target.value))}
            className="h-2 w-full cursor-pointer rounded-lg bg-slate-200 accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-medium px-0.5">
            <span>Light</span>
            <span>Dark</span>
          </div>
        </div>

        {/* Dialogue Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <MessagesSquare className="size-3.5 text-blue-600" /> Dialogue
            </span>
            <span className="font-semibold text-blue-700 tabular-nums">
              {DIALOGUE_LABELS[dialogue - 1]} ({dialogue}/5)
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={dialogue}
            onChange={(e) => setDialogue(Number(e.target.value))}
            className="h-2 w-full cursor-pointer rounded-lg bg-slate-200 accent-blue-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-medium px-0.5">
            <span>Sparse</span>
            <span>Heavy</span>
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Optional Note / Thoughts
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., Quick read with punchy dialogue, perfect for a long weekend..."
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 self-end rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all"
        >
          <Send className="mr-1.5 size-3.5" />
          {isSubmitting ? 'Saving...' : existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
        </Button>
      </form>
    </section>
  )
}
