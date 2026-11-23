import { SITE_NAME, SITE_URL } from '@/lib/site'

/**
 * Questions shown on the home page AND published as FAQPage structured data.
 * Google requires the structured data to match text visitors can read, so both
 * come from this one list. Keep every answer true to what the site does today.
 */
export const FAQ: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: 'What is True2Readers?',
    a: 'True2Readers is a book discovery site that shows how a book reads (pacing, writing style and effort) and who it may not suit, so you can choose before you buy. There are no accounts and nothing to install.',
  },
  {
    q: 'How do I find a book that fits my mood?',
    a: 'Answer three short questions: what you want to feel, how much effort you want to spend and what matters most to you. The site matches your answers to a small set of hand-picked books. You can also search any title, author, ISBN or topic.',
  },
  {
    q: 'Where does the book information come from?',
    a: 'Titles, covers and descriptions come from Google Books, with Apple Books as a fallback and Open Library for extra details. They belong to their publishers and to those services.',
  },
  {
    q: 'Are the reader experience notes real reviews?',
    a: 'No. They are editorial notes written for a small set of well-known books, and the site labels them that way. They describe pacing, writing style, difficulty and who a book may not suit. They are not an average of reader reviews, and any section marked Mock is a placeholder.',
  },
  {
    q: 'What does potential mismatch mean?',
    a: 'It names the readers a book may not suit, for example people who dislike a slow start, so you can rule a book out before you spend time on it.',
  },
  {
    q: 'Do I need an account, and does it cost anything?',
    a: 'No account and no payment. Your saved books and recent searches stay in your own browser and are not sent to the site.',
  },
]

const DESCRIPTION =
  'Find a book by mood, then see how it reads: pacing, writing style, effort and who it may not suit.'

/** Structured data for the home page (WebSite, Organization, FAQPage). */
export function homeJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: DESCRIPTION,
        inLanguage: 'en',
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE_URL}/#faq`,
        mainEntity: FAQ.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
    ],
  }
}

/** JSON for a <script type="application/ld+json"> block; `<` is escaped so text can never close the tag. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
