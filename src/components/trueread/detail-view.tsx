'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Bookmark,
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
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Star,
  Pencil,
  Clock,
  Award,
  BookMarked,
  Globe,
  Trophy,
} from 'lucide-react'
import type { Book, BookSource } from '@/components/trueread/types'
import { CoverImage } from './cover-image'
import { AuthorLinks } from './author-links'
import { CoverLightbox } from './cover-lightbox'
import { MoreFromAuthor } from './more-from-author'
import { PaceCalculator } from './pace-calculator'
import { ReadingDifficultyChip } from './reading-difficulty'
import { AiBreakdown } from './ai-breakdown'
import { CoverPalette } from './cover-palette'
import { QuoteOfTheDay } from './quote-of-the-day'
import { FetchedReviewsSection } from './fetched-reviews-section'
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
import { getReaderExperience } from '@/lib/reader-experiences'
import { ReaderExperienceSection } from './reader-experience-section'
import { ShelfDetail } from './shelf-detail'
import { AUTH_ENABLED } from '@/lib/features'

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
  /**
   * Lean layout (used by the Shelf view): hides secondary items for now —
   * enlarge cover, print, share, extra retailers, the six-dimension framework
   * and "More from the author". Nothing is removed; Classic passes nothing.
   */
  lean?: boolean
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

function DotMeter({ dots = 3 }: { dots: number }) {
  return (
    <div className="flex items-center gap-1 justify-center mt-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`size-2 rounded-full ${
            i < dots ? 'bg-blue-600' : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  )
}

