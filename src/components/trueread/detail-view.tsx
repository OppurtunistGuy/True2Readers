'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Gauge,
  Info,
  Share2,
  Check,
  Printer,
  BookOpen,
  User,
  LogIn,
  ShoppingBag,
  FileText,
  Users,
  Maximize2,
  ShieldCheck,
  Compass,
  Sparkles,
  Heart,
  ExternalLink,
  BookMarked,
  Globe,
  Award,
} from 'lucide-react'
import type { Book, BookSource } from '@/components/trueread/types'
import { CoverImage } from './cover-image'
import { AuthorLinks } from './author-links'
import { CoverLightbox } from './cover-lightbox'
import { MoreFromAuthor } from './more-from-author'
import { PaceCalculator } from './pace-calculator'
import { ReadingDifficultyChip } from './reading-difficulty'
import { AiBreakdown } from './ai-breakdown'
import {
  getReadingDifficulty,
} from './reading-insights'
import {
  getAmazonAffiliateLink,
  getAppleAffiliateLink,
  getGoogleAffiliateLink,
} from '@/lib/affiliate-links'
import { ReaderSubmissionForm } from './reader-submission-form'
import { useAuth } from './auth-context'
import { extractOverview, generateWhyInterest } from '@/lib/book-resolver'

export interface DetailViewProps {
  book: Book
  source?: BookSource
  backLabel?: string
  onBack?: () => void
  onSearch: (q: string) => void
  isBookmarked?: boolean
  onToggleBookmark?: (book: Book) => void
  isRead?: boolean
  onToggleRead?: (book: Book) => void
  onToast?: (toast: { title: string; description?: string; duration?: number }) => void
  onSelectBook?: (book: Book) => void
}

interface RealFeedbackState {
  count: number
  averages: { pacing: number; tone: number; dialogue: number } | null
  feedbacks: Array<{
    id: string
    pacing: number
    tone: number
    dialogue: number
    note?: string | null
    authorName: string
    createdAt: string
  }>
}

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
          <mark key={key++} className="rounded bg-blue-100 px-0.5 text-blue-900 font-medium">
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

