/**
 * themes-analyzer.ts — pure text-mining helpers for the "Themes & keywords"
 * section in the detail view.
 *
 * Real data, local computation only — no AI call, no fabrication. The themes
 * are simply the most frequent meaningful words extracted from the book's
 * real description / preview snippet.
 *
 * The output is rendered as clickable chips that trigger a search for that
 * word (treating it as a topic the reader is interested in).
 */

export interface Theme {
  /** Lowercased word. */
  word: string
  /** Number of occurrences in the source text. */
  count: number
}

/**
 * Built-in English stopword set — common words that don't carry topical
 * meaning (articles, conjunctions, prepositions, pronouns, modal verbs,
 * common adverbs). Extended with words that frequently appear in book
 * descriptions without topical weight ("book", "author", "story", etc.).
 */
const STOPWORDS = new Set<string>([
  // articles
  'the', 'a', 'an',
  // conjunctions
  'and', 'or', 'but', 'if', 'then', 'else', 'when', 'while', 'although',
  'though', 'because', 'since', 'unless', 'until', 'whereas',
  // prepositions
  'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'out',
  'off', 'over', 'under', 'again', 'further', 'once', 'here', 'there',
  'upon', 'within', 'without', 'toward', 'towards', 'among', 'across',
  // pronouns
  'this', 'that', 'these', 'those', 'they', 'them', 'their', 'theirs',
  'we', 'us', 'our', 'ours', 'you', 'your', 'yours', 'he', 'him', 'his',
  'she', 'her', 'hers', 'it', 'its', 'who', 'whom', 'whose', 'which', 'what',
  // auxiliaries / modals
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'having', 'do', 'does', 'did', 'doing', 'will', 'would', 'shall', 'should',
  'can', 'could', 'may', 'might', 'must', 'ought',
  // common adverbs / fillers
  'not', 'no', 'nor', 'too', 'very', 'just', 'only', 'also', 'than', 'so',
  'such', 'more', 'most', 'some', 'any', 'all', 'both', 'each', 'few',
  'other', 'others', 'same', 'own',
  // book-description meta words
  'book', 'books', 'author', 'authors', 'reader', 'readers', 'read', 'reading',
  'story', 'stories', 'novel', 'novels', 'chapter', 'chapters', 'page', 'pages',
  'edition', 'published', 'publishing', 'publisher', 'copyright', 'edition',
  'first', 'second', 'third', 'last', 'next', 'one', 'two', 'three',
  'new', 'old', 'good', 'great', 'best', 'every', 'many', 'much',
  // common verbs that bleed through
  'make', 'makes', 'made', 'making', 'get', 'gets', 'got', 'getting',
  'go', 'goes', 'went', 'going', 'come', 'comes', 'came', 'coming',
  'take', 'takes', 'took', 'taken', 'taking', 'find', 'finds', 'found',
  'finding', 'give', 'gives', 'gave', 'given', 'giving', 'know', 'knows',
  'knew', 'known', 'knowing', 'think', 'thinks', 'thought', 'thinking',
  'want', 'wants', 'wanted', 'wanting', 'like', 'likes', 'liked', 'liking',
  'become', 'becomes', 'became', 'becoming',
])

/**
 * Tokenize a chunk of text into candidate theme words.
 *
 * - Lowercases everything.
 * - Splits on any non-letter character (Unicode-aware: \p{L}).
 * - Keeps only words of length >= 4 (filters out tiny filler words like
 *   "and" / "the" / "of" even if they slipped past the stopword list).
 */
function tokenize(text: string): string[] {
  if (!text) return []
  const lower = text.toLowerCase()
  // \p{L} = any Unicode letter; the 'u' flag enables Unicode property escapes.
  const parts = lower.split(/[^\p{L}]+/u)
  return parts.filter((w) => w.length >= 4)
}

/**
 * Extract the most frequent meaningful words from `text`.
 *
 * - Tokenizes + filters stopwords + dedupes.
 * - Counts frequency, sorts descending by count (then alphabetically).
 * - Filters out words that appear only once (a "theme" should repeat).
 * - Returns at most `max` themes.
 * - Returns `[]` if fewer than 3 distinct repeating themes are found (so the
 *   component can hide itself gracefully for short / no descriptions).
 */
export function extractThemes(text: string, max = 8): Theme[] {
  if (!text || text.trim().length === 0) return []
  const tokens = tokenize(text)
  if (tokens.length === 0) return []

  const counts = new Map<string, number>()
  for (const tok of tokens) {
    if (STOPWORDS.has(tok)) continue
    counts.set(tok, (counts.get(tok) ?? 0) + 1)
  }

  // A theme must appear at least twice — single-occurrence words aren't
  // strong enough signals.
  const candidates: Theme[] = []
  for (const [word, count] of counts) {
    if (count >= 2) {
      candidates.push({ word, count })
    }
  }

  // Sort by count desc, then alphabetically for stable ordering.
  candidates.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return a.word < b.word ? -1 : a.word > b.word ? 1 : 0
  })

  // If fewer than 3 distinct repeating themes, hide the section entirely.
  if (candidates.length < 3) return []

  return candidates.slice(0, max)
}
