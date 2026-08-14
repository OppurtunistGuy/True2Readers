'use client'

import * as React from 'react'
import { Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface SearchBarProps {
  value: string
  onChange: (v: string) => void
  onSubmit: (v: string) => void
  isLoading?: boolean
  variant?: 'hero' | 'compact'
  placeholder?: string
  className?: string
}

/**
 * Reusable search input + button.
 *
 * - `hero` variant: large white card with soft shadow, tall input, big blue button.
 * - `compact` variant: slimmer inline bar used in result/detail headers.
 *
 * Submits on Enter key or button click. Accessible: role="search" + sr-only label.
 */
export function SearchBar({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  variant = 'hero',
  placeholder = 'Search for a book title or topic…',
  className,
}: SearchBarProps) {
  const inputId = React.useId()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const v = value.trim()
    if (v.length === 0 || isLoading) return
    onSubmit(v)
  }

  if (variant === 'hero') {
    return (
      <form
        role="search"
        aria-label="Book search"
        onSubmit={handleSubmit}
        className={cn(
          'relative flex items-center gap-2 rounded-2xl bg-white p-2 trueread-shadow-soft ring-1 ring-slate-200/70',
          className,
        )}
      >
        <label htmlFor={inputId} className="sr-only">
          Search books
        </label>
        <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
          {isLoading ? (
            <Loader2 className="size-5 animate-spin text-blue-500" />
          ) : (
            <Search className="size-5" />
          )}
        </span>
        <Input
          id={inputId}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className={cn(
            'h-12 md:h-14 w-full rounded-xl border-0 bg-transparent pl-12 pr-3 text-base md:text-lg text-slate-900 placeholder:text-slate-400 shadow-none focus-visible:ring-0',
            '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-cancel-button]:hidden',
          )}
          aria-label="Search books"
          disabled={isLoading}
        />
        <Button
          type="submit"
          disabled={isLoading || value.trim().length === 0}
          className={cn(
            'h-12 md:h-14 shrink-0 rounded-xl bg-blue-600 px-5 md:px-7 text-sm md:text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700',
            'focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          )}
          aria-label="Search"
        >
          <Search className="size-4 md:size-5" strokeWidth={2.5} />
          <span className="hidden sm:inline">Search</span>
        </Button>
      </form>
    )
  }

  // compact variant
  return (
    <form
      role="search"
      aria-label="Book search"
      onSubmit={handleSubmit}
      className={cn(
        'relative flex items-center gap-2 rounded-lg bg-white ring-1 ring-slate-200 px-2',
        className,
      )}
    >
      <label htmlFor={inputId} className="sr-only">
        Search books
      </label>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        {isLoading ? (
          <Loader2 className="size-4 animate-spin text-blue-500" />
        ) : (
          <Search className="size-4" />
        )}
      </span>
      <Input
        id={inputId}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className={cn(
          'h-10 w-full min-w-[8rem] border-0 bg-transparent pl-9 pr-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-none focus-visible:ring-0',
          '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-cancel-button]:hidden',
        )}
        aria-label="Search books"
        disabled={isLoading}
      />
      <Button
        type="submit"
        size="sm"
        disabled={isLoading || value.trim().length === 0}
        className="h-8 shrink-0 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        aria-label="Search"
      >
        <Search className="size-3.5" strokeWidth={2.5} />
        <span className="hidden md:inline">Search</span>
      </Button>
    </form>
  )
}

export default SearchBar
