/**
 * Affiliate link generator utility for True2Readers.
 * Appends platform-specific affiliate tracking parameters to store URLs.
 */

const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'true2readers-20'
const APPLE_TAG = process.env.NEXT_PUBLIC_APPLE_AFFILIATE_TAG || ''

import type { BookSource } from '@/components/trueread/types'

export interface BookAffiliateParams {
  title: string
  author?: string
  isbn?: string
  previewLink?: string
  source?: BookSource
}

/**
 * Generate an Amazon affiliate link for a given book.
 * If ISBN exists, links to DP page; otherwise generates a targeted Amazon Books search query with `tag=...`.
 */
export function getAmazonAffiliateLink({ title, author, isbn }: BookAffiliateParams): string {
  const query = `${title} ${author ?? ''}`.trim()
  const encodedQuery = encodeURIComponent(query)

  if (isbn) {
    const cleanIsbn = isbn.replace(/[^0-9X]/gi, '')
    return `https://www.amazon.com/dp/${cleanIsbn}?tag=${AMAZON_TAG}`
  }

  return `https://www.amazon.com/s?k=${encodedQuery}&i=stripbooks&tag=${AMAZON_TAG}`
}

/**
 * Generate an Apple Books affiliate link using Apple Performance Partners program (`at=...`).
 */
export function getAppleAffiliateLink({ title, author, previewLink, source }: BookAffiliateParams): string {
  let url = source === 'apple' && previewLink
    ? previewLink
    : `https://books.apple.com/us/search?term=${encodeURIComponent(title + ' ' + (author ?? ''))}`

  if (APPLE_TAG) {
    const separator = url.includes('?') ? '&' : '?'
    url = `${url}${separator}at=${APPLE_TAG}`
  }

  return url
}

/**
 * Generate a Google Books link with UTM / Partner tracking parameters.
 */
export function getGoogleAffiliateLink({ title, previewLink, source }: BookAffiliateParams): string {
  let url = source === 'google' && previewLink
    ? previewLink
    : `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(title)}`

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}utm_source=true2readers&utm_medium=affiliate`
}
