import { NextResponse } from 'next/server'

/**
 * DISABLED.
 *
 * This endpoint used to return review "signals" and quotes (attributed to
 * "Goodreads Verified", "Amazon Editorial", named reviewers) that were
 * generated from a hash of the book id, not fetched from any real source. That
 * contradicts the site's promise not to fabricate reviews, so it now answers
 * 410 Gone. Bring it back only when it returns real, attributable data.
 *
 * Nothing renders it: `FetchedReviewsSection` is imported but not used.
 */
export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint has been retired: it did not return real reviews.' },
    { status: 410 },
  )
}
