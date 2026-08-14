'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Bookmark,
  Clock,
  ExternalLink,
  Gauge,
  Info,
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
  BookMarked,
  Calendar,
  FileText,
  Star,
  Maximize2,
  Minimize2,
  X,
  ZoomIn,
  Compass,
  Printer,
  Timer,
} from 'lucide-react'
import type { Book, BookSource } from '@/components/trueread/types'
import { Button } from '@/components/ui/button'
import { CoverImage } from './cover-image'
import { AiBreakdown } from './ai-breakdown'
import { SearchBar } from './search-bar'
import { StarRating } from './star-rating'
import { BookmarkButton } from './reading-list'
import { AuthorLinks } from './author-links'
import { CoverLightbox } from './cover-lightbox'
import { ScrollProgress } from './scroll-progress'
import { MoreFromAuthor } from './more-from-author'
import { getBreakdown } from './mock-ai'
import {
  estimateReadingTime,
  getReaderFit,
  getReadingSessions,
} from './reading-insights'
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
  /** Optional toast notifier (used for share feedback). */
  onToast?: (toast: { title: string; description?: string; duration?: number }) => void
  /** Navigate to detail for a different book (used by "More from this author"). */
  onSelectBook?: (book: Book) => void
}

/**
 * Render a Google Books preview snippet that may contain <em>...</em>
 * highlight tags — without dangerouslySetInnerHTML.
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

/** Collapsible categories — show first 3, with a "+N more" expand button. */
const INITIAL_CATEGORY_COUNT = 3

/**
 * Book detail view. Large white card with a responsive 3-column layout:
 * cover | meta+preview | AI breakdown. Collapses to stacked on mobile.
 *
 * Includes a "Reading mode" toggle that expands the description to a
 * distraction-free, larger-text reading view.
 */
