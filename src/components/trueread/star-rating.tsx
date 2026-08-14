'use client'

import * as React from 'react'
import { Star, StarHalf } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StarRatingProps {
  rating: number | null | undefined
  maxStars?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  /** Label suffix, e.g. "Google rating" */
  label?: string
  className?: string
}

const SIZE_MAP = {
  sm: { star: 'size-3', text: 'text-[10px]', gap: 'gap-0.5' },
  md: { star: 'size-3.5', text: 'text-xs', gap: 'gap-0.5' },
  lg: { star: 'size-4', text: 'text-sm', gap: 'gap-1' },
} as const

/**
 * Visual star rating display.
 * Supports half-star rendering.
 * Never fabricates — only shows when rating is a real number > 0.
 */
export function StarRating({
  rating,
  maxStars = 5,
  size = 'md',
  showValue = true,
  label,
  className,
}: StarRatingProps) {
  if (rating == null || !Number.isFinite(rating) || rating <= 0) return null

  const s = SIZE_MAP[size]
  const clamped = Math.min(Math.max(rating, 0), maxStars)
  const fullStars = Math.floor(clamped)
  const hasHalf = clamped - fullStars >= 0.25 && clamped - fullStars < 0.75
  const emptyStars = maxStars - fullStars - (hasHalf ? 1 : 0)

  return (
    <div
      className={cn('inline-flex items-center', s.gap, className)}
      title={`${clamped.toFixed(1)} out of ${maxStars}${label ? ` — ${label}` : ''}`}
    >
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`f${i}`}
          className={cn(s.star, 'fill-amber-400 text-amber-400')}
          strokeWidth={1.5}
        />
      ))}
      {hasHalf && (
        <StarHalf
          className={cn(s.star, 'fill-amber-400 text-amber-400')}
          strokeWidth={1.5}
        />
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star
          key={`e${i}`}
          className={cn(s.star, 'text-slate-300')}
          strokeWidth={1.5}
        />
      ))}
      {showValue && (
        <span className={cn('ml-0.5 font-medium text-slate-600', s.text)}>
          {clamped.toFixed(1)}
        </span>
      )}
      {label && (
        <span className={cn('text-slate-400', s.text)}>{label}</span>
      )}
    </div>
  )
}

export default StarRating
