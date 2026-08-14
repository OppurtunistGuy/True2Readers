'use client'

import * as React from 'react'
import { BookOpen, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  className?: string
}

const sizeMap = {
  sm: {
    iconBox: 'h-7 w-7 rounded-lg',
    iconSize: 'size-4',
    sparkSize: 'size-2.5',
    text: 'text-base',
    gap: 'gap-2',
  },
  md: {
    iconBox: 'h-10 w-10 rounded-xl p-2',
    iconSize: 'size-5',
    sparkSize: 'size-3',
    text: 'text-xl',
    gap: 'gap-2.5',
  },
  lg: {
    iconBox: 'h-12 w-12 rounded-xl p-2.5',
    iconSize: 'size-6',
    sparkSize: 'size-3.5',
    text: 'text-2xl',
    gap: 'gap-3',
  },
} as const

/**
 * TrueRead wordmark: open-book line icon in a blue tint box,
 * followed by the wordmark where "True" is navy and "Read" is blue.
 *
 * When `onClick` is provided, the whole thing renders as a button
 * (used to return home from anywhere in the app).
 */
export function Logo({ size = 'md', onClick, className }: LogoProps) {
  const s = sizeMap[size]
  const content = (
    <>
      <span
        className={cn(
          'relative inline-flex items-center justify-center bg-blue-50 text-blue-600',
          s.iconBox,
        )}
        aria-hidden="true"
      >
        <BookOpen className={s.iconSize} strokeWidth={2.25} />
        <Sparkles
          className={cn(
            'absolute -right-1 -top-1 text-blue-500 drop-shadow-sm',
            s.sparkSize,
          )}
          strokeWidth={2.5}
        />
      </span>
      <span className={cn('font-bold tracking-tight font-sans', s.text)}>
        <span className="text-slate-900">True</span>
        <span className="text-blue-600">Read</span>
      </span>
    </>
  )

  const baseClass = cn(
    'inline-flex items-center gap-2.5 select-none',
    s.gap,
    className,
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="TrueRead — go to home"
        className={cn(
          baseClass,
          'rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 transition-opacity hover:opacity-90',
        )}
      >
        {content}
      </button>
    )
  }

  return (
    <span className={baseClass} aria-label="TrueRead">
      {content}
    </span>
  )
}

export default Logo
