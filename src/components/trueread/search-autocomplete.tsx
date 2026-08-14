'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Clock3,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/** Curated popular queries — shown when the input is empty or focused. */
const POPULAR_QUERIES = [
  { text: 'Atomic Habits', type: 'title' as const },
  { text: 'The Alchemist', type: 'title' as const },
  { text: 'Sapiens', type: 'title' as const },
  { text: 'Dune', type: 'title' as const },
  { text: '1984', type: 'title' as const },
  { text: 'Fantasy', type: 'genre' as const },
  { text: 'Self-Help', type: 'genre' as const },
  { text: 'Science Fiction', type: 'genre' as const },
  { text: 'Mystery', type: 'genre' as const },
  { text: 'Biography', type: 'genre' as const },
  { text: 'Psychology', type: 'genre' as const },
  { text: 'Historical Fiction', type: 'genre' as const },
]

export interface SearchAutocompleteProps {
  /** Current search input value. */
  value: string
  /** Recent searches (most-recent-first). */
  recentSearches: string[]
  /** Called when the user selects a suggestion. */
  onSelect: (query: string) => void
  /** Whether the dropdown is visible (controlled by parent focus state). */
  isOpen: boolean
  /** Close the dropdown. */
  onClose: () => void
  className?: string
}

type SuggestionType = 'popular-title' | 'popular-genre' | 'recent' | 'match'

interface Suggestion {
  text: string
  type: SuggestionType
}

/**
 * Filter popular queries by the current input text (prefix match).
 */
function filterSuggestions(
  value: string,
  recentSearches: string[],
): Suggestion[] {
  const trimmed = value.trim().toLowerCase()
  const results: Suggestion[] = []

  // Recent searches first (if they match the prefix)
  if (recentSearches.length > 0) {
    for (const q of recentSearches) {
      if (trimmed.length === 0 || q.toLowerCase().startsWith(trimmed)) {
        results.push({ text: q, type: 'recent' })
      }
    }
  }

  // Popular queries that match
  for (const pq of POPULAR_QUERIES) {
    // Skip if already in recent searches
    if (recentSearches.some((r) => r.toLowerCase() === pq.text.toLowerCase())) continue
    if (trimmed.length === 0 || pq.text.toLowerCase().startsWith(trimmed)) {
      results.push({
        text: pq.text,
        type: pq.type === 'title' ? 'popular-title' : 'popular-genre',
      })
    }
  }

  // If user typed something and we have no matches from popular/recent,
  // offer the raw input as a "search for..." option
  if (trimmed.length > 0 && results.length === 0) {
    results.push({ text: value.trim(), type: 'match' })
  }

  return results.slice(0, 8)
}

const TYPE_ICON: Record<SuggestionType, React.ReactNode> = {
  'popular-title': <BookOpen className="size-3.5 text-blue-500" strokeWidth={2} />,
  'popular-genre': <TrendingUp className="size-3.5 text-slate-400" strokeWidth={2} />,
  recent: <Clock3 className="size-3.5 text-slate-400" strokeWidth={2} />,
  match: <Search className="size-3.5 text-blue-500" strokeWidth={2} />,
}

const TYPE_LABEL: Record<SuggestionType, string> = {
  'popular-title': 'Title',
  'popular-genre': 'Genre',
  recent: 'Recent',
  match: 'Search',
}

/**
 * Autocomplete dropdown for the search bar.
 * Shows filtered popular queries + recent searches.
 */
export function SearchAutocomplete({
  value,
  recentSearches,
  onSelect,
  isOpen,
  onClose,
  className,
}: SearchAutocompleteProps) {
  const [activeIndex, setActiveIndex] = React.useState(-1)
  const listRef = React.useRef<HTMLUListElement>(null)

  const suggestions = React.useMemo(
    () => filterSuggestions(value, recentSearches),
    [value, recentSearches],
  )

  // Reset active index when suggestions change
  React.useEffect(() => {
    setActiveIndex(-1)
  }, [suggestions])

  // Keyboard navigation within the dropdown
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || suggestions.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, -1))
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault()
        onSelect(suggestions[activeIndex].text)
        onClose()
      } else if (e.key === 'Escape') {
        onClose()
      }
    },
    [isOpen, suggestions, activeIndex, onSelect, onClose],
  )

  // Expose the keydown handler to the parent
  React.useImperativeHandle(
    listRef,
    () => {
      // This ref is used for scrolling the active item into view
      return listRef.current!
    },
    [],
  )

  if (!isOpen || suggestions.length === 0) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xl ring-1 ring-slate-200/50',
            className,
          )}
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2">
            <Sparkles className="size-3.5 text-blue-500" strokeWidth={2} />
            <span className="text-xs font-medium text-slate-500">
              {value.trim() ? 'Suggestions' : 'Popular searches'}
            </span>
          </div>

          {/* Suggestions list */}
          <ul ref={listRef} className="max-h-72 overflow-y-auto py-1" role="listbox">
            {suggestions.map((s, i) => (
              <li
                key={`${s.type}-${s.text}`}
                role="option"
                aria-selected={i === activeIndex}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelect(s.text)
                    onClose()
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    i === activeIndex
                      ? 'bg-blue-50/70 text-blue-900'
                      : 'text-slate-700 hover:bg-slate-50',
                  )}
                >
                  <span className="shrink-0">{TYPE_ICON[s.type]}</span>
                  <span className="flex-1 truncate text-sm font-medium">
                    {s.text}
                  </span>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    {TYPE_LABEL[s.type]}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {/* Footer hint */}
          <div className="border-t border-slate-100 px-4 py-2">
            <p className="text-[10px] text-slate-400">
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[9px] font-medium">
                ↑↓
              </kbd>{' '}
              navigate{' '}
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[9px] font-medium">
                ↵
              </kbd>{' '}
              select{' '}
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1 py-0.5 text-[9px] font-medium">
                esc
              </kbd>{' '}
              close
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SearchAutocomplete
