# Task 1-b — full-stack-developer (frontend)

Task: TrueRead frontend — components + page.tsx state machine (Home → Results → Detail), Prototype 2 visual spec.

## Work Log
- Read project context: `worklog.md`, shared `types.ts` (`Book`, `SearchResponse`), shadcn UI components (`button`, `input`, `badge`, `skeleton`, `select`, `alert`), `globals.css` (verified `trueread-aurora`, `trueread-shadow-soft`, `trueread-shadow-card` utilities already present).
- Read backend module `src/lib/google-books.ts` to confirm the contract: `mapVolume`, `decideMode` (title vs genre), `searchBooks`. The API route at `/api/books/search` is owned by Task 1-a — frontend calls it via relative path with no port.
- Created 11 files under `src/components/trueread/` plus rewrote `src/app/page.tsx`.
- Locked visual spec: navy `#0F172A` (slate-900), blue `#2563EB` (blue-600), bg `#F8FAFC` (slate-50), blue tint `#EFF6FF` (blue-50). No indigo/purple/violet anywhere (verified via grep).
- All interactive components are `'use client'`; pure helpers (`mock-ai.ts`, `footer.tsx`) are server-compatible.
- Cover images use `next/image` with `unoptimized` + `referrerPolicy="no-referrer"` so external Google Books cover URLs work without next.config domain whitelisting.
- Preview snippets containing `<em>...</em>` highlight tags are rendered via a safe `renderSnippet()` helper that splits on `/(<\/?em>)/` and wraps highlighted text in `<mark className="bg-blue-100 text-blue-900">` — no `dangerouslySetInnerHTML`.
- Mock AI breakdown uses a deterministic FNV-1a hash of `book.id` so the same book always yields the same Pacing/Tone/Dialogue values.

## Files Created
1. `src/components/trueread/logo.tsx` — TrueRead wordmark (button when onClick provided, sm/md/lg sizes).
2. `src/components/trueread/search-bar.tsx` — Hero + compact variants, Loader2 spinner on loading, Enter/button submit, role="search" + sr-only label.
3. `src/components/trueread/cover-image.tsx` — next/image (unoptimized) cover with navy gradient + BookMarked fallback.
4. `src/components/trueread/book-card.tsx` — `<button>` card with hover lift, line-clamped title/author/year.
5. `src/components/trueread/mock-ai.ts` — deterministic FNV-1a hash → Pacing/Tone/Dialogue levels.
6. `src/components/trueread/ai-breakdown.tsx` — Sparkles header + Mock badge + 3 segmented progress rows + disclaimer.
7. `src/components/trueread/home-view.tsx` — Hero (aurora bg), SearchBar hero, suggestion pills, 3-step "How TrueRead works".
8. `src/components/trueread/results-view.tsx` — Back+search header, results header w/ sort Select, skeleton/empty/error states, responsive grid, capped pagination (8 pages, 5 visible).
9. `src/components/trueread/detail-view.tsx` — 3-col responsive card (cover | meta+preview | breakdown), safe `<em>` highlight rendering, optional "About this book" collapsible.
10. `src/components/trueread/footer.tsx` — Sticky Google Books attribution footer.
11. `src/app/page.tsx` — `'use client'` state machine (home/results/detail), `lastResults` ref for back-from-detail, smooth scroll-to-top on view change, defensive response validation.

## Lint Result
`bun run lint` → exit 0, no errors, no warnings. All clean.

## Risks / Notes
- Backend `/api/books/search` returns 502 when Google Books rate-limits (HTTP 429) — surfaced as the friendly "Something went wrong" Alert in ResultsView. Not a frontend bug.
- The sort in ResultsView is intentionally client-side on the current page only (per spec).
- `lastResultsRef` is a `useRef` (not state) so it doesn't trigger re-renders; back-from-detail reads the latest value synchronously.
- The "About this book" block only renders when there's no `previewSnippet` (per spec) to avoid duplicating content that's already in the preview.
