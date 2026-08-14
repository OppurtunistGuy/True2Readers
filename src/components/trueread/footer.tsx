'use client'

import * as React from 'react'
import { BookOpen, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FooterProps {
  className?: string
}

/**
 * Sticky site footer. Renders the Google Books API attribution.
 * Set the page wrapper to `min-h-screen flex flex-col` and give this
 * component `mt-auto` (done by the parent) so it sticks to the bottom
 * when content is short and is pushed down naturally when content is long.
 */
export function Footer({ className }: FooterProps) {
  return (
    <footer
      className={cn(
        'border-t border-slate-200 bg-white/80 backdrop-blur-md',
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-2 px-4 py-5 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="size-3.5 text-slate-400" aria-hidden="true" />
          <p className="text-xs text-slate-400">
            Source: Google Books API
          </p>
        </div>
        <p className="flex items-center gap-1 text-xs text-slate-400">
          Made with <Heart className="size-3 text-red-400" fill="currentColor" /> for readers
        </p>
      </div>
    </footer>
  )
}

export default Footer
