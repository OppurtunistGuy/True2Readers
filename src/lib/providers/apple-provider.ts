/**
 * Apple Books / iTunes Provider Fallback Implementation for True2Readers.
 */

import type { Book } from '@/components/trueread/types'
import type { IBookProvider, ProviderSearchResult } from './types'
import { splitTitleAndSubtitle } from './google-provider'

export function mapAppleVolume(item: any): Book {
  const rawTitle = typeof item.trackName === 'string' ? item.trackName : 'Untitled'
  const { title, subtitle } = splitTitleAndSubtitle(rawTitle)

  const authors: string[] = typeof item.artistName === 'string' && item.artistName.length > 0
    ? [item.artistName]
    : []

  let year: string | null = null
  if (typeof item.releaseDate === 'string') {
    const match = item.releaseDate.match(/^(\d{4})/)
    if (match) year = match[1]
  }

  let cover: string | undefined
  if (typeof item.artworkUrl100 === 'string' && item.artworkUrl100.length > 0) {
    cover = item.artworkUrl100.replace(/\/100x100bb/i, '/600x600bb').replace(/^http:\/\//i, 'https://')
  }

  let description: string | undefined
  if (typeof item.description === 'string' && item.description.length > 0) {
    description = item.description
  }

  const categories: string[] | undefined = Array.isArray(item.genres)
    ? item.genres.filter((g: unknown) => typeof g === 'string' && g.length > 0)
    : item.primaryGenreName ? [item.primaryGenreName] : undefined

  return {
    id: item.trackId ? `apple_${item.trackId}` : `apple_${Math.random().toString(36).slice(2)}`,
    title,
    subtitle,
    authors,
    year,
    cover,
    description,
    previewLink: typeof item.trackViewUrl === 'string' ? item.trackViewUrl : undefined,
    categories,
    enrichmentStatus: 'none',
    descriptionSource: 'apple',
    coverSource: cover ? 'apple' : undefined,
  }
}

export class AppleBooksProvider implements IBookProvider {
  name = 'apple' as const

  isConfigured(): boolean {
    return true
  }

  async search(query: string, startIndex: number = 0, maxResults: number = 24): Promise<ProviderSearchResult> {
    const url = new URL('https://itunes.apple.com/search')
    url.searchParams.set('media', 'ebook')
    url.searchParams.set('entity', 'ebook')
    url.searchParams.set('term', query)
    url.searchParams.set('limit', String(Math.min(maxResults + startIndex, 50)))

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) {
      throw new Error(`Apple iTunes API HTTP ${res.status}`)
    }

    const data = await res.json()
    const resultsAll = Array.isArray(data.results) ? data.results.map(mapAppleVolume) : []
    const results = resultsAll.slice(startIndex, startIndex + maxResults)

    return {
      results,
      totalItems: typeof data.resultCount === 'number' ? data.resultCount : results.length,
      source: 'apple',
    }
  }
}
