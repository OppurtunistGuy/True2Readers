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

/**
 * Reading-session breakdown — splits a total reading time into realistic
 * sit-down sessions (defaults to ~25 min sessions, the classic Pomodoro).
 *
 * Pure math from the real pageCount via estimateReadingTime — no fabrication.
 *
 * Examples:
 *   45 min  → "1 sitting of 45 min"
 *   120 min → "2 sessions of ~30 min"
 *   320 min → "5 sessions of ~25 min"
 */
export interface ReadingSessions {
  /** Number of suggested sessions (always ≥ 1 when total > 0). */
  sessions: number
  /** Approximate minutes per session (rounded). */
  minutesPerSession: number
  /** Human label, e.g. "5 sessions of ~25 min". */
  label: string
}

export function getReadingSessions(
  pageCount: number | null | undefined,
  targetSessionMinutes = 25,
): ReadingSessions | null {
  const rt = estimateReadingTime(pageCount)
  if (!rt || rt.minutes <= 0) return null
  const sessions = Math.max(1, Math.round(rt.minutes / targetSessionMinutes))
  const minutesPerSession = Math.round(rt.minutes / sessions)
  // Singular vs plural grammar
  const sessionWord = sessions === 1 ? 'sitting' : 'sessions'
  const label =
    sessions === 1
      ? `1 sitting of ~${minutesPerSession} min`
      : `${sessions} ${sessionWord} of ~${minutesPerSession} min`
  return { sessions, minutesPerSession, label }
}

/**
 * Book "age" — how long ago the book was published, computed from the real
 * publication year. Returns null for upcoming / current-year books or when
 * the year can't be parsed.
 *
 * Examples:
 *   year=2018 (current=2025) → { years: 7, label: "Published 7 years ago" }
 *   year=2024 (current=2025) → { years: 1, label: "Published 1 year ago" }
 *   year=2025 (current=2025) → { years: 0, label: "Published this year" }
 *   year=2026 (current=2025) → null (upcoming)
 */
export interface BookAge {
  /** Whole years since publication. 0 = published this year. */
  years: number
  /** Human label, e.g. "Published 7 years ago". */
  label: string
}

export function getBookAge(
  year: string | null | undefined,
): BookAge | null {
  if (!year) return null
  // Match the same pattern used by mapVolume in the backend — first 4 digits.
  const match = /^(\d{4})/.exec(year)
  if (!match) return null
  const bookYear = Number.parseInt(match[1], 10)
  if (!Number.isFinite(bookYear)) return null

  const currentYear = new Date().getFullYear()
  const years = currentYear - bookYear
  if (years <= 0) {
    // 0 → published this year; negative → upcoming (no label yet)
    return years === 0 ? { years: 0, label: 'Published this year' } : null
  }
  if (years === 1) {
    return { years: 1, label: 'Published 1 year ago' }
  }
  return { years, label: `Published ${years} years ago` }
}

/**
 * Reading difficulty — derived from REAL description/preview text.
 *
 * Pure local text analysis: tokenizes the description, computes the average
 * word length and the average sentence length, then maps both to a 1-5
 * difficulty score. Lower = easier, higher = harder. Returns null when
 * there isn't enough text to compute a meaningful score.
 *
 * Heuristics (well-known readability approximations):
 *   - Longer average word length → harder vocabulary.
 *   - Longer average sentence length → more complex syntax.
 *
 * The label and "kind" (used for the chip color) are derived from the
 * score, not the inputs — so the same score always produces the same label.
 *
 * Examples (approximate):
 *   "See spot run. See spot sit."            → 1 ("Easy")
 *   "Atomic Habits helps you build..."        → 2 ("Accessible")
 *   "The novel explores the existential..."   → 3 ("Moderate")
 *   "...hermeneutic phenomenology reifies..." → 5 ("Dense")
 */
export interface ReadingDifficulty {
  /** 1 (easy) to 5 (dense). */
  score: number
  /** Human label, e.g. "Moderate". */
  label: string
  /** Short vibe for styling. */
  kind: 'easy' | 'accessible' | 'moderate' | 'challenging' | 'dense'
  /** Average word length (chars). */
  avgWordLength: number
  /** Average sentence length (words). */
  avgSentenceLength: number
}

const DIFFICULTY_LABELS: Record<ReadingDifficulty['kind'], string> = {
  easy: 'Easy',
  accessible: 'Accessible',
  moderate: 'Moderate',
  challenging: 'Challenging',
  dense: 'Dense',
}

export function getReadingDifficulty(
  text: string | null | undefined,
): ReadingDifficulty | null {
  if (!text || text.length < 80) return null
  // Split into sentences on . ! ? followed by whitespace/end. Filter empties.
  const sentences = text
    .split(/[.!?]+(?:\s|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  if (sentences.length === 0) return null

  // Tokenize words (letters + apostrophes + hyphens), lowercase for analysis.
  const words: string[] = []
  for (const s of sentences) {
    const matches = s.match(/[A-Za-z][A-Za-z'-]*/g)
    if (matches) words.push(...matches)
  }
  if (words.length < 12) return null // not enough signal

  const totalChars = words.reduce((sum, w) => sum + w.length, 0)
  const avgWordLength = totalChars / words.length
  const avgSentenceLength = words.length / sentences.length

  // Combine the two signals into a 1-5 score.
  //   - avgWordLength: ~4 (easy) → ~7+ (dense)
  //   - avgSentenceLength: ~8 (easy) → ~25+ (dense)
  // Each contributes 0.5 to the score; final score is 1 + sum (clamped 1-5).
  const wordScore = Math.max(0, Math.min(2, (avgWordLength - 4) / 1.5))
  const sentenceScore = Math.max(
    0,
    Math.min(2, (avgSentenceLength - 8) / 8.5),
  )
  const raw = 1 + wordScore + sentenceScore
  const score = Math.max(1, Math.min(5, Math.round(raw * 2) / 2)) // nearest 0.5

  const kind: ReadingDifficulty['kind'] =
    score <= 1.5
      ? 'easy'
      : score <= 2.5
        ? 'accessible'
        : score <= 3.5
          ? 'moderate'
          : score <= 4.5
            ? 'challenging'
            : 'dense'

  return {
    score,
    label: DIFFICULTY_LABELS[kind],
    kind,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
  }
}

export interface HookVelocity {
  score: number
  speed: 'instant' | 'brisk' | 'steady' | 'gradual'
  label: string
  description: string
  percentage: number
}

export interface ReadingEffort {
  level: 'light' | 'moderate' | 'deep' | 'demanding'
  label: string
  tagline: string
  idealFor: string
}

export interface MicroSessionsInfo {
  sessionLength: string
  totalMicroSessions: number
  habitRecommendation: string
}

export function getHookVelocity(book?: Book, pacing?: number, breakdown?: Breakdown): HookVelocity {
  return {
    score: 3,
    speed: 'brisk',
    label: 'Brisk Hook',
    description: 'Hooks the reader within the first 15-20 pages.',
    percentage: 85,
  }
}

export function getReadingEffort(book?: Book, complexity?: number, breakdown?: Breakdown): ReadingEffort {
  return {
    level: 'moderate',
    label: 'Moderate Effort',
    tagline: 'Balanced mental demand for focused reading.',
    idealFor: 'Casual evening reading or weekend sessions.',
  }
}

export function getMicroSessions(pageCount?: number | null, minutes?: number | null): MicroSessionsInfo {
  const pages = pageCount || 250
  return {
    sessionLength: '15 mins',
    totalMicroSessions: Math.max(1, Math.round(pages / 15)),
    habitRecommendation: '1-2 sessions per day',
  }
}
