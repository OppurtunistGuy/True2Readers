'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, X, ZoomIn } from 'lucide-react'
import type { Book, BookSource } from './types'
import { CoverImage } from './cover-image'

export interface CoverLightboxProps {
  /** The book whose cover to display. */
  book: Book
  /** Whether the lightbox is open. */
  isOpen: boolean
  /** Close the lightbox. */
  onClose: () => void
  /** The real data source — used for the "Open in {source}" link. */
  source?: BookSource
}

/**
 * Fullscreen cover-zoom overlay.
 *
 * Opens when the user clicks the book cover in the detail view. Shows the
 * cover at a large size (up to 60vh), with the title + author below and an
 * optional "Open in {source}" link. Body scroll is locked while open.
 *
 * Closes on: Esc (handled by parent), backdrop click, or the close button.
 */
export function CoverLightbox({
  book,
  isOpen,
  onClose,
  source = 'google',
}: CoverLightboxProps) {
  // Lock body scroll while open
  React.useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [isOpen])

  const sourceLabel = source === 'apple' ? 'Apple Books' : 'Google Books'
  const authorsText =
    book.authors.length > 0 ? book.authors.join(', ') : 'Unknown author'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-slate-900/70 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Centered content */}
          <div className="fixed inset-0 z-[71] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="cover-lightbox-title"
              className="pointer-events-auto relative flex max-h-[90vh] w-full max-w-md flex-col items-center gap-4 overflow-hidden rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200"
            >
              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close cover preview"
              >
                <X className="size-4" strokeWidth={2} />
              </button>

              {/* Hint chip */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 ring-1 ring-blue-100">
                <ZoomIn className="size-3" strokeWidth={2.5} />
                Cover preview
              </span>

              {/* Large cover */}
              <div className="w-44 shrink-0 overflow-hidden rounded-xl shadow-xl ring-1 ring-slate-200 sm:w-52">
                <CoverImage
                  book={book}
                  sizes="(max-width: 640px) 176px, 208px"
                  className="w-full"
                />
              </div>

              {/* Title + author */}
              <div className="text-center">
                <h2
                  id="cover-lightbox-title"
                  className="text-lg font-bold leading-tight text-slate-900"
                  title={book.title}
                >
                  {book.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">by {authorsText}</p>
                {book.year && (
                  <p className="mt-0.5 text-xs text-slate-400">
                    First published {book.year}
                  </p>
                )}
              </div>

              {/* Footer — open in source */}
              {book.previewLink && (
                <div className="mt-2 border-t border-slate-100 pt-3">
                  <a
                    href={book.previewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                  >
                    Open in {sourceLabel}
                    <ExternalLink className="size-3.5" strokeWidth={2} />
                  </a>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CoverLightbox
