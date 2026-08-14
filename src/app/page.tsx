'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/trueread/logo'
import { HomeView } from '@/components/trueread/home-view'
import { ResultsView } from '@/components/trueread/results-view'
import { DetailView } from '@/components/trueread/detail-view'
import { Footer } from '@/components/trueread/footer'
import type { Book, BookSource, SearchResponse } from '@/components/trueread/types'

const MAX_RESULTS = 24

type View =
  | { name: 'home' }
  | {
      name: 'results'
      query: string
      results: Book[]
      totalItems: number
      page: number
      source: BookSource
    }
  | { name: 'detail'; book: Book; source: BookSource }

interface LastResults {
  query: string
  results: Book[]
  totalItems: number
  page: number
  source: BookSource
}

export default function Page() {
  const [view, setView] = React.useState<View>({ name: 'home' })
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const lastResultsRef = React.useRef<LastResults | null>(null)
  // Tracks the source of the most recent search so a card click (which only
  // receives a Book) can still carry the correct source into the detail view.
  const sourceRef = React.useRef<BookSource>('google')

  // Scroll to top on view changes (home↔results↔detail, including pagination).
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [view])

  const handleSearch = React.useCallback(async (q: string, page = 1) => {
    const query = q.trim()
    if (query.length === 0) {
      lastResultsRef.current = null
      setError(null)
      setView({ name: 'home' })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        q: query,
        startIndex: String((page - 1) * MAX_RESULTS),
        maxResults: String(MAX_RESULTS),
      })
      const res = await fetch(`/api/books/search?${params.toString()}`)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`)
      }
      const data = (await res.json()) as SearchResponse

      // Validate the basic shape — defensive against a malformed backend response.
      if (!data || typeof data !== 'object' || !Array.isArray(data.results)) {
        throw new Error('Malformed response from server.')
      }

      // Track the real data source (google | apple) for transparent attribution.
      sourceRef.current = data.source ?? 'google'

      if (data.mode === 'title' && data.bestMatch) {
        // Specific title match — jump straight to detail, clear last results.
        lastResultsRef.current = null
        setView({ name: 'detail', book: data.bestMatch, source: sourceRef.current })
      } else {
        // Genre / topic browse — show results grid, store for "back from detail".
        const snapshot: LastResults = {
          query: data.query || query,
          results: data.results,
          totalItems: data.totalItems ?? 0,
          page,
          source: sourceRef.current,
        }
        lastResultsRef.current = snapshot
        setView({
          name: 'results',
          query: snapshot.query,
          results: snapshot.results,
          totalItems: snapshot.totalItems,
          page: snapshot.page,
          source: snapshot.source,
        })
      }
    } catch (err) {
      console.error('[TrueRead] search failed:', err)
      setError('Something went wrong while searching. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSelectBook = React.useCallback((book: Book) => {
    setView({ name: 'detail', book, source: sourceRef.current })
  }, [])

  const handleBackFromDetail = React.useCallback(() => {
    const last = lastResultsRef.current
    if (last) {
      setView({
        name: 'results',
        query: last.query,
        results: last.results,
        totalItems: last.totalItems,
        page: last.page,
        source: last.source,
      })
    } else {
      setView({ name: 'home' })
    }
  }, [])

  const handleBackFromResults = React.useCallback(() => {
    lastResultsRef.current = null
    setError(null)
    setView({ name: 'home' })
  }, [])

  const handleLogoClick = React.useCallback(() => {
    lastResultsRef.current = null
    setError(null)
    setView({ name: 'home' })
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
      {/* Global sticky header — minimal: logo + Google Books badge */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
          <Logo size="md" onClick={handleLogoClick} />
          <Badge
            variant="outline"
            className="hidden border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 sm:inline-flex"
          >
            Powered by Google Books API
          </Badge>
        </div>
      </header>

      {/* Main view */}
      <main className="flex-1">
        {view.name === 'home' && (
          <HomeView onSearch={handleSearch} isLoading={isLoading} />
        )}

        {view.name === 'results' && (
          <ResultsView
            query={view.query}
            results={view.results}
            totalItems={view.totalItems}
            page={view.page}
            maxResults={MAX_RESULTS}
            source={view.source}
            isLoading={isLoading}
            error={error}
            onSearch={(q) => handleSearch(q, 1)}
            onSelectBook={handleSelectBook}
            onPageChange={(p) => handleSearch(view.query, p)}
            onBack={handleBackFromResults}
          />
        )}

        {view.name === 'detail' && (
          <DetailView
            book={view.book}
            source={view.source}
            backLabel={lastResultsRef.current ? 'Back to results' : 'Back to home'}
            onBack={handleBackFromDetail}
            onSearch={(q) => handleSearch(q, 1)}
          />
        )}
      </main>

      {/* Sticky footer — pushed down naturally by flex-col + mt-auto */}
      <Footer className="mt-auto" />
    </div>
  )
}