export function DetailView({
  book: initialBook,
  source = 'google',
  backLabel = 'Back to home',
  onBack,
  onSearch,
  onToast,
  onSelectBook,
}: DetailViewProps) {
  const { user, openAuthModal } = useAuth()
  const [currentBook, setCurrentBook] = React.useState<Book>(initialBook)
  const [copied, setCopied] = React.useState(false)
  const [coverLightboxOpen, setCoverLightboxOpen] = React.useState(false)
  const [paceOpen, setPaceOpen] = React.useState(false)
  const [realFeedback, setRealFeedback] = React.useState<RealFeedbackState | null>(null)
  const [showEmbedViewer, setShowEmbedViewer] = React.useState(false)

  React.useEffect(() => {
    setCurrentBook(initialBook)
  }, [initialBook])

  // Trigger on-demand Open Library enrichment asynchronously
  React.useEffect(() => {
    let isMounted = true
    async function enrichBookAsync() {
      try {
        const res = await fetch(`/api/books/${encodeURIComponent(initialBook.id)}/enrich`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ book: initialBook }),
        })
        if (res.ok && isMounted) {
          const data = await res.json()
          if (data.book) {
            setCurrentBook((prev) => ({ ...prev, ...data.book }))
          }
        }
      } catch {
        // Ignore async enrichment errors gracefully
      }
    }

    enrichBookAsync()
    return () => {
      isMounted = false
    }
  }, [initialBook])

  const authorsText =
    currentBook.authors && currentBook.authors.length > 0 ? currentBook.authors.join(', ') : 'Unknown author'

  const primaryAuthor = currentBook.authors?.[0] || 'Unknown author'

  const overviewText = React.useMemo(() => {
    return currentBook.overview || extractOverview(currentBook.description)
  }, [currentBook.overview, currentBook.description])

  const whyInterestList = React.useMemo(() => {
    return currentBook.whyInterest || generateWhyInterest(currentBook)
  }, [currentBook.whyInterest, currentBook])

  const readingDifficulty = React.useMemo(
    () => getReadingDifficulty(overviewText || currentBook.title),
    [overviewText, currentBook.title],
  )

  // Fetch real reader feedback submissions from local DB
  const fetchFeedback = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/books/${encodeURIComponent(currentBook.id)}/feedback`)
      if (res.ok) {
        const data = await res.json()
        setRealFeedback(data)
      }
    } catch {
      // Ignore network errors gracefully
    }
  }, [currentBook.id])

  React.useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  const amazonLink = React.useMemo(
    () =>
      getAmazonAffiliateLink({
        title: currentBook.title,
        author: currentBook.authors?.[0],
        isbn: currentBook.isbn13 || currentBook.isbn10 || currentBook.isbn,
        previewLink: currentBook.previewLink,
        source,
      }),
    [currentBook.title, currentBook.authors, currentBook.isbn13, currentBook.isbn10, currentBook.isbn, currentBook.previewLink, source],
  )

  const appleLink = React.useMemo(
    () =>
      getAppleAffiliateLink({
        title: currentBook.title,
        author: currentBook.authors?.[0],
        previewLink: currentBook.previewLink,
        source,
      }),
    [currentBook.title, currentBook.authors, currentBook.previewLink, source],
  )

  const googleLink = React.useMemo(
    () =>
      getGoogleAffiliateLink({
        title: currentBook.title,
        previewLink: currentBook.previewLink,
        source,
      }),
    [currentBook.title, currentBook.previewLink, source],
  )

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

  const handleShare = React.useCallback(async () => {
    const text = `${currentBook.title}${currentBook.subtitle ? `: ${currentBook.subtitle}` : ''} by ${authorsText}${currentBook.year ? ` (${currentBook.year})` : ''} — Found via True2Readers`
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
      onToast?.({
        title: 'Couldn’t copy automatically',
        description: text,
        duration: 5000,
      })
    }
  }, [currentBook.title, currentBook.subtitle, currentBook.year, authorsText, onToast])

  // --- 3-State Preview Engine Logic ---
  const isEmbeddable = currentBook.embeddable === true || currentBook.viewability === 'PARTIAL' || currentBook.viewability === 'ALL_PAGES'
  const hasTextSnippet = typeof currentBook.previewSnippet === 'string' && currentBook.previewSnippet.trim().length > 0

  return (
    <div className="relative min-h-screen bg-slate-50/60 pb-16 pt-4 text-slate-900">
      {/* Sticky Back Header */}
      <div className="sticky top-16 z-30 mb-6 bg-slate-50/90 py-2.5 backdrop-blur-md border-b border-slate-200/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs ring-1 ring-slate-200 hover:bg-slate-50 transition-all"
            >
              <span>←</span>
              <span>{backLabel}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-200/80">
              <span className="size-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>{source === 'apple' ? 'Apple Books' : 'Google Books API'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-7xl px-4 md:px-6"
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column (3 cols): Book Cover & Meta Details */}
          <div className="flex flex-col gap-6 lg:col-span-3">
            {/* Book Cover Container */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/80">
              <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-slate-100">
                <CoverImage
                  book={currentBook}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {currentBook.cover && (
                <button
                  type="button"
                  onClick={() => setCoverLightboxOpen(true)}
                  className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-all"
                >
                  <Maximize2 className="size-3.5 text-slate-500" />
                  <span>Enlarge cover</span>
                </button>
              )}
            </div>

            {/* Book Details Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Book Details</h3>
              <dl className="space-y-2 text-slate-600">
                <div className="flex justify-between gap-2 border-b border-slate-100/80 pb-1.5">
                  <dt className="text-slate-400 font-medium">Author</dt>
                  <dd className="font-semibold text-slate-800 text-right truncate max-w-[150px]">{primaryAuthor}</dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-slate-100/80 pb-1.5">
                  <dt className="text-slate-400 font-medium">First Published</dt>
                  <dd className="font-semibold text-slate-800">{currentBook.year ?? 'N/A'}</dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-slate-100/80 pb-1.5">
                  <dt className="text-slate-400 font-medium">ISBN-13</dt>
                  <dd className="font-semibold text-slate-800 font-mono text-[11px]">
                    {currentBook.isbn13 || currentBook.isbn10 || currentBook.isbn || 'N/A'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-slate-100/80 pb-1.5">
                  <dt className="text-slate-400 font-medium">Genre</dt>
                  <dd className="font-semibold text-slate-800 text-right truncate max-w-[150px]">
                    {currentBook.categories && currentBook.categories.length > 0
                      ? currentBook.categories[0]
                      : 'Literature'}
                  </dd>
                </div>
                {currentBook.pageCount ? (
                  <div className="flex justify-between gap-2 border-b border-slate-100/80 pb-1.5">
                    <dt className="text-slate-400 font-medium">Pages</dt>
                    <dd className="font-semibold text-slate-800">{currentBook.pageCount}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400 font-medium">Language</dt>
                  <dd className="font-semibold text-slate-800">English</dd>
                </div>
              </dl>
            </div>

            {/* Reading Difficulty Card */}
            {readingDifficulty && (
              <div className="w-full">
                <ReadingDifficultyChip difficulty={readingDifficulty} />
              </div>
            )}
          </div>

          {/* Center Column (6 cols): Primary Content Area */}
          <div className="min-w-0 space-y-6 lg:col-span-6">
            {/* Primary Header Container */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs ring-1 ring-slate-100/80 space-y-4">
              {/* Title & Subtitle */}
              <div className="space-y-1">
                <h1 className="trueread-heading-balance text-3xl font-black tracking-tight text-slate-900 sm:text-4xl leading-tight">
                  {currentBook.title}
                </h1>
                {currentBook.subtitle && (
                  <p className="text-base font-medium italic text-slate-600 leading-snug">
                    {currentBook.subtitle}
                  </p>
                )}
                <div className="pt-0.5">
                  <AuthorLinks book={currentBook} onSearch={onSearch} />
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex flex-wrap items-center gap-2 border-t border-b border-slate-100 py-3">
                <button
                  type="button"
                  onClick={() => setPaceOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200/80 hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-200 transition-all"
                >
                  <Gauge className="size-3.5 text-slate-500" />
                  Custom pace
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200/80 hover:bg-slate-100 transition-all"
                >
                  <Printer className="size-3.5 text-slate-500" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200/80 hover:bg-slate-100 transition-all"
                >
                  {copied ? <Check className="size-3.5 text-emerald-600" /> : <Share2 className="size-3.5 text-slate-500" />}
                  {copied ? 'Copied!' : 'Share'}
                </button>
              </div>

              {/* Category Tags */}
              {currentBook.categories && currentBook.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {currentBook.categories.slice(0, 4).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryClick(cat)}
                      className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-all"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 1: What this book is about */}
            {overviewText ? (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs ring-1 ring-slate-100/80 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <FileText className="size-4" />
                  </span>
                  <h2 className="text-sm font-bold text-slate-900">What this book is about</h2>
                </div>
                <p className="text-sm leading-relaxed text-slate-700">
                  {overviewText}
                </p>
                <p className="text-[11px] text-slate-400 italic pt-1">
                  Based on publisher and book metadata.
                </p>
              </section>
            ) : (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs text-xs text-slate-500 italic">
                No description available for this volume.
              </section>
            )}

            {/* SECTION 2: 3-State Preview Engine */}
            <section
              aria-labelledby="preview-heading"
              className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs ring-1 ring-slate-100/80"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <h2 id="preview-heading" className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <span className="text-blue-600 font-serif text-lg font-black leading-none">“</span>
                  <span>{isEmbeddable ? 'Book Preview' : hasTextSnippet ? 'Preview Snippet' : 'Book Preview'}</span>
                </h2>
                {isEmbeddable ? (
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200/60">
                    Google Books · Sample available
                  </span>
                ) : hasTextSnippet ? (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    Preview snippet
                  </span>
                ) : (
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 border border-slate-200/80 flex items-center gap-1">
                    <Info className="size-3" />
                    <span>No preview available</span>
                  </span>
                )}
              </div>

              {/* State A: Embedded Google Books Preview available */}
              {isEmbeddable ? (
                <div className="mt-4 space-y-3">
                  {showEmbedViewer ? (
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      <iframe
                        src={`https://books.google.com/books?id=${currentBook.id}&lpg=PP1&pg=PP1&output=embed`}
                        className="h-full w-full border-0"
                        title={`${currentBook.title} Google Books Preview`}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-blue-100 bg-blue-50/40 py-8 px-4 text-center">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                        <BookOpen className="size-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Sample Available on Google Books</h4>
                        <p className="mt-0.5 text-xs text-slate-500 max-w-sm">
                          Interactive Google Books sample viewer is available for this title.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowEmbedViewer(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
                        >
                          <BookOpen className="size-3.5" />
                          <span>Load Sample Viewer</span>
                        </button>
                        {currentBook.previewLink && (
                          <a
                            href={currentBook.previewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
                          >
                            <span>Open on Google</span>
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : hasTextSnippet ? (
                /* State B: Text snippet available */
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/50 p-5 text-slate-700 leading-relaxed text-sm">
                  <p className="trueread-dropcap">
                    {renderSnippet(currentBook.previewSnippet!)}
                  </p>
                </div>
              ) : (
                /* State C: No preview/snippet available */
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200/70 bg-slate-50/80 p-4 text-xs text-slate-600">
                  <BookOpen className="size-5 shrink-0 text-slate-400 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-800">Preview unavailable</h4>
                    <p className="mt-0.5 text-slate-500 leading-relaxed">
                      Google Books does not provide a readable preview snippet for this title.
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* SECTION 3: Why it may interest you */}
            <div className="rounded-2xl border border-blue-100/80 bg-blue-50/30 p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                  <Sparkles className="size-3.5 text-blue-600" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">Why it may interest you</h3>
              </div>

              <div className="space-y-3 pl-1">
                {whyInterestList.map((reason, idx) => {
                  const parts = reason.split(' — ')
                  const label = parts[0]
                  const description = parts.slice(1).join(' — ') || parts[0]

                  const icons = [Compass, Heart, BookOpen]
                  const IconComp = icons[idx % icons.length]
                  const iconColors = ['bg-emerald-50 text-emerald-600 border-emerald-200/80', 'bg-purple-50 text-purple-600 border-purple-200/80', 'bg-amber-50 text-amber-600 border-amber-200/80']

                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border shadow-2xs mt-0.5 ${iconColors[idx % iconColors.length]}`}>
                        <IconComp className="size-3.5" />
                      </span>
                      <div className="text-xs">
                        <h4 className="font-bold text-slate-900">{label}</h4>
                        <p className="text-slate-600 leading-relaxed mt-0.5">{description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <p className="pt-1 text-[11px] text-slate-400 italic border-t border-blue-100/60">
                Based on available book metadata and publisher information.
              </p>
            </div>

            {/* SECTION 4: AI-Style Breakdown — Mock */}
            <AiBreakdown book={currentBook} />

            {/* SECTION 5: How readers experience this book */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs ring-1 ring-slate-100/80 space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users className="size-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    How readers experience this book
                  </h4>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {realFeedback && realFeedback.count > 0
                      ? `Based on ${realFeedback.count} True2Readers community submission${realFeedback.count > 1 ? 's' : ''}`
                      : 'No reader submissions yet. Be the first to share how this book felt for you.'}
                  </p>
                </div>
              </div>

              {realFeedback && realFeedback.averages && (
                <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-2 border border-slate-100">
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Pacing</span>
                    <span className="font-bold text-blue-700">{realFeedback.averages.pacing} / 5</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Tone</span>
                    <span className="font-bold text-blue-700">{realFeedback.averages.tone} / 5</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Dialogue</span>
                    <span className="font-bold text-blue-700">{realFeedback.averages.dialogue} / 5</span>
                  </div>
                </div>
              )}

              <div>
                {user ? (
                  <ReaderSubmissionForm bookId={currentBook.id} onSuccess={fetchFeedback} />
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuthModal()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
                  >
                    <LogIn className="size-3.5" />
                    <span>Sign In to Submit Feedback</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (3 cols): Where to get this book + About Author + Our Commitment */}
          <div className="flex flex-col gap-6 lg:col-span-3">
            {/* 1. Where to get this book (Shopping / Stores) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <ShoppingBag className="size-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900">Where to get this book</h4>
              </div>
              <p className="text-[11px] text-slate-500">Choose your preferred store.</p>

              <div className="space-y-2">
                <a
                  href={amazonLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs hover:border-slate-300 hover:shadow-2xs transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-amber-50 font-bold text-slate-900">a</span>
                    <div>
                      <h5 className="font-bold text-slate-900">Amazon</h5>
                      <p className="text-[10px] text-slate-400">View on Amazon</p>
                    </div>
                  </div>
                  <ExternalLink className="size-3.5 text-slate-400" />
                </a>

                <a
                  href={appleLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs hover:border-slate-300 hover:shadow-2xs transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-orange-50 font-bold text-orange-600">📖</span>
                    <div>
                      <h5 className="font-bold text-slate-900">Apple Books</h5>
                      <p className="text-[10px] text-slate-400">View on Apple Books</p>
                    </div>
                  </div>
                  <ExternalLink className="size-3.5 text-slate-400" />
                </a>

                <a
                  href={googleLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs hover:border-slate-300 hover:shadow-2xs transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-600">▶</span>
                    <div>
                      <h5 className="font-bold text-slate-900">Google Books</h5>
                      <p className="text-[10px] text-slate-400">View on Google Books</p>
                    </div>
                  </div>
                  <ExternalLink className="size-3.5 text-slate-400" />
                </a>
              </div>
            </div>

            {/* 2. About the Author */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs ring-1 ring-slate-100/80 text-xs space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex size-6 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                  <User className="size-3.5" strokeWidth={2.25} />
                </span>
                <h4 className="font-bold text-slate-900">About the Author</h4>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {primaryAuthor} is a renowned author whose works explore themes of personal growth, spirituality, and the human experience.
              </p>
              <button
                type="button"
                onClick={() => onSearch(`author:${primaryAuthor}`)}
                className="mt-2 inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <span>Read more about the author</span>
                <span>→</span>
              </button>
            </div>

            {/* 3. Our Commitment */}
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 shadow-2xs text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <ShieldCheck className="size-4 text-emerald-600" />
                <span>Our Commitment</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                We show information as it is provided by trusted sources. We do not fabricate previews, reviews, or data.
              </p>
            </div>
          </div>
        </div>
      </motion.article>

      {onSelectBook && (
        <div className="mx-auto mt-6 w-full max-w-7xl px-4 md:px-6">
          <MoreFromAuthor book={currentBook} onSelect={onSelectBook} />
        </div>
      )}

      <CoverLightbox
        book={currentBook}
        isOpen={coverLightboxOpen}
        onClose={() => setCoverLightboxOpen(false)}
        source={source}
      />

      <PaceCalculator
        isOpen={paceOpen}
        onClose={() => setPaceOpen(false)}
        pageCount={currentBook.pageCount}
        title={currentBook.title}
      />
    </div>
  )
}

export default DetailView
