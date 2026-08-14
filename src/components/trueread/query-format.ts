/**
 * Format a search query for display in the results heading.
 *
 * Handles special prefixes:
 *   - `author:Jane Doe` → `Books by Jane Doe`
 *   - Anything else → returned as-is
 *
 * This is a display-only transformation — the raw query is still sent to
 * the API (the backend understands the `author:` prefix and passes it
 * through to Google Books / Apple Books search).
 */
export function formatQueryForDisplay(query: string): string {
  const trimmed = query.trim()
  // Match `author:` prefix (case-insensitive) followed by the author name.
  const authorMatch = trimmed.match(/^author:(.+)$/i)
  if (authorMatch && authorMatch[1]) {
    const name = authorMatch[1].trim()
    if (name.length > 0) {
      return `Books by ${name}`
    }
  }
  return trimmed
}

/**
 * Check if a query is an author search (has the `author:` prefix).
 */
export function isAuthorSearch(query: string): boolean {
  return /^author:.+/i.test(query.trim())
}

/**
 * Extract the author name from an `author:` query, or null if not an author search.
 */
export function extractAuthorName(query: string): string | null {
  const match = query.trim().match(/^author:(.+)$/i)
  return match && match[1] ? match[1].trim() : null
}
