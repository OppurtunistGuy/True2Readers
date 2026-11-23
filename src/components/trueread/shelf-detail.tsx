'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Bookmark, Clock, ExternalLink } from 'lucide-react'
import type { Book } from '@/components/trueread/types'
import type { ReaderExperienceProfile } from '@/lib/reader-experiences'
import { CoverImage } from './cover-image'
import { cn } from '@/lib/utils'

/**
 * ShelfDetail — the book page in Shelf mode.
 *
 * A single flowing column instead of stacked boxes. Order: title and actions,
 * the book PREVIEW first, then what the book is about, then the reader
 * experience (pacing, writing style, ...), then a one-line feedback prompt.
 * It is presentation only: DetailView computes everything and passes it in.
 */
export interface ShelfDetailProps {
  book: Book
  backLabel: string
  onBack?: () => void
  onSearch: (q: string) => void
  primaryAuthor: string
  year: string | null
  categories: string[]
  descriptionText: string
  previewSnippetText: string
  amazonLink: string
  googleLink: string
  profile: ReaderExperienceProfile | null
  isBookmarked: boolean
  onToggleBookmark?: (book: Book) => void
  onOpenPace: () => void
  signedIn: boolean
  onSignIn: () => void
  feedbackCount: number
  /** False while accounts are switched off: hides the feedback / sign-in section. */
  accountsEnabled: boolean
  onCategoryClick: (cat: string) => void
}

const label = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1F3FB0]'

