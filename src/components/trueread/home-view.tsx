'use client'

import * as React from 'react'
import { BarChart3, BookOpen, ChevronRight, Search } from 'lucide-react'
import { SearchBar } from './search-bar'

export interface HomeViewProps {
  onSearch: (q: string) => void
  isLoading: boolean
}

const SUGGESTIONS = [
  'Atomic Habits',
  'The Alchemist',
  'self-help',
  'Fantasy',
  'Mystery',
  'Science Fiction',
]

const STEPS = [
  {
    icon: Search,
    title: 'Search',
    desc: 'Type a title or topic.',
  },
  {
    icon: BookOpen,
    title: 'Select',
    desc: 'Pick a book from real results.',
  },
  {
    icon: BarChart3,
    title: 'Understand',
    desc: 'Read the preview & quick breakdown.',
  },
] as const

/**
 * Landing / hero view. Centered headline + hero SearchBar + suggestion
 * tags + "How TrueRead works" 3-step section.
 */
export function HomeView({ onSearch, isLoading }: HomeViewProps) {
  const [value, setValue] = React.useState('')

  const handleSubmit = (q: string) => {
    onSearch(q)
  }

  const handleSuggestion = (tag: string) => {
    setValue('')
    onSearch(tag)
  }

  return (
    <div className="relative">
      {/* Hero */}
      <section
        className="trueread-aurora relative isolate overflow-hidden"
        aria-labelledby="hero-heading"
      >
        <div className="mx-auto w-full max-w-3xl px-4 py-16 md:py-24">
          <h1
            id="hero-heading"
            className="text-center text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl"
          >
            What do you want to read?
          </h1>
          <p className="mt-4 text-center text-lg text-slate-500">
            Search any book title or topic — then understand it in seconds.
          </p>

          <div className="mx-auto mt-8 w-full max-w-2xl">
            <SearchBar
              value={value}
              onChange={setValue}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              variant="hero"
              placeholder="Search for a book title or topic…"
            />
          </div>

          {/* Suggestion tags */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <span className="text-sm text-slate-500">Try searching:</span>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleSuggestion(tag)}
                  className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How TrueRead works */}
      <section
        className="mx-auto w-full max-w-5xl px-4 py-16 md:py-20"
        aria-labelledby="how-heading"
      >
        <h2
          id="how-heading"
          className="text-center text-sm font-semibold uppercase tracking-wide text-blue-600"
        >
          How TrueRead works
        </h2>

        <div className="mt-8 flex flex-col items-stretch gap-4 md:flex-row md:items-center">
          {STEPS.map((step, i) => (
            <React.Fragment key={step.title}>
              <div className="flex-1 rounded-2xl bg-white p-6 ring-1 ring-slate-200/70 trueread-shadow-card">
                <span className="inline-flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <step.icon className="size-6" strokeWidth={2} />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{step.desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="hidden items-center justify-center md:flex">
                  <ChevronRight className="size-5 text-slate-300" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>
    </div>
  )
}

export default HomeView
