'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gauge, X } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { useLocalStorage } from './use-local-storage'
import { cn } from '@/lib/utils'

/** localStorage key — versioned so we can break schema later if needed. */
const LS_KEY_PACE = 'trueread:pace:v1'

const MIN_WPM = 100
const MAX_WPM = 600
const WPM_STEP = 10
const DEFAULT_WPM = 250

/** Quick-pick pace presets. */
const PRESETS: { label: string; wpm: number }[] = [
  { label: 'Slow', wpm: 150 },
  { label: 'Average', wpm: 250 },
  { label: 'Fast', wpm: 350 },
  { label: 'Speed reader', wpm: 500 },
]

export interface PaceCalculatorProps {
  /** Whether the modal is open. */
  isOpen: boolean
  /** Close the modal. */
  onClose: () => void
  /** The book's real page count. May be null/0 for Apple Books fallback. */
  pageCount?: number | null
  /** The book title — used for the header subtitle. */
  title: string
}

/**
 * Format a number of minutes as "Xh Ym" / "Xh" / "Y min".
 */
function formatMinutes(min: number): string {
  if (min < 60) return `${Math.round(min)} min`
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

/**
 * Personalized reading-pace calculator.
 *
 * Lets the user pick their reading speed (WPM) and shows a personalized
 * reading-time estimate based on the book's REAL pageCount. Pure math —
 * no fabrication.
 *
 * Formula: minutes = pageCount * (250 / wpm)
 *   (since 250 wpp/wpm gives a 1 min/page baseline at 250 WPM).
 *
 * Persists the chosen WPM to localStorage so it survives reloads.
 *
 * Graceful handling for Apple Books fallback (no pageCount): shows a helpful
 * message instead of broken math.
 *
 * Body scroll locked while open; Escape closes (intercepted at the parent
 * DetailView level via capture-phase listener).
 */
export function PaceCalculator({
  isOpen,
  onClose,
  pageCount,
  title,
}: PaceCalculatorProps) {
  const [wpm, setWpm] = useLocalStorage<number>(LS_KEY_PACE, DEFAULT_WPM)

  // Lock body scroll while open — same pattern as ReadingMode / CoverLightbox.
  React.useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [isOpen])

  // Clamp persisted value into the allowed range.
  const safeWpm = Math.min(MAX_WPM, Math.max(MIN_WPM, Number.isFinite(wpm) ? wpm : DEFAULT_WPM))

  const hasRealPageCount =
    typeof pageCount === 'number' && Number.isFinite(pageCount) && pageCount > 0

  // Personalized minutes from real pageCount + chosen WPM.
  const personalizedMinutes = hasRealPageCount
    ? Math.max(1, Math.round((pageCount as number) * (DEFAULT_WPM / safeWpm)))
    : null

  // Default (250 wpm) baseline — for the comparison line.
  const defaultMinutes = hasRealPageCount
    ? Math.max(1, Math.round((pageCount as number) * (DEFAULT_WPM / DEFAULT_WPM)))
    : null

  // Pomodoro-style sessions (25 min each), same logic as getReadingSessions.
  const sessions =
    personalizedMinutes != null && personalizedMinutes > 0
      ? Math.max(1, Math.round(personalizedMinutes / 25))
      : null
  const minutesPerSession =
    personalizedMinutes != null && sessions
      ? Math.round(personalizedMinutes / sessions)
      : null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[65] bg-slate-900/40 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Centered modal */}
          <div className="fixed inset-0 z-[66] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="pace-calculator-title"
              className="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-transparent px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <Gauge className="size-5" strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0">
                    <h2
                      id="pace-calculator-title"
                      className="text-base font-semibold text-slate-900"
                    >
                      Your reading pace
                    </h2>
                    <p
                      className="truncate text-xs text-slate-500"
                      title={title}
                    >
                      For {title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close reading pace calculator"
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-5">
                {/* Slider + live value */}
                <div className="mb-2 flex items-baseline justify-between">
                  <label
                    htmlFor="pace-wpm-slider"
                    className="text-sm font-medium text-slate-700"
                  >
                    Reading speed
                  </label>
                  <span className="text-sm font-bold tabular-nums text-blue-700">
                    {safeWpm}{' '}
                    <span className="text-xs font-medium text-slate-500">
                      wpm
                    </span>
                  </span>
                </div>
                <Slider
                  id="pace-wpm-slider"
                  min={MIN_WPM}
                  max={MAX_WPM}
                  step={WPM_STEP}
                  value={[safeWpm]}
                  onValueChange={(v) => {
                    const next = Array.isArray(v) ? v[0] : v
                    if (typeof next === 'number' && Number.isFinite(next)) {
                      setWpm(next)
                    }
                  }}
                  className="[&_[data-slot=slider-track]]:bg-slate-200 [&_[data-slot=slider-range]]:bg-blue-600 [&_[data-slot=slider-thumb]]:border-blue-600 [&_[data-slot=slider-thumb]]:bg-white"
                  aria-label="Reading speed in words per minute"
                />
                <div className="mt-1 flex justify-between text-[10px] text-slate-400 tabular-nums">
                  <span>{MIN_WPM} wpm</span>
                  <span>{MAX_WPM} wpm</span>
                </div>

                {/* Presets */}
                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Quick presets
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((preset) => {
                      const active = preset.wpm === safeWpm
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setWpm(preset.wpm)}
                          className={cn(
                            'trueread-focus inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-all active:scale-95',
                            active
                              ? 'bg-blue-600 text-white ring-blue-600'
                              : 'bg-white text-slate-600 ring-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-200',
                          )}
                          aria-pressed={active}
                          aria-label={`Set reading speed to ${preset.label} (${preset.wpm} wpm)`}
                        >
                          {preset.label}
                          <span className="tabular-nums opacity-70">
                            ({preset.wpm})
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Result */}
                <div className="mt-5 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
                  {hasRealPageCount && personalizedMinutes != null ? (
                    <>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Your personalized read time
                      </p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
                        {formatMinutes(personalizedMinutes)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Based on{' '}
                        <span className="font-medium text-slate-700 tabular-nums">
                          {pageCount}
                        </span>{' '}
                        real pages at your{' '}
                        <span className="font-medium text-blue-700 tabular-nums">
                          {safeWpm} wpm
                        </span>
                        .
                      </p>

                      {/* Sessions line */}
                      {sessions != null && minutesPerSession != null && (
                        <p className="mt-2 text-xs text-slate-500">
                          ≈{' '}
                          <span className="font-medium tabular-nums text-slate-700">
                            {sessions}
                          </span>{' '}
                          {sessions === 1 ? 'session' : 'sessions'} of ~
                          <span className="font-medium tabular-nums text-slate-700">
                            {minutesPerSession} min
                          </span>
                          .
                        </p>
                      )}

                      {/* Comparison vs default */}
                      {defaultMinutes != null &&
                        defaultMinutes !== personalizedMinutes && (
                          <p className="mt-2 border-t border-slate-200 pt-2 text-xs text-slate-500">
                            Default pace ({DEFAULT_WPM} wpm):{' '}
                            <span className="font-medium tabular-nums text-slate-700">
                              ~{formatMinutes(defaultMinutes)}
                            </span>
                          </p>
                        )}
                    </>
                  ) : (
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-white text-blue-500 shadow-sm">
                        <Gauge className="size-3.5" strokeWidth={2.25} />
                      </span>
                      <p className="text-sm text-slate-600">
                        No page count available for this book — try another
                        title from Google Books for a personalized estimate.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3">
                <p className="flex flex-wrap items-center justify-center gap-1.5 text-center text-xs text-slate-400">
                  <span>Your pace is saved on this device.</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Press{' '}
                    <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[9px] font-semibold text-slate-500">
                      Esc
                    </kbd>{' '}
                    to close
                  </span>
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default PaceCalculator