function Section({
  title,
  aside,
  children,
}: {
  title: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-[#141414]/20 py-5 first:border-t-0 first:pt-0">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className={label}>{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

export function ShelfDetail({
  book,
  backLabel,
  onBack,
  onSearch,
  primaryAuthor,
  year,
  categories,
  descriptionText,
  previewSnippetText,
  amazonLink,
  googleLink,
  profile,
  isBookmarked,
  onToggleBookmark,
  onOpenPace,
  signedIn,
  onSignIn,
  feedbackCount,
  accountsEnabled,
  onCategoryClick,
}: ShelfDetailProps) {
  const pages = book.pageCount ? `~${book.pageCount} pages` : null
  const isbn = book.isbn13 || book.isbn10 || book.isbn || null
  const facts = [
    ['Published', year],
    ['Genre', categories[0] ?? null],
    ['Length', pages],
    ['ISBN', isbn],
  ].filter((f): f is [string, string] => !!f[1])

  const hasSample = previewSnippetText.length > 0
  const previewText = hasSample
    ? previewSnippetText
    : descriptionText.length > 260
      ? `${descriptionText.slice(0, 260).replace(/\s+\S*$/, '')}…`
      : descriptionText

  const dims = profile
    ? [
        ['Pacing', profile.experience.pacing],
        ['Writing & prose', profile.experience.writing],
        ['Complexity', profile.experience.complexity],
        ['Narrative engine', profile.experience.focus],
        ['Atmosphere', profile.experience.emotional],
      ]
    : []

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 font-[family-name:var(--font-shelf-sans)] text-[#141414] md:px-8">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#1F3FB0] hover:opacity-70"
        >
          <ArrowLeft className="size-3.5" />
          {backLabel}
        </button>
      )}

      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid gap-x-12 gap-y-6 lg:grid-cols-[230px_minmax(0,1fr)]"
      >
        {/* Left: cover, facts, buy */}
        <aside className="mx-auto w-40 sm:w-48 lg:sticky lg:top-24 lg:mx-0 lg:w-full lg:self-start">
          <CoverImage book={book} className="w-full rounded-[2px] shadow-[0_24px_40px_-24px_rgba(20,16,10,0.6)]" />
          {facts.length > 0 && (
            <dl className="mt-4 hidden space-y-1.5 text-xs lg:block">
              {facts.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-[#141414]/15 pb-1.5">
                  <dt className="text-[#5C5952]">{k}</dt>
                  <dd className="truncate text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          <a
            href={amazonLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 hidden h-10 items-center justify-center gap-2 bg-[#1F3FB0] text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-85 lg:flex"
          >
            Get this book
            <ExternalLink className="size-3.5" />
          </a>
        </aside>

        {/* Right: one flowing column */}
        <div className="min-w-0">
          <header className="pb-5">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-[#1F3FB0] sm:text-4xl">
              {book.title}
            </h1>
            {book.subtitle && <p className="mt-1 text-base text-[#5C5952]">{book.subtitle}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              <button
                type="button"
                onClick={() => onSearch(`author:${primaryAuthor}`)}
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1F3FB0] hover:underline"
              >
                {primaryAuthor}
              </button>
              {year && <span className="text-[11px] tracking-wide text-[#5C5952]">{year}</span>}
              {categories.slice(0, 3).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onCategoryClick(c)}
                  className="border border-[#141414]/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] hover:border-[#1F3FB0] hover:text-[#1F3FB0]"
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {onToggleBookmark && (
                <button
                  type="button"
                  onClick={() => onToggleBookmark(book)}
                  aria-pressed={isBookmarked}
                  className={cn(
                    'inline-flex h-9 items-center gap-2 border px-4 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors',
                    isBookmarked
                      ? 'border-[#1F3FB0] bg-[#1F3FB0] text-white'
                      : 'border-[#141414]/70 hover:border-[#1F3FB0] hover:text-[#1F3FB0]',
                  )}
                >
                  <Bookmark className={cn('size-3.5', isBookmarked && 'fill-current')} />
                  {isBookmarked ? 'Saved' : 'Save'}
                </button>
              )}
              <button
                type="button"
                onClick={onOpenPace}
                className="inline-flex h-9 items-center gap-2 border border-[#141414]/70 px-4 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors hover:border-[#1F3FB0] hover:text-[#1F3FB0]"
              >
                <Clock className="size-3.5" />
                Reading time
              </button>
              <a
                href={amazonLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-2 bg-[#1F3FB0] px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white hover:opacity-85 lg:hidden"
              >
                Get this book
              </a>
            </div>
          </header>

          {/* 1. Preview comes first */}
          {previewText && (
            <Section
              title={hasSample ? 'Preview — a sample from the book' : 'Preview'}
              aside={
                <a
                  href={googleLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1F3FB0] hover:underline"
                >
                  Read more on Google Books
                  <ExternalLink className="size-3" />
                </a>
              }
            >
              <blockquote className="border-l-2 border-[#1F3FB0] pl-4 font-[family-name:var(--font-shelf-serif)] text-lg italic leading-relaxed text-[#141414]/90">
                {previewText}
              </blockquote>
              {!hasSample && (
                <p className="mt-2 pl-4 text-[11px] text-[#5C5952]">Publisher description — no text sample available.</p>
              )}
            </Section>
          )}

          {/* 2. About */}
          {descriptionText && descriptionText !== previewText && (
            <Section title="What this book is about">
              <p className="max-w-prose text-[15px] leading-relaxed text-[#141414]/85">{descriptionText}</p>
            </Section>
          )}

          {/* 3. Reader experience: writing style, pacing, ... */}
          {profile && (
            <Section
              title="What readers experience"
              aside={<span className="text-[11px] text-[#5C5952]">Curated by True2Readers</span>}
            >
              <dl className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
                {dims.map(([name, d]) => (
                  <div key={name as string} className="border-t border-[#141414]/15 pt-2.5">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5C5952]">{name as string}</dt>
                    <dd className="mt-0.5 text-sm font-semibold">{(d as { label: string }).label}</dd>
                    <dd className="mt-0.5 text-sm leading-snug text-[#141414]/75">{(d as { nuance: string }).nuance}</dd>
                  </div>
                ))}
              </dl>

              {profile.mismatch && profile.mismatch.length > 0 && (
                <div className="mt-6 border-l-2 border-[#d9a441] pl-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a5a00]">
                    Potential mismatch — may not suit you if
                  </p>
                  <ul className="mt-1.5 space-y-1 text-sm text-[#141414]/80">
                    {profile.mismatch.map((m, i) => (
                      <li key={i}>• {m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {profile.consensus && (
                <p className="mt-5 max-w-prose text-sm italic leading-relaxed text-[#141414]/70">
                  <span className="font-semibold not-italic text-[#141414]">Reader consensus: </span>
                  {profile.consensus}
                </p>
              )}
            </Section>
          )}

          {/* 4. Feedback, one line (only when accounts exist) */}
          {accountsEnabled && (
            <Section title="Your experience">
              <p className="text-sm text-[#141414]/80">
                {feedbackCount > 0 ? `${feedbackCount} reader submissions. ` : 'No reader feedback yet. '}
                {signedIn ? (
                  'Submitting feedback is not available yet.'
                ) : (
                  <button type="button" onClick={onSignIn} className="font-semibold text-[#1F3FB0] hover:underline">
                    Sign in to share how it felt →
                  </button>
                )}
              </p>
            </Section>
          )}
        </div>
      </motion.article>
    </div>
  )
}
