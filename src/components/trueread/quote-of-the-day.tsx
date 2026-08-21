'use client'

import * as React from 'react'
import { RefreshCw, BookOpen } from 'lucide-react'

interface QuoteEntry {
  body: string
  author: string
  work?: string
}

const QUOTES: QuoteEntry[] = [
  {
    body: 'A room without books is like a body without a soul.',
    author: 'Marcus Tullius Cicero',
  },
  {
    body: 'A reader lives a thousand lives before he dies. The man who never reads lives only one.',
    author: 'George R.R. Martin',
  },
  {
    body: 'Books are a uniquely portable magic.',
    author: 'Stephen King',
  },
  {
    body: 'Until I feared I would lose it, I never loved to read. One does not love breathing.',
    author: 'Harper Lee',
  },
  {
    body: 'A book is a dream that you hold in your hand.',
    author: 'Neil Gaiman',
  },
  {
    body: 'There is no friend as loyal as a book.',
    author: 'Ernest Hemingway',
  },
]

export interface QuoteOfTheDayProps {
  onSearch?: (q: string) => void
  className?: string
}

export function QuoteOfTheDay({ onSearch, className }: QuoteOfTheDayProps) {
  const [index, setIndex] = React.useState<number>(0)
  const quote = QUOTES[index]

  const handleNext = () => {
    setIndex((i) => (i + 1) % QUOTES.length)
  }

  const handleAuthorClick = () => {
    if (onSearch) {
      onSearch(`author:${quote.author}`)
    }
  }

  return (
    <div className={`mx-auto w-full max-w-4xl px-4 ${className || 'py-6'}`}>
      <div className="relative rounded-2xl border border-blue-100 bg-blue-50/40 p-6 md:p-8 transition-all shadow-2xs overflow-hidden">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12 items-center">
          {/* Left Column: Quote Text & Author */}
          <div className="md:col-span-8 space-y-3 text-left">
            <span className="text-4xl font-serif font-black text-blue-500 leading-none block">
              “
            </span>
            <p className="text-base sm:text-lg font-medium text-slate-800 leading-relaxed">
              {quote.body}
            </p>
            <div className="text-sm font-bold text-blue-600">
              <button
                type="button"
                onClick={handleAuthorClick}
                className="hover:underline focus:outline-none"
              >
                — {quote.author}
              </button>
            </div>
          </div>

          {/* Right Column: Open book vector graphic with plant & coffee cup */}
          <div className="hidden md:flex md:col-span-4 items-center justify-center relative">
            <div className="relative w-44 h-28 flex items-center justify-center rounded-2xl bg-blue-100/60 p-4 border border-blue-200/50">
              <BookOpen className="size-16 text-blue-500/80 stroke-[1.2]" />
              <div className="absolute -top-2 right-2 size-6 rounded-full bg-blue-200/80 flex items-center justify-center text-[10px] text-blue-700 font-bold">
                ☕
              </div>
              <div className="absolute -bottom-1 left-2 size-6 rounded-full bg-blue-200/80 flex items-center justify-center text-[10px] text-blue-700 font-bold">
                🪴
              </div>
            </div>
          </div>
        </div>

        {/* Refresh button top right */}
        <button
          type="button"
          onClick={handleNext}
          className="absolute top-4 right-4 inline-flex size-8 items-center justify-center rounded-full text-blue-600 hover:bg-blue-100/60 transition-colors focus:outline-none"
          aria-label="Refresh quote"
          title="Next quote"
        >
          <RefreshCw className="size-4" strokeWidth={2} />
        </button>

        {/* 6 Pagination Dots Centered at Bottom */}
        <div className="mt-6 flex items-center justify-center gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className={`size-2 rounded-full transition-all ${
                i === index % 6 ? 'bg-blue-600 w-3' : 'bg-slate-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default QuoteOfTheDay