export function DetailView({
  book,
  source = 'google',
  backLabel = 'Back to results',
  onBack,
  onSearch,
  isBookmarked = false,
  onToggleBookmark,
  onToast,
  onSelectBook,
}: DetailViewProps) {
  const [searchValue, setSearchValue] = React.useState('')
  const [showFullDesc, setShowFullDesc] = React.useState(false)
  const [showAllCategories, setShowAllCategories] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [readingMode, setReadingMode] = React.useState(false)
  const [coverLightboxOpen, setCoverLightboxOpen] = React.useState(false)

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

  // The text used in reading mode — prefer preview, fall back to description.
  const readingText = book.previewSnippet ?? book.description ?? null

  // Reading insights — derived from real pageCount + the deterministic mock
  // breakdown. Both are memoized so they're stable across renders.
  const breakdown = React.useMemo(() => getBreakdown(book), [book])
  const readingTime = React.useMemo(
    () => estimateReadingTime(book.pageCount),
    [book.pageCount],
  )
  const readingSessions = React.useMemo(
    () => getReadingSessions(book.pageCount),
    [book.pageCount],
  )
  const readerFit = React.useMemo(
    () => getReaderFit(book, breakdown),
    [book, breakdown],
  )

  // Print / Save as PDF — opens the browser's native print dialog. Combined
  // with the print CSS in globals.css this produces a clean, distraction-free
  // printable summary of the current book (cover + title + author + meta +
  // preview + breakdown). No new route, no server round-trip.
  const handlePrint = React.useCallback(() => {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print()
    } else {
      onToast?.({
        title: 'Printing not supported',
        description: 'Your browser does not support window.print().',
        duration: 3000,
      })
    }
  }, [onToast])

  const handleCategoryClick = (cat: string) => {
    onSearch(cat)
  }

  // Share: copy a shareable text to clipboard. Provides toast feedback on
  // success AND failure so the user is never left wondering if it worked.
  // Uses the async Clipboard API when available (HTTPS + user gesture). On
  // failure, surfaces the text in a toast so the user can read/copy it
  // manually — no intrusive window.prompt() dialogs.
  const handleShare = React.useCallback(async () => {
    const text = `${book.title} by ${authorsText}${book.year ? ` (${book.year})` : ''} — Found via TrueRead`
    let succeeded = false
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        succeeded = true
      }
    } catch {
      succeeded = false
    }
    if (succeeded) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      onToast?.({
        title: 'Copied to clipboard',
        description: 'Shareable book reference is on your clipboard.',
        duration: 2200,
      })
    } else {
      // Graceful fallback: surface the text in a toast so the user can
      // read it / manually select-and-copy from the notification.
      onToast?.({
        title: 'Couldn’t copy automatically',
        description: text,
        duration: 5000,
      })
    }
  }, [book.title, book.year, authorsText, onToast])

  // Unique categories for the explore section (deduped, limited)
  const exploreCategories = React.useMemo(() => {
    if (!book.categories || book.categories.length === 0) return []
    return [...new Set(book.categories)].slice(0, 4)
  }, [book.categories])

  // Visible categories (collapsible)
  const visibleCategories = React.useMemo(() => {
    if (!book.categories || book.categories.length === 0) return []
    return showAllCategories
      ? book.categories
      : book.categories.slice(0, INITIAL_CATEGORY_COUNT)
  }, [book.categories, showAllCategories])

  const hiddenCategoryCount = (book.categories?.length ?? 0) - INITIAL_CATEGORY_COUNT

  // Lock body scroll when reading mode is active
  React.useEffect(() => {
    if (readingMode) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [readingMode])

  // Keyboard shortcuts (detail view only):
  //   `b` → toggle bookmark (only when not typing in an input)
  //   `r` → toggle reading mode (only when not typing in an input)
  //   `p` → print / save as PDF (opens the browser's native print dialog)
  React.useEffect(() => {
    if (!onToggleBookmark && !readingText) return
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isTyping =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      if (isTyping || e.metaKey || e.ctrlKey || e.altKey) return

      // `b` toggles bookmark (only when a toggle handler is wired)
      if (e.key === 'b' && onToggleBookmark) {
        e.preventDefault()
        onToggleBookmark(book)
      }
      // `r` toggles reading mode (only when there's text to read)
      if (e.key === 'r' && readingText) {
        e.preventDefault()
        setReadingMode((v) => !v)
      }
      // `p` opens the browser print dialog (Save as PDF)
      if (e.key === 'p') {
        e.preventDefault()
        handlePrint()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [book, onToggleBookmark, readingText, handlePrint])

  // Escape interceptor — when an overlay (cover lightbox or reading mode) is
  // open, Escape should close ONLY the overlay, not navigate back. We use the
  // capture phase + stopImmediatePropagation so this runs BEFORE the page-level
  // Escape handler (which is registered in the bubble phase).
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (coverLightboxOpen) {
        e.stopImmediatePropagation()
        e.preventDefault()
        setCoverLightboxOpen(false)
      } else if (readingMode) {
        e.stopImmediatePropagation()
        e.preventDefault()
        setReadingMode(false)
      }
    }
    window.addEventListener('keydown', handler, { capture: true })
    return () => window.removeEventListener('keydown', handler, { capture: true })
  }, [coverLightboxOpen, readingMode])

  // The primary category — used for the "Find similar" CTA.
  const primaryCategory =
    book.categories && book.categories.length > 0 ? book.categories[0] : null

  // Build stats for the summary card
  const stats = React.useMemo(() => {
    const items: { icon: React.ReactNode; label: string; value: string }[] = []
    if (book.year) {
      items.push({
        icon: <Calendar className="size-3.5" strokeWidth={2.25} />,
        label: 'Published',
        value: book.year,
      })
    }
    if (book.publisher) {
      items.push({
        icon: <BookMarked className="size-3.5" strokeWidth={2.25} />,
        label: 'Publisher',
        value: book.publisher,
      })
    }
    if (book.pageCount != null && book.pageCount > 0) {
      items.push({
        icon: <FileText className="size-3.5" strokeWidth={2.25} />,
        label: 'Pages',
        value: String(book.pageCount),
      })
    }
    if (readingTime) {
      items.push({
        icon: <Clock className="size-3.5" strokeWidth={2.25} />,
        label: 'Read time',
        value: readingTime.label.replace('≈ ', ''),
      })
    }
    return items
  }, [book, readingTime])

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:py-10">
      {/* Scroll progress bar — slim indicator that fills as the user scrolls */}
      <ScrollProgress />

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
              <button
                type="button"
                onClick={() => setCoverLightboxOpen(true)}
                className="group/cover relative block w-full overflow-hidden rounded-xl transition-all hover:ring-2 hover:ring-blue-300/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                aria-label={`Zoom cover of ${book.title}`}
              >
                <CoverImage
                  book={book}
                  sizes="(max-width: 768px) 176px, 220px"
                  className="w-full transition-transform duration-300 group-hover/cover:scale-[1.02]"
                />
                {/* Zoom hint overlay — appears on hover */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/0 transition-colors duration-200 group-hover/cover:bg-slate-900/20">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 opacity-0 shadow-md backdrop-blur-sm transition-opacity duration-200 group-hover/cover:opacity-100">
                    <ZoomIn className="size-3.5" strokeWidth={2.25} />
                    Click to zoom
                  </span>
                </div>
              </button>
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

            {/* Stats summary card — below the rating. Hidden when fewer than
                2 facts are available (Apple Books fallback often has only
                `year` — a single-row card looks sparse). */}
            {stats.length >= 2 && (
              <div className="mt-4 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
                <h3 className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Quick Facts
                </h3>
                <dl className="flex flex-col gap-2">
                  {stats.map((stat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-white text-blue-500 shadow-sm">
                        {stat.icon}
                      </span>
                      <dt className="text-[11px] text-slate-500">{stat.label}</dt>
                      <dd className="ml-auto truncate text-xs font-medium text-slate-700" title={stat.value}>
                        {stat.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

          {/* Middle: meta + preview */}
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
              {book.title}
            </h1>

            {/* Author links — clickable for search */}
            <AuthorLinks book={book} onSearch={onSearch} />

            {/* Insight chips — reading time (real) + sessions (real math) + reader fit (mock). */}
            {(readingTime || readerFit) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {readingTime && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100">
                    <Clock className="size-3.5" strokeWidth={2.25} />
                    {readingTime.label}
                  </span>
                )}
                {readingSessions && readingSessions.sessions > 1 && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/60 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100/70"
                    title={`Based on ~${readingSessions.minutesPerSession} min per session — real page count`}
                  >
                    <Timer className="size-3.5" strokeWidth={2.25} />
                    {readingSessions.label}
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
                {/* Reading mode toggle — only if there's text to read */}
                {readingText && (
                  <button
                    type="button"
                    onClick={() => setReadingMode(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition-all hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-200 active:scale-95"
                    aria-label="Enter reading mode"
                  >
                    <Maximize2 className="size-3.5" strokeWidth={2.25} />
                    Reading mode
                    <kbd className="ml-0.5 hidden rounded border border-slate-200 bg-slate-50 px-1 text-[9px] font-semibold text-slate-400 sm:inline">
                      R
                    </kbd>
                  </button>
                )}
                {/* Print / Save as PDF — uses the browser's native dialog.
                    Print CSS in globals.css hides chrome (header, footer,
                    search bar, chips) so the output is a clean book summary. */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className="trueread-no-print inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:text-slate-800 active:scale-95"
                  aria-label="Print or save as PDF"
                  title="Print / Save as PDF (P)"
                >
                  <Printer className="size-3.5" strokeWidth={2.25} />
                  Print
                  <kbd className="ml-0.5 hidden rounded border border-slate-200 bg-slate-50 px-1 text-[9px] font-semibold text-slate-400 sm:inline">
                    P
                  </kbd>
                </button>
                {/* Share button chip */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="trueread-no-print inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:text-slate-800 active:scale-95"
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
                {/* Bookmark chip with kbd hint — mirrors the cover bookmark button */}
                {onToggleBookmark && (
                  <button
                    type="button"
                    onClick={() => onToggleBookmark(book)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-all active:scale-95',
                      isBookmarked
                        ? 'bg-blue-50 text-blue-700 ring-blue-200 hover:bg-blue-100'
                        : 'bg-white text-slate-600 ring-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-200',
                    )}
                    aria-pressed={isBookmarked}
                    aria-label={isBookmarked ? 'Remove from reading list' : 'Add to reading list'}
                  >
                    {isBookmarked ? (
                      <Bookmark className="size-3.5" strokeWidth={2.25} />
                    ) : (
                      <Bookmark className="size-3.5" strokeWidth={2} />
                    )}
                    {isBookmarked ? 'Saved' : 'Save'}
                    <kbd className="ml-0.5 hidden rounded border border-slate-200 bg-slate-50 px-1 text-[9px] font-semibold text-slate-400 sm:inline">
                      B
                    </kbd>
                  </button>
                )}
              </div>
            )}

            {/* Category badges — clickable to trigger a genre search (collapsible) */}
            {book.categories && book.categories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {visibleCategories.map((cat) => (
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
                {hiddenCategoryCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAllCategories((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition-all hover:bg-blue-100 active:scale-95"
                    aria-expanded={showAllCategories}
                  >
                    {showAllCategories ? (
                      <>
                        <ChevronUp className="size-3" strokeWidth={2.5} />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="size-3" strokeWidth={2.5} />
                        +{hiddenCategoryCount} more
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Find similar books — primary CTA using the book's first category. */}
            {primaryCategory && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => onSearch(primaryCategory)}
                  className="group/sim inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  aria-label={`Find similar books in ${primaryCategory}`}
                >
                  <Compass className="size-4 transition-transform group-hover/sim:rotate-45" strokeWidth={2.25} />
                  Find similar books
                  <span className="hidden text-blue-200 sm:inline">·</span>
                  <span className="hidden text-blue-100 sm:inline">
                    {primaryCategory}
                  </span>
                </button>
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

      {/* More from this author — real author search, excludes current book.
          Renders only when the search yields additional results.
          The data attribute lets the print CSS hide this section (it relies on
          a live network fetch, which doesn't belong in a printed summary). */}
      {onSelectBook && (
        <div
          className="mx-auto mt-2 w-full max-w-6xl px-4 md:px-6"
          data-trueread-more-from-author
        >
          <MoreFromAuthor book={book} onSelect={onSelectBook} />
        </div>
      )}

      {/* Cover lightbox — fullscreen zoom of the book cover */}
      <CoverLightbox
        book={book}
        isOpen={coverLightboxOpen}
        onClose={() => setCoverLightboxOpen(false)}
        source={source}
      />

      {/* Reading mode overlay */}
      <AnimatePresence>
        {readingMode && readingText && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-md"
              onClick={() => setReadingMode(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-4 top-4 z-[61] mx-auto max-h-[calc(100vh-2rem)] max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
              role="dialog"
              aria-modal="true"
              aria-labelledby="reading-mode-title"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <BookOpen className="size-5" strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0">
                    <h2
                      id="reading-mode-title"
                      className="truncate text-base font-semibold text-slate-900"
                      title={book.title}
                    >
                      {book.title}
                    </h2>
                    <p className="truncate text-xs text-slate-500">
                      by {authorsText}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReadingMode(false)}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Exit reading mode"
                >
                  <Minimize2 className="size-4" strokeWidth={2} />
                </button>
              </div>

              {/* Body — scrollable reading content */}
              <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-6 py-8 sm:px-10 sm:py-10">
                <div className="mx-auto max-w-2xl">
                  {/* Reading time chip */}
                  {readingTime && (
                    <div className="mb-6 flex items-center justify-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-100">
                        <Clock className="size-3.5" strokeWidth={2.25} />
                        {readingTime.label} read
                      </span>
                    </div>
                  )}
                  <p className="trueread-dropcap text-lg leading-relaxed text-slate-700 sm:text-xl sm:leading-relaxed">
                    {hasPreview ? renderSnippet(book.previewSnippet!) : book.description}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3">
                <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
                  <Globe className="size-3" strokeWidth={2} />
                  Source: {sourceLabel}
                  <span aria-hidden="true">·</span>
                  Press{' '}
                  <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[9px] font-semibold text-slate-500">
                    Esc
                  </kbd>{' '}
                  to exit
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DetailView
