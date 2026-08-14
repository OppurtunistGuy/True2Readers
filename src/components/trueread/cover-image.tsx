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
 * - If no cover: render a navy gradient placeholder with the book's title
 *   (truncated) and a BookMarked icon.
 */
export function CoverImage({ book, className, sizes }: CoverImageProps) {
  const hasCover = typeof book.cover === 'string' && book.cover.length > 0

  if (hasCover) {
    return (
      <div
        className={cn(
          'relative aspect-[2/3] overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/70 shadow-sm',
          className,
        )}
      >
        <Image
          src={book.cover}
          alt={book.title}
          fill
          sizes={sizes ?? '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw'}
          style={{ objectFit: 'cover' }}
          referrerPolicy="no-referrer"
          unoptimized
          loading="lazy"
          className="transition-transform duration-300"
        />
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
