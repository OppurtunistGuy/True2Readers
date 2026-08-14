import * as React from 'react'
import { BookOpen } from 'lucide-react'
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
        'border-t border-slate-200 bg-white/70 backdrop-blur-sm',
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-center gap-2 px-4 py-5">
        <BookOpen className="size-3.5 text-slate-400" aria-hidden="true" />
        <p className="text-xs text-slate-400">
          Source: Google Books API
        </p>
      </div>
    </footer>
  )
}

export default Footer
