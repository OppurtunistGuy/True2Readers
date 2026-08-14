import type { Book } from '@/components/trueread/types'

export interface Breakdown {
  pacing: { label: string; level: number }
  tone: { label: string; level: number }
  dialogue: { label: string; level: number }
}

const PACING_LABELS = ['Slow', 'Steady', 'Medium', 'Brisk', 'Fast'] as const
const TONE_LABELS = [
  'Contemplative',
  'Thoughtful',
  'Motivational',
  'Light-hearted',
  'Serious',
  'Dark',
] as const
const DIALOGUE_LABELS = [
  'Sparse',
  'Low',
  'Medium-Low',
  'Medium',
  'High',
] as const

// Curated level mapping for tone (1..5)
const TONE_LEVELS: Record<number, number> = {
  0: 2, // Contemplative
  1: 3, // Thoughtful
  2: 4, // Motivational
  3: 4, // Light-hearted
  4: 4, // Serious
  5: 5, // Dark
}

/**
 * Hash a book id to a stable unsigned integer.
 *
 * Uses a simple char-code sum + FNV-style multiplier so that similar ids
 * produce well-distributed values. Returns the same value for the same id
 * every render (deterministic).
 */
function hashId(id: string): number {
  let h = 2166136261 // FNV offset basis (32-bit)
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    // FNV prime (32-bit): 16777619
    // Use Math.imul to keep within 32-bit signed int range
    h = Math.imul(h, 16777619)
  }
  // Force unsigned and positive
  return h >>> 0
}

/**
 * Deterministic mock "AI-style breakdown" for a book.
 *
 * Hashes `book.id` to pick pacing/tone/dialogue values. The same book.id
 * always yields the same breakdown. This is NOT a real AI call — it's a
 * stand-in so the UI has stable, varied mock data.
 */
export function getBreakdown(book: Book): Breakdown {
  const h = hashId(book.id || book.title || 'unknown')

  const pacingIdx = h % PACING_LABELS.length // 0..4
  const toneIdx = (h >>> 3) % TONE_LABELS.length // 0..5
  const dialogueIdx = (h >>> 6) % DIALOGUE_LABELS.length // 0..4

  return {
    pacing: {
      label: PACING_LABELS[pacingIdx],
      level: pacingIdx + 1, // 1..5
    },
    tone: {
      label: TONE_LABELS[toneIdx],
      level: TONE_LEVELS[toneIdx] ?? 3,
    },
    dialogue: {
      label: DIALOGUE_LABELS[dialogueIdx],
      level: dialogueIdx + 1, // 1..5
    },
  }
}
