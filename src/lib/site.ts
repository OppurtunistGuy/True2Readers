/**
 * Canonical public origin of the site (no trailing slash).
 * Set NEXT_PUBLIC_SITE_URL when a custom domain is attached.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://true2readers.vercel.app'
).replace(/\/+$/, '')

export const SITE_NAME = 'True2Readers'
