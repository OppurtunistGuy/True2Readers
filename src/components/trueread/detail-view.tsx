'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Bookmark,
  Clock,
  ExternalLink,
  Gauge,
  Info,
  Link2,
  Quote,
  Share2,
  Sparkles,
  Check,
  BookOpen,
  User,
  Search,
  ChevronDown,
  ChevronUp,
  Globe,
} from 'lucide-react'
import type { Book, BookSource } from '@/components/trueread/types'
import { Button } from '@/components/ui/button'
import { CoverImage } from './cover-image'
import { AiBreakdown } from './ai-breakdown'
import { SearchBar } from './search-bar'
import { StarRating } from './star-rating'
import { BookmarkButton } from './reading-list'
import { AuthorLinks } from './author-links'
import { getBreakdown } from './mock-ai'
import { estimateReadingTime, getReaderFit } from './reading-insights'
import { cn } from '@/lib/utils'

export interface DetailViewProps {
  book: Book
  source?: BookSource
  /** Label for the back button — "Back to results" (came from grid) or "Back to home" (title search). */
  backLabel?: string
  onBack?: () => void
  onSearch: (q: string) => void
  /** Whether this book is in the reading list. */
  isBookmarked?: boolean
  /** Toggle bookmark. */
  onToggleBookmark?: (book: Book) => void
}

/**
 * Render a Google Books preview snippet that may contain <em>...</em>
 * highlight tags — without dangerouslySetInnerHTML.
 *
 * Splits on `<em>` / `</em>` and wraps the highlighted spans in a
 * safe <mark> element.
 */
function renderSnippet(snippet: string): React.ReactNode {
  const parts = snippet.split(/(<\/?em>)/)
  const nodes: React.ReactNode[] = []
  let highlight = false
  let key = 0
  for (const part of parts) {
    if (part === '<em>') {
      highlight = true
    } else if (part === '</em>') {
      highlight = false
    } else if (part.length > 0) {
      if (highlight) {
        nodes.push(
          <mark key={key++} className="rounded bg-blue-100 px-0.5 text-blue-900">
            {part}
          </mark>,
        )
      } else {
        nodes.push(<React.Fragment key={key++}>{part}</React.Fragment>)
      }
    }
  }
  return nodes
}

const VIBE_ICON: Record<string, React.ReactNode> = {
  light: <Sparkles className="size-3.5" strokeWidth={2.25} />,
  steady: <Gauge className="size-3.5" strokeWidth={2.25} />,
  deep: <Bookmark className="size-3.5" strokeWidth={2.25} />,
  epic: <Bookmark className="size-3.5" strokeWidth={2.25} />,
}

/**
 * Book detail view. Large white card with a responsive 3-column layout:
 * cover | meta+preview | AI breakdown. Collapses to stacked on mobile.
 */
