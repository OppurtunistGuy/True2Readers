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
  /** Optional ref to the underlying <input> (used by the `/` keyboard shortcut). */
  inputRef?: React.Ref<HTMLInputElement>
  /** Show a small "Press /" hint (hero only, desktop only). */
  showHint?: boolean
}

/**
 * Reusable search input + button.
 *
 * - `hero` variant: large white card with soft shadow, tall input, big blue button.
 * - `compact` variant: slimmer inline bar used in result/detail headers.
 *
 * Submits on Enter key or button click. Accessible: role="search" + sr-only label.
 */
export const SearchBar = React.forwardRef<HTMLFormElement, SearchBarProps>(
  function SearchBar(
    {
      value,
      onChange,
      onSubmit,
      isLoading = false,
      variant = 'hero',
      placeholder = 'Search for a book title or topic…',
      className,
      inputRef,
      showHint = false,
    },
    formRef,
  ) {
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
          ref={formRef}
          role="search"
          aria-label="Book search"
          onSubmit={handleSubmit}
          className={cn(
            'relative flex items-center gap-2 rounded-2xl bg-white p-2 trueread-shadow-soft ring-1 ring-slate-200/70 transition-shadow focus-within:ring-2 focus-within:ring-blue-500/40',
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
            ref={inputRef}
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
          {showHint && !isLoading && value.length === 0 && (
            <kbd
              className="pointer-events-none absolute right-28 top-1/2 hidden -translate-y-1/2 select-none items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 md:flex"
              aria-hidden="true"
            >
              /
            </kbd>
          )}
          <Button
            type="submit"
            disabled={isLoading || value.trim().length === 0}
            className={cn(
              'h-12 md:h-14 shrink-0 rounded-xl bg-blue-600 px-5 md:px-7 text-sm md:text-base font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:scale-[0.98]',
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
        ref={formRef}
        role="search"
        aria-label="Book search"
        onSubmit={handleSubmit}
        className={cn(
          'relative flex items-center gap-2 rounded-lg bg-white ring-1 ring-slate-200 px-2 transition-shadow focus-within:ring-2 focus-within:ring-blue-500/40',
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
          ref={inputRef}
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
          className="h-8 shrink-0 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          aria-label="Search"
        >
          <Search className="size-3.5" strokeWidth={2.5} />
          <span className="hidden md:inline">Search</span>
        </Button>
      </form>
    )
  },
)

export default SearchBar
