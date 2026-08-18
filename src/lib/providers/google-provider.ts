/**
 * Google Books Provider Implementation for True2Readers.
 */

import type { Book } from '@/components/trueread/types'
import type { IBookProvider, ProviderSearchResult } from './types'

export function splitTitleAndSubtitle(rawTitle: string, rawSubtitle?: string): { title: string; subtitle?: string } {
  let title = rawTitle.trim()
  let subtitle = rawSubtitle?.trim()

  if (!subtitle && title.includes(': ')) {
    const parts = title.split(': ')
    title = parts[0].trim()
    subtitle = parts.slice(1).join(': ').trim()
  } else if (!subtitle && title.includes(' - ')) {
    const parts = title.split(' - ')
    title = parts[0].trim()
    subtitle = parts.slice(1).join(' - ').trim()
  }

  return { title, subtitle: subtitle || undefined }
}

export function mapGoogleVolume(volume: any): Book {
  const volumeInfo = volume?.volumeInfo ?? {}
  const accessInfo = volume?.accessInfo ?? {}
  const searchInfo = volume?.searchInfo ?? {}

  const rawTitle = typeof volumeInfo.title === 'string' && volumeInfo.title.trim().length > 0
    ? volumeInfo.title
    : 'Untitled'
  const rawSubtitle = typeof volumeInfo.subtitle === 'string' && volumeInfo.subtitle.trim().length > 0
    ? volumeInfo.subtitle
    : undefined

  const { title, subtitle } = splitTitleAndSubtitle(rawTitle, rawSubtitle)

  const authors: string[] = Array.isArray(volumeInfo.authors)
    ? volumeInfo.authors.filter((a: unknown) => typeof a === 'string' && a.length > 0)
    : []

  let year: string | null = null
  if (typeof volumeInfo.publishedDate === 'string') {
    const match = volumeInfo.publishedDate.match(/^(\d{4})/)
    if (match) year = match[1]
  }

  let cover: string | undefined
  const imageLinks = volumeInfo.imageLinks
  if (imageLinks && typeof imageLinks === 'object') {
    const candidates = [
      imageLinks.extraLarge,
      imageLinks.large,
      imageLinks.medium,
      imageLinks.thumbnail,
      imageLinks.smallThumbnail,
    ]
    for (const c of candidates) {
      if (typeof c === 'string' && c.length > 0) {
        cover = c.replace(/^http:\/\//i, 'https://')
        break
      }
    }
  }

  const description: string | undefined =
    typeof volumeInfo.description === 'string' && volumeInfo.description.length > 0
      ? volumeInfo.description
      : undefined

  const previewSnippet: string | undefined =
    typeof searchInfo.textSnippet === 'string' && searchInfo.textSnippet.length > 0
      ? searchInfo.textSnippet
      : undefined

  const previewLink: string | undefined =
    (typeof volumeInfo.previewLink === 'string' && volumeInfo.previewLink.length > 0
      ? volumeInfo.previewLink
      : undefined) ??
    (typeof accessInfo.webReaderLink === 'string' && accessInfo.webReaderLink.length > 0
      ? accessInfo.webReaderLink
      : undefined)

  const categories: string[] | undefined = Array.isArray(volumeInfo.categories)
    ? volumeInfo.categories.filter((c: unknown) => typeof c === 'string' && c.length > 0)
    : undefined

  let isbn10: string | undefined
  let isbn13: string | undefined
  let primaryIsbn: string | undefined

  if (Array.isArray(volumeInfo.industryIdentifiers)) {
    for (const idObj of volumeInfo.industryIdentifiers) {
      if (idObj?.type === 'ISBN_13' && typeof idObj.identifier === 'string') {
        isbn13 = idObj.identifier.replace(/[^0-9X]/gi, '')
        primaryIsbn = primaryIsbn ?? isbn13
      } else if (idObj?.type === 'ISBN_10' && typeof idObj.identifier === 'string') {
        isbn10 = idObj.identifier.replace(/[^0-9X]/gi, '')
        primaryIsbn = primaryIsbn ?? isbn10
      }
    }
  }

  const pageCount = typeof volumeInfo.pageCount === 'number' && volumeInfo.pageCount > 0
    ? volumeInfo.pageCount
    : null

  return {
    id: typeof volume?.id === 'string' ? volume.id : `gb_${Math.random().toString(36).slice(2)}`,
    title,
    subtitle,
    authors,
    year,
    cover,
    description,
    previewSnippet,
    previewLink,
    categories,
    publisher: typeof volumeInfo.publisher === 'string' ? volumeInfo.publisher : undefined,
    pageCount,
    isbn: primaryIsbn,
    isbn10,
    isbn13,
    enrichmentStatus: 'none',
    descriptionSource: 'google',
    coverSource: cover ? 'google' : undefined,
    isbnSource: primaryIsbn ? 'google' : undefined,
    rating: typeof volumeInfo.averageRating === 'number' ? volumeInfo.averageRating : null,
    embeddable: typeof accessInfo.embeddable === 'boolean' ? accessInfo.embeddable : undefined,
    viewability: typeof accessInfo.viewability === 'string' ? accessInfo.viewability : undefined,
  }
}

export class GoogleBooksProvider implements IBookProvider {
  name = 'google' as const

  isConfigured(): boolean {
    return true
  }

  async search(query: string, startIndex: number = 0, maxResults: number = 24): Promise<ProviderSearchResult> {
    const url = new URL('https://www.googleapis.com/books/v1/volumes')
    url.searchParams.set('q', query)
    url.searchParams.set('startIndex', String(startIndex))
    url.searchParams.set('maxResults', String(maxResults))
    url.searchParams.set('printType', 'books')

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) {
      throw new Error(`Google Books API HTTP ${res.status}`)
    }

    const data = await res.json()
    const items = Array.isArray(data.items) ? data.items : []
    const results = items.map(mapGoogleVolume)
    const totalItems = typeof data.totalItems === 'number' ? data.totalItems : results.length

    return {
      results,
      totalItems,
      source: 'google',
    }
  }
}