export function DetailView({
  book,
  source = 'google',
  backLabel = 'Back to results',
  onBack,
  onSearch,
  isBookmarked = false,
  onToggleBookmark,
}: DetailViewProps) {
  const [searchValue, setSearchValue] = React.useState('')
  const [showFullDesc, setShowFullDesc] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const sourceLabel = source === 'apple' ? 'Apple Books' : 'Google Books'

  const authorsText =
    book.authors.length > 0 ? book.authors.join(', ') : 'Unknown author'

  const hasPreview =
    typeof book.previewSnippet === 'string' && book.previewSnippet.length > 0
  const hasDescription =
    typeof book.description === 'string' && book.description.length > 0

  // Show the "About this book" block only when there's a real description
  // AND it adds something beyond the preview snippet (avoid duplication).
  const showAboutBlock = hasDescription && !hasPreview

  // Reading insights — derived from real pageCount + the deterministic mock
  // breakdown. Both are memoized so they're stable across renders.
  const breakdown = React.useMemo(() => getBreakdown(book), [book])
  const readingTime = React.useMemo(
    () => estimateReadingTime(book.pageCount),
    [book.pageCount],
  )
  const readerFit = React.useMemo(
    () => getReaderFit(book, breakdown),
    [book, breakdown],
  )

  const handleCategoryClick = (cat: string) => {
    onSearch(cat)
  }

  // Share: copy a shareable text to clipboard
  const handleShare = React.useCallback(async () => {
    const text = `${book.title} by ${authorsText}${book.year ? ` (${book.year})` : ''} — Found via TrueRead`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available — no-op
    }
  }, [book.title, authorsText, book.year])

  // Unique categories for the explore section (deduped, limited)
  const exploreCategories = React.useMemo(() => {
    if (!book.categories || book.categories.length === 0) return []
    return [...new Set(book.categories)].slice(0, 4)
  }, [book.categories])

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:py-10">
      {/* Compact header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="h-10 w-fit gap-2 px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </Button>

        <SearchBar
          value={searchValue}
          onChange={setSearchValue}
          onSubmit={onSearch}
          variant="compact"
          placeholder="Search again…"
          className="sm:w-80 md:w-96"
        />
      </div>

      {/* Main detail card */}
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 rounded-2xl bg-white p-6 trueread-shadow-soft ring-1 ring-slate-200/70 md:p-10"
      >
        {source === 'apple' && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-slate-600">
            <Info className="mt-0.5 size-4 shrink-0 text-blue-600" />
            <p>
              <span className="font-medium text-slate-800">
                Google Books is temporarily unavailable
              </span>{' '}
              from this environment. Showing real metadata from{' '}
              <span className="font-medium text-blue-700">Apple Books</span> —
              no preview text is available for this book.
            </p>
          </div>
        )}
        <div className="grid gap-8 md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr_300px]">
          {/* Left: cover */}
          <div className="mx-auto w-44 md:mx-0 md:w-full">
            <div className="relative">
              <CoverImage
                book={book}
                sizes="(max-width: 768px) 176px, 220px"
                className="w-full"
              />
              {/* Bookmark button on cover */}
              {onToggleBookmark && (
                <div className="absolute right-2 top-2">
                  <BookmarkButton
                    isBookmarked={isBookmarked}
                    onClick={() => onToggleBookmark(book)}
                    size="md"
                    className="shadow-md backdrop-blur-sm"
                  />
                </div>
              )}
            </div>
            {/* Star rating below cover */}
            <div className="mt-3 flex flex-col items-center gap-1">
              <StarRating
                rating={book.rating}
                size="lg"
                showValue
                label={source === 'apple' ? 'Apple' : 'Google'}
              />
            </div>
          </div>

          {/* Middle: meta + preview */}
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
              {book.title}
            </h1>

            {/* Author links — clickable for search */}
            <AuthorLinks book={book} onSearch={onSearch} />

            {/* Meta row */}
            <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              {book.year && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" strokeWidth={2} />
                  {book.year}
                </span>
              )}
              {book.year && book.publisher && (
                <span aria-hidden="true">•</span>
              )}
              {book.publisher && <span>{book.publisher}</span>}
              {(book.year || book.publisher) && book.pageCount != null && (
                <span aria-hidden="true">•</span>
              )}
              {book.pageCount != null && book.pageCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="size-3" strokeWidth={2} />
                  {book.pageCount} pages
                </span>
              )}
            </div>

            {/* Insight chips — reading time (real) + reader fit (mock). */}
            {(readingTime || readerFit) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {readingTime && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100">
                    <Clock className="size-3.5" strokeWidth={2.25} />
                    {readingTime.label}
                  </span>
                )}
                {readerFit && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
                    title="Mock suggestion — not a real recommendation engine"
                  >
                    {VIBE_ICON[readerFit.vibe]}
                    {readerFit.label}
                    <span className="ml-0.5 rounded bg-slate-200 px-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                      mock
                    </span>
                  </span>
                )}
                {/* Share button chip */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:text-slate-800 active:scale-95"
                  aria-label="Share this book"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-green-600" strokeWidth={2.25} />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="size-3.5" strokeWidth={2.25} />
                      Share
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Category badges — clickable to trigger a genre search */}
            {book.categories && book.categories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {book.categories.slice(0, 6).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition-all hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-95"
                    aria-label={`Search more books in ${cat}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            <hr className="my-6 border-slate-200" />

            {/* Preview section */}
            <section aria-labelledby="preview-heading">
              <h2
                id="preview-heading"
                className="flex items-center gap-2 text-sm font-semibold text-blue-600"
              >
                <Quote className="size-4" strokeWidth={2.25} />
                {source === 'google' ? 'Preview (from Google Books)' : 'Preview'}
              </h2>

              {hasPreview ? (
                <p className="trueread-dropcap mt-3 text-base leading-relaxed text-slate-600">
                  {renderSnippet(book.previewSnippet!)}
                </p>
              ) : (
                <div className="mt-3 flex items-start gap-3 rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200/70">
                  <Info className="mt-0.5 size-5 shrink-0 text-slate-400" />
                  <p className="text-sm text-slate-500">
                    No preview available for this book.
                  </p>
                </div>
              )}

              {/* Source attribution */}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Globe className="size-3" strokeWidth={2} />
                  Source: {sourceLabel}
                </span>
                {book.previewLink && (
                  <a
                    href={book.previewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                  >
                    Open in {sourceLabel}
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            </section>

            {/* Optional About block — only shown when there's no preview */}
            {showAboutBlock && (
              <section
                aria-labelledby="about-heading"
                className="mt-8 border-t border-slate-200 pt-6"
              >
                <h2
                  id="about-heading"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-900"
                >
                  <BookOpen className="size-4 text-blue-600" strokeWidth={2.25} />
                  About this book
                </h2>
                <p
                  className={cn(
                    'trueread-dropcap mt-3 text-sm leading-relaxed text-slate-600',
                    !showFullDesc && 'line-clamp-4',
                  )}
                >
                  {book.description}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  {book.description && book.description.length > 280 && (
                    <button
                      type="button"
                      onClick={() => setShowFullDesc((v) => !v)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                    >
                      {showFullDesc ? (
                        <>
                          <ChevronUp className="size-3" strokeWidth={2.5} />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="size-3" strokeWidth={2.5} />
                          Show more
                        </>
                      )}
                    </button>
                  )}
                </div>
              </section>
            )}

            {/* Explore related genres */}
            {exploreCategories.length > 0 && (
              <section
                aria-label="Explore related topics"
                className="mt-8 border-t border-slate-200 pt-6"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Sparkles className="size-3.5" strokeWidth={2.25} />
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Explore related
                  </h3>
                </div>
                <div className="flex flex-col gap-1.5">
                  {exploreCategories.map((cat, i) => (
                    <motion.button
                      key={cat}
                      type="button"
                      onClick={() => onSearch(cat)}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                      className="group/rel flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all hover:bg-blue-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-[0.98]"
                      aria-label={`Search books in ${cat}`}
                    >
                      <Search className="size-3.5 text-slate-300 transition-colors group-hover/rel:text-blue-400" strokeWidth={2.5} />
                      <span className="flex-1 text-sm font-medium text-slate-600 transition-colors group-hover/rel:text-blue-700">
                        {cat}
                      </span>
                      <ArrowLeft className="size-3 rotate-180 text-slate-300 transition-colors group-hover/rel:text-blue-400" strokeWidth={2.5} />
                    </motion.button>
                  ))}
                </div>
              </section>
            )}

            {/* AI breakdown — visible inline below the middle column on md.
                On lg+ the grid places it in the right column instead. */}
            <div className="mt-8 lg:hidden">
              <AiBreakdown book={book} />
            </div>
          </div>

          {/* Right: AI breakdown (lg+ only) */}
          <aside className="hidden lg:block">
            <AiBreakdown book={book} />
          </aside>
        </div>
      </motion.article>
    </div>
  )
}

export default DetailView
