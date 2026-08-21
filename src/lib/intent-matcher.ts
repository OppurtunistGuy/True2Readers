import type { Book } from '@/components/trueread/types'
import {
  CURATED_READER_EXPERIENCES,
  type ReaderExperienceProfile,
} from './reader-experiences'

export interface UserReadingIntent {
  feel: string[] // 'fast_gripping', 'thought_provoking', 'emotional', 'immersive', 'relaxing'
  effort: 'low' | 'moderate' | 'deep' // 'low' = easy escape, 'moderate' = some focus, 'deep' = deep dive
  focus: string[] // 'story', 'characters', 'ideas', 'writing'
  genre?: string
}

export interface MatchedIntentBook {
  book: Book
  profile: ReaderExperienceProfile
  score: number
  whySurfaced: string
  readerSignal: string
  potentialMismatch: string
  tags: string[]
}

// Convert curated profile to standard True2Readers Book shape
export function profileToBook(p: ReaderExperienceProfile): Book {
  return {
    id: `curated-${p.bookKey}`,
    title: p.title,
    authors: [p.author],
    year: '2020',
    categories: [p.genre],
    isbn13: p.isbn13,
    isbn10: p.isbn10,
    description: p.consensus,
    overview: p.consensus,
    whyInterest: [p.whySurfaced, p.readerSignal],
    cover: undefined,
  }
}

/**
 * Score and rank curated books against user intent.
 */
export function matchBooksByIntent(
  intent: UserReadingIntent
): MatchedIntentBook[] {
  const { feel, effort, focus, genre } = intent

  const scored = CURATED_READER_EXPERIENCES.map((p) => {
    let score = 0

    // Match genre filter if present
    if (genre && genre !== 'all') {
      const gNorm = genre.toLowerCase()
      if (p.genre.toLowerCase().includes(gNorm) || p.tags.some((t) => t.toLowerCase().includes(gNorm))) {
        score += 15
      } else {
        score -= 5
      }
    }

    // Match Pace / Feel
    if (feel.includes('fast_gripping') && p.intentMatch.pace.includes('fast')) score += 10
    if (feel.includes('immersive') && p.intentMatch.pace.includes('slow_burn')) score += 10
    if (feel.includes('relaxing') && p.intentMatch.pace.includes('fast')) score += 8
    if (feel.includes('thought_provoking') && (p.intentMatch.pace.includes('steady') || p.intentMatch.pace.includes('slow_burn'))) score += 9
    if (feel.includes('emotional') && p.intentMatch.focus.includes('characters')) score += 10

    // Match Effort
    if (p.intentMatch.effort.includes(effort)) {
      score += 12
    }

    // Match Narrative Focus
    for (const f of focus) {
      if (p.intentMatch.focus.includes(f as any)) {
        score += 8
      }
    }

    return {
      book: profileToBook(p),
      profile: p,
      score,
      whySurfaced: p.whySurfaced,
      readerSignal: p.readerSignal,
      potentialMismatch: p.potentialMismatchCard,
      tags: p.tags,
    }
  })

  // Sort descending by match score and return top results (approx 10)
  return scored.sort((a, b) => b.score - a.score).slice(0, 10)
}
