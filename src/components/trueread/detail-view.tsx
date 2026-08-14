'use client'

import * as React from 'react'
import {
  ArrowLeft,
  ExternalLink,
  Info,
  Quote,
} from 'lucide-react'
import type { Book, BookSource } from '@/components/trueread/types'
import { Button } from '@/components/ui/button'
import { CoverImage } from './cover-image'
import { AiBreakdown } from './ai-breakdown'
import { SearchBar } from './search-bar'

export interface DetailViewProps {
  book: Book
  source?: BookSource
  /** Label for the back button — "Back to results" (came from grid) or "Back to home" (title search). */
  backLabel?: string
  onBack?: () => void
  onSearch: (q: string) => void
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
          <mark
            key={key++}
            className="rounded bg-blue-100 px-0.5 text-blue-900"
          >
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

/**
 * Book detail view. Large white card with a responsive 3-column layout:
 * cover | meta+preview | AI breakdown. Collapses to stacked on mobile.
 */
export function DetailView({ book, source = 'google', backLabel = 'Back to results', onBack, onSearch }: DetailViewProps) {
  const [searchValue, setSearchValue] = React.useState('')
  const [showFullDesc, setShowFullDesc] = React.useState(false)

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
      <article className="mt-8 rounded-2xl bg-white p-6 trueread-shadow-soft ring-1 ring-slate-200/70 md:p-10">
        {source === 'apple' && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-slate-600">
            <Info className="mt-0.5 size-4 shrink-0 text-blue-600" />
            <p>
              <span className="font-medium text-slate-800">Google Books is temporarily unavailable</span>{' '}
              from this environment. Showing real metadata from{' '}
              <span className="font-medium text-blue-700">Apple Books</span> —
              no preview text is available for this book.
            </p>
          </div>
        )}
        <div className="grid gap-8 md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr_300px]">
          {/* Left: cover */}
          <div className="mx-auto w-44 md:mx-0 md:w-full">
            <CoverImage
              book={book}
              sizes="(max-width: 768px) 176px, 220px"
              className="w-full"
            />
            {book.rating != null && book.rating > 0 && (
              <p className="mt-3 text-center text-xs text-slate-500">
                <span className="font-medium text-slate-700">
                  ★ {book.rating.toFixed(1)}
                </span>{' '}
                {source === 'apple' ? 'Apple' : 'Google'} rating
              </p>
            )}
          </div>

          {/* Middle: meta + preview */}
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
              {book.title}
            </h1>
            <p className="mt-2 text-base font-medium text-blue-600">
              by {authorsText}
            </p>

            {/* Meta row */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              {book.year && <span>{book.year}</span>}
              {book.year && book.publisher && (
                <span aria-hidden="true">•</span>
              )}
              {book.publisher && <span>{book.publisher}</span>}
              {(book.year || book.publisher) && book.pageCount != null && (
                <span aria-hidden="true">•</span>
              )}
              {book.pageCount != null && book.pageCount > 0 && (
                <span>{book.pageCount} pages</span>
              )}
            </div>

            {/* Category badges */}
            {book.categories && book.categories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {book.categories.slice(0, 5).map((cat) => (
                  <span
                    key={cat}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                  >
                    {cat}
                  </span>
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
                <p className="mt-3 text-base leading-relaxed text-slate-600">
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
                <span>Source: {sourceLabel}</span>
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
                  className="text-sm font-semibold text-slate-900"
                >
                  About this book
                </h2>
                <p
                  className={
                    showFullDesc
                      ? 'mt-3 text-sm leading-relaxed text-slate-600'
                      : 'mt-3 line-clamp-4 text-sm leading-relaxed text-slate-600'
                  }
                >
                  {book.description}
                </p>
                {book.description && book.description.length > 280 && (
                  <button
                    type="button"
                    onClick={() => setShowFullDesc((v) => !v)}
                    className="mt-2 text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                  >
                    {showFullDesc ? 'Show less' : 'Show more'}
                  </button>
                )}
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
      </article>
    </div>
  )
}

export default DetailView
