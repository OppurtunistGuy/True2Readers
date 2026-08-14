import type { Book } from '@/components/trueread/types'
import type { Breakdown } from './mock-ai'

/**
 * Reading insights derived from REAL book metadata (pageCount) plus the
 * deterministic mock breakdown. Everything here is grounded in the book's
 * real data or clearly labeled mock — nothing is fabricated about the book
 * itself.
 */

export interface ReadingTime {
  /** Total estimated minutes (0 if unknown). */
  minutes: number
  /** Human label, e.g. "≈ 5h 20m", "≈ 45 min", "Quick read". */
  label: string
  /** Short category for styling. */
  kind: 'quick' | 'medium' | 'long' | 'epic'
}

/** Average adult reading speed (words per minute). */
const WPM = 250
/** Approximate words per page for a typical book. */
const WORDS_PER_PAGE = 250

/**
 * Estimate reading time from a real page count.
 * Returns null if pageCount is missing or non-positive.
 *
 * Formula: minutes = pageCount * (WORDS_PER_PAGE / WPM) = pageCount.
 * (Coincidentally ~1 min/page at 250 wpm & 250 wpp — kept explicit for clarity.)
 */
export function estimateReadingTime(
  pageCount: number | null | undefined,
): ReadingTime | null {
  if (pageCount == null || !Number.isFinite(pageCount) || pageCount <= 0) {
    return null
  }
  const minutes = Math.max(1, Math.round(pageCount * (WORDS_PER_PAGE / WPM)))

  let label: string
  let kind: ReadingTime['kind']
  if (minutes < 60) {
    label = `≈ ${minutes} min`
    kind = 'quick'
  } else {
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    label = m === 0 ? `≈ ${h}h` : `≈ ${h}h ${m}m`
    kind = minutes < 4 * 60 ? 'medium' : minutes < 8 * 60 ? 'long' : 'epic'
  }
  return { minutes, label, kind }
}

export interface ReaderFit {
  /** Short microcopy, e.g. "Weekend binge read". */
  label: string
  /** One-word intensity for icon choice. */
  vibe: 'light' | 'steady' | 'deep' | 'epic'
}

/**
 * Deterministic "reader fit" microcopy combining the (mock) breakdown with
 * the real page count. Same book → same label every render.
 *
 * This is a playful, clearly-mock suggestion — not a real recommendation
 * engine.
 */
export function getReaderFit(
  book: Book,
  breakdown: Breakdown,
): ReaderFit | null {
  const rt = estimateReadingTime(book.pageCount)
  const pacing = breakdown.pacing.label
  const minutes = rt?.minutes ?? 0

  // Short + brisk → quick hit
  if (minutes > 0 && minutes < 180 && (pacing === 'Brisk' || pacing === 'Fast')) {
    return { label: 'Quick weekend read', vibe: 'light' }
  }
  // Short + slow → palate cleanser
  if (minutes > 0 && minutes < 180 && pacing === 'Slow') {
    return { label: 'Short & thoughtful', vibe: 'light' }
  }
  // Very long → epic commitment
  if (minutes >= 480) {
    return { label: 'For dedicated readers', vibe: 'epic' }
  }
  // Long + steady → vacation read
  if (minutes >= 240 && (pacing === 'Steady' || pacing === 'Medium')) {
    return { label: 'Great vacation read', vibe: 'steady' }
  }
  // Motivational tone → daily habit
  if (breakdown.tone.label === 'Motivational') {
    return { label: 'Pairs well with daily habits', vibe: 'steady' }
  }
  // Dark tone + long → deep dive
  if (breakdown.tone.label === 'Dark' && minutes >= 240) {
    return { label: 'A deep, immersive dive', vibe: 'deep' }
  }
  // Default fallbacks by pacing
  if (pacing === 'Slow') return { label: 'Savour slowly', vibe: 'deep' }
  if (pacing === 'Fast') return { label: 'Fast-paced page-turner', vibe: 'light' }
  return { label: 'A solid pick', vibe: 'steady' }
}

/** Format an ISO-ish date string or year for display. */
export function formatPublished(year: string | null | undefined): string | null {
  if (!year) return null
  return year
}