export function DetailView({
  book: initialBook,
  source = 'google',
  backLabel = 'Back to results',
  onBack,
  onSearch,
  isBookmarked = false,
  onToggleBookmark,
  onToast,
  onSelectBook,
  lean = false,
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

  const readerExperienceProfile = React.useMemo(
    () => getReaderExperience(currentBook),
    [currentBook]
  )

  // Fetch real reader feedback submissions from local DB
  const fetchFeedback = React.useCallback(async () => {
    if (!AUTH_ENABLED) return // accounts off: there is no feedback service
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

    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text)
        succeeded = true
      } catch {
        succeeded = false
      }
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

  // Preview snippet text
  const hasTextSnippet = typeof currentBook.previewSnippet === 'string' && currentBook.previewSnippet.trim().length > 0
  const previewSnippetText = hasTextSnippet ? currentBook.previewSnippet!.replace(/<[^>]*>/g, '').trim() : ''

  const descriptionText = extractOverview(currentBook.description || currentBook.overview) || (currentBook.description || currentBook.overview || '').replace(/<[^>]*>/g, '').replace(/&#xa0;/gi, ' ').trim()
  const hasDescription = descriptionText.length > 0

  // Real values only — no invented year or categories when the source has none.
  const pubYear = currentBook.year || '—'
  const categoriesList = currentBook.categories && currentBook.categories.length > 0
    ? currentBook.categories
    : []

  // Shelf mode: a flowing layout (preview first, then reader experience).
  if (lean) {
    return (
      <>
        <ShelfDetail
          book={currentBook}
          backLabel={backLabel}
          onBack={onBack}
          onSearch={onSearch}
          primaryAuthor={primaryAuthor}
          year={currentBook.year}
          categories={categoriesList}
          descriptionText={descriptionText}
          previewSnippetText={previewSnippetText}
          amazonLink={amazonLink}
          googleLink={googleLink}
          profile={readerExperienceProfile}
          isBookmarked={isBookmarked}
          onToggleBookmark={onToggleBookmark}
          onOpenPace={() => setPaceOpen(true)}
          signedIn={!!user}
          onSignIn={openAuthModal}
          feedbackCount={realFeedback?.count ?? 0}
          accountsEnabled={AUTH_ENABLED}
          onCategoryClick={handleCategoryClick}
        />
        <PaceCalculator
          isOpen={paceOpen}
          onClose={() => setPaceOpen(false)}
          pageCount={currentBook.pageCount}
          title={currentBook.title}
        />
      </>
    )
  }

  return (
    <div className="relative min-h-screen bg-slate-50/60 pb-16 pt-4 text-slate-900">
      {/* Top Back Header */}
      <div className="sticky top-16 z-30 mb-6 bg-slate-50/90 py-2.5 backdrop-blur-md border-b border-slate-200/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 md:px-6">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
            >
              <span>← {backLabel}</span>
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* Main Content 3-Column Layout */}
      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-7xl px-4 md:px-6"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN (3 cols): Book Cover, Book Details, Quick Facts, Available at */}
          <div className="flex flex-col gap-5 lg:col-span-3">
            {/* Book Cover Container with 3D Shadow */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-3 shadow-md border border-slate-200/80">
              <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-slate-100 shadow-lg">
                <CoverImage
                  book={currentBook}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <button
                type="button"
                hidden={lean}
                onClick={() => setCoverLightboxOpen(true)}
                className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-all"
              >
                <Maximize2 className="size-3.5 text-slate-500" />
                <span>Enlarge cover</span>
              </button>
            </div>

            {/* Book Details Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Book Details</h3>
              <dl className="space-y-2 text-slate-600">
                <div className="flex justify-between gap-2 border-b border-slate-100/80 pb-1.5">
                  <dt className="text-slate-400 font-medium">Author</dt>
                  <dd className="font-semibold text-slate-800 text-right truncate max-w-[140px]">{primaryAuthor}</dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-slate-100/80 pb-1.5">
                  <dt className="text-slate-400 font-medium">First Published</dt>
                  <dd className="font-semibold text-slate-800">{pubYear}</dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-slate-100/80 pb-1.5">
                  <dt className="text-slate-400 font-medium">ISBN-13</dt>
                  <dd className="font-semibold text-slate-800 font-mono text-[11px]">
                    {currentBook.isbn13 || currentBook.isbn10 || currentBook.isbn || '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-slate-100/80 pb-1.5">
                  <dt className="text-slate-400 font-medium">Genre</dt>
                  <dd className="font-semibold text-slate-800 text-right truncate max-w-[140px]">
                    {categoriesList[0] || '—'}
                  </dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-slate-100/80 pb-1.5">
                  <dt className="text-slate-400 font-medium">Pages</dt>
                  <dd className="font-semibold text-slate-800">{currentBook.pageCount ? `~${currentBook.pageCount} pages` : '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400 font-medium">Language</dt>
                  <dd className="font-semibold text-slate-800">English</dd>
                </div>
              </dl>
            </div>

            {/* Available at Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3 text-xs">
              <h4 className="font-bold text-slate-900">Available at</h4>
              <div className="space-y-2">
                <a
                  href={amazonLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 p-3 text-xs font-bold text-white shadow-sm hover:from-orange-600 hover:to-amber-600 transition-all"
                >
                  <span className="text-sm font-black">a</span>
                  <span>Amazon</span>
                </a>

                <a
                  hidden={lean}
                  href={appleLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-all"
                >
                  <span className="text-sm font-bold"></span>
                  <span>Apple Books</span>
                </a>

                <a
                  hidden={lean}
                  href={googleLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-all"
                >
                  <span className="text-sm font-bold text-blue-600">▶</span>
                  <span>Google Books</span>
                </a>
              </div>
            </div>
          </div>

          {/* CENTER COLUMN (6 cols): Title, Subtitle, Author, Tags, PREVIEW, Overview, Why Interest, Reading Feel, Reader Experience */}
          <div className="min-w-0 space-y-6 lg:col-span-6">
            {/* Header: Title, Subtitle & Author */}
            <div className="space-y-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-snug break-words">
                  {currentBook.title}
                </h1>
                {currentBook.subtitle && (
                  <p className="mt-1 text-sm sm:text-base font-medium text-slate-500 leading-normal break-words">
                    {currentBook.subtitle}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onSearch(`author:${primaryAuthor}`)}
                  className="text-sm sm:text-base font-bold text-blue-600 hover:underline"
                >
                  {primaryAuthor}
                </button>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPaceOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs hover:bg-blue-50 hover:text-blue-700 transition-all"
                  >
                    <Clock className="size-3.5 text-slate-500" />
                    Custom pace
                  </button>
                  {onToggleBookmark && (
                    <button
                      type="button"
                      onClick={() => onToggleBookmark(currentBook)}
                      aria-pressed={isBookmarked}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold border shadow-2xs transition-all ${
                        isBookmarked
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                    >
                      <Bookmark className={`size-3.5 ${isBookmarked ? 'fill-current' : 'text-slate-500'}`} />
                      {isBookmarked ? 'Saved' : 'Save'}
                    </button>
                  )}
                  <button
                    type="button"
                    hidden={lean}
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs hover:bg-slate-50 transition-all"
                  >
                    <Printer className="size-3.5 text-slate-500" />
                    Print
                  </button>
                  <button
                    type="button"
                    hidden={lean}
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs hover:bg-slate-50 transition-all"
                  >
                    {copied ? <Check className="size-3.5 text-emerald-600" /> : <Share2 className="size-3.5 text-slate-500" />}
                    {copied ? 'Copied!' : 'Share'}
                  </button>
                </div>
              </div>

              {/* Category Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-all"
                  >
                    {cat}
                  </button>
                ))}
                {categoriesList.length > 0 && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                    +2
                  </span>
                )}
              </div>
            </div>

            {/* 1. What this book is about */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="size-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">What this book is about</h2>
              </div>
              <p className="text-sm leading-relaxed text-slate-700">
                {descriptionText ||
                  'A concise factual overview of the central subject matter, concepts, and themes explored throughout the book.'}
              </p>
              <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-100/60">
                Based on available book metadata and publisher information.
              </p>
            </div>

            {/* 2. What readers experience & Potential mismatch (Phase 0 Curated Engine) */}
            <ReaderExperienceSection profile={readerExperienceProfile} />

            {/* 3. Interactive Book Preview Frame */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900">Book Preview</h2>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Google Books • Sample available
                </span>
              </div>

              {/* 3D Dark Reader Mockup Pane */}
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 text-white shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-12">
                  {/* Left Pane (Dark controls) */}
                  <div className="flex flex-col justify-between border-b border-slate-800 md:border-b-0 md:border-r p-6 md:col-span-5 bg-slate-950">
                    <div className="space-y-2">
                      <h3 className="text-lg font-extrabold text-white leading-tight">
                        {currentBook.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">{primaryAuthor}</p>
                    </div>

                    <div className="space-y-3 pt-6">
                      <a
                        href={googleLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 hover:bg-slate-100 transition-all"
                      >
                        <span>Open in Google Books</span>
                        <ExternalLink className="size-3.5" />
                      </a>
                      <p className="text-[10px] text-slate-500 text-center">
                        Official preview provided via Google Books.
                      </p>
                    </div>
                  </div>

                  {/* Right Pane (Sample Excerpt) */}
                  <div className="p-6 md:col-span-7 bg-white text-slate-900 font-serif leading-relaxed text-xs">
                    <p className="text-[10px] font-sans uppercase font-bold tracking-widest text-slate-400 mb-2">
                      EXCERPT / SAMPLE
                    </p>
                    <h4 className="text-sm font-sans font-extrabold text-slate-900 mb-4">
                      {currentBook.title}
                    </h4>
                    <p className="italic text-slate-700 leading-relaxed">
                      {previewSnippetText ||
                        `"${descriptionText.slice(0, 220)}..."`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Authentic source preview</span>
                <a
                  href={googleLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Explore preview on Google Books →
                </a>
              </div>
            </div>

            {/* 4. Community reader feedback (hidden while accounts are off) */}
            {AUTH_ENABLED && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900">Community Reader Feedback</h3>
                </div>
                <span className="text-[10px] font-semibold text-slate-400">
                  {realFeedback && realFeedback.count > 0
                    ? `${realFeedback.count} submissions`
                    : 'No feedback yet'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Direct feedback from verified readers.</p>

              <div className="rounded-xl bg-blue-50/50 p-6 border border-blue-100 text-center space-y-3">
                <p className="text-xs font-semibold text-slate-800">
                  Have you read this book? Share how it felt for you.
                </p>
                <button
                  type="button"
                  onClick={() => (user ? null : openAuthModal())}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-all"
                >
                  <Pencil className="size-3.5" />
                  <span>{user ? 'Submit Feedback' : 'Sign in to Share Feedback'}</span>
                </button>
              </div>
            </div>
            )}
          </div>

          {/* RIGHT COLUMN (3 cols): Reader Experience Framework (6), About Author, Commitment */}
          <div className="flex flex-col gap-5 lg:col-span-3">
            {/* Reader Experience Framework (6 Dimensions) */}
            {!lean && <AiBreakdown book={currentBook} />}

            {/* About the Author (Dynamic) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs text-xs space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <User className="size-4 text-blue-600" />
                <h4 className="font-bold text-slate-900">About the Author</h4>
              </div>
              <p className="text-slate-600 leading-relaxed">
                <strong className="text-slate-800 font-semibold">{primaryAuthor}</strong> is the author of {currentBook.title}. Explore more published titles, background, and related topics.
              </p>
              <button
                type="button"
                onClick={() => onSearch(`author:${primaryAuthor}`)}
                className="mt-2 inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
              >
                <span>Find more by {primaryAuthor}</span>
                <span>→</span>
              </button>
            </div>

            {/* Our Commitment */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-2xs text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <ShieldCheck className="size-4 text-emerald-600" />
                <span>Our Commitment</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                We show information as it is provided by trusted sources. We do not fabricate previews, reviews, or data.
              </p>
              <button
                type="button"
                className="pt-1 inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline text-[11px]"
              >
                <span>Learn more about our approach</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </motion.article>

      {onSelectBook && !lean && (
        <div className="mx-auto mt-8 w-full max-w-7xl px-4 md:px-6">
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
