'use client'

import * as React from 'react'
import Image from 'next/image'
import { BookMarked } from 'lucide-react'
import type { Book } from '@/components/trueread/types'
import { cn } from '@/lib/utils'

export interface CoverImageProps {
  book: Book
  className?: string
  sizes?: string
}

/**
 * Book cover with graceful fallback.
 *
 * - If `book.cover` exists: render next/image (unoptimized so external
 *   Google Books URLs work without domain config), with referrerPolicy
 *   "no-referrer", aspect ratio [2/3], objectFit cover, lazy-loaded.
 *   While loading, a shimmer placeholder is shown behind the image; once
 *   loaded, the image cross-fades in. On hover, the image subtly zooms in.
 * - If no cover: render a navy gradient placeholder with the book's title
 *   (truncated) and a BookMarked icon. No shimmer (the placeholder is
 *   synchronous).
 */
export function CoverImage({ book, className, sizes }: CoverImageProps) {
  const hasCover = typeof book.cover === 'string' && book.cover.length > 0
  const [loaded, setLoaded] = React.useState(false)

  // Reset the loaded flag when the cover URL changes (different book).
  React.useEffect(() => {
    setLoaded(false)
  }, [book.cover])

  if (hasCover) {
    return (
      <div
        className={cn(
          'relative aspect-[2/3] overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/70 shadow-sm',
          className,
        )}
      >
        {/* Shimmer placeholder — visible behind the image while it loads.
            Cross-fades out as the image fades in. */}
        {!loaded && (
          <div
            aria-hidden="true"
            className="trueread-shimmer absolute inset-0 bg-slate-200 transition-opacity duration-300"
          />
        )}
        <Image
          src={book.cover}
          alt={book.title}
          fill
          sizes={sizes ?? '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw'}
          style={{ objectFit: 'cover' }}
          referrerPolicy="no-referrer"
          unoptimized
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={cn(
            'transition-transform duration-500 group-hover:scale-105',
            loaded
              ? 'opacity-100 transition-opacity duration-300'
              : 'opacity-0 transition-opacity duration-300',
          )}
        />
        {/* Subtle gradient overlay at bottom for depth */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-900/10 to-transparent" />
      </div>
    )
  }

  // Fallback placeholder — navy gradient with title + book icon
  return (
    <div
      className={cn(
        'relative aspect-[2/3] overflow-hidden rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 ring-1 ring-slate-200 shadow-sm',
        className,
      )}
      aria-label={`Cover not available for ${book.title}`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center">
        <BookMarked className="size-6 text-slate-400" strokeWidth={1.75} />
        <span className="line-clamp-3 text-xs font-semibold leading-tight text-slate-100">
          {book.title}
        </span>
      </div>
    </div>
  )
}

export default CoverImage
