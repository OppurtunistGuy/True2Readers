import { CURATED_READER_EXPERIENCES } from '@/lib/reader-experiences'
import { FAQ, homeJsonLd, jsonLdString } from '@/lib/seo'

/**
 * Plain, readable text under the mood quiz: what the site is, the questions
 * readers ask, and the books currently on the shelf. It is rendered on the
 * server, so search engines and AI crawlers receive it in the HTML without
 * running any JavaScript. It also carries the page's structured data.
 * No hooks: this must stay a server-renderable component.
 */
export function DiscoverIntro() {
  return (
    <section
      id="questions"
      aria-labelledby="questions-heading"
      className="mx-auto w-full max-w-3xl px-4 pb-16 pt-4 sm:px-6"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(homeJsonLd()) }}
      />

      <h2 id="questions-heading" className="text-xl font-bold tracking-tight text-slate-900">
        Questions readers ask
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        True2Readers helps you choose a book by how it reads, not just by its cover and blurb. Pick a mood above, or
        search any book, and see its pacing, writing style, effort and who it may not suit.
      </p>

      <dl className="mt-6 space-y-5">
        {FAQ.map(({ q, a }) => (
          <div key={q}>
            <dt className="text-sm font-semibold text-slate-900">{q}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-slate-600">{a}</dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-10 text-base font-semibold text-slate-900">On the shelf right now</h3>
      <p className="mt-1 text-sm text-slate-600">
        These {CURATED_READER_EXPERIENCES.length} books have hand-written reading-experience notes.
      </p>
      <ul className="mt-3 grid gap-x-8 gap-y-1.5 text-sm text-slate-700 sm:grid-cols-2">
        {CURATED_READER_EXPERIENCES.map((p) => (
          <li key={p.bookKey}>
            <span className="font-medium text-slate-900">{p.title}</span>, {p.author}
          </li>
        ))}
      </ul>
    </section>
  )
}
