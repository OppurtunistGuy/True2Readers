# Task 1-a — full-stack-developer (backend)

## Files created
- `/home/z/my-project/src/lib/google-books.ts` — server-only Google Books REST integration (mapVolume, isTitleMatch, in-memory cache, searchBooks, decideMode).
- `/home/z/my-project/src/app/api/books/search/route.ts` — Next.js 16 Route Handler (`GET`), conforms to `SearchResponse` from `@/components/trueread/types`.

## Contract conformance
- Imports `Book`, `SearchResponse` from `@/components/trueread/types` — single source of truth. Did NOT duplicate or modify the shared types.
- `mapVolume` defensively fills every field of `Book` (title fallback 'Untitled', authors fallback [], year via `/^(\d{4})/`, cover prefers extraLarge→large→medium→thumbnail→smallThumbnail with http→https, previewSnippet kept raw with `<em>` tags, pageCount/rating as `number | null`, embeddable/viewability from accessInfo).
- `isTitleMatch`: normalize → exact → substring (shorter side >= 3) → token-Jaccard >= 0.6.
- In-memory cache: key `${query}::${startIndex}::${maxResults}`, TTL 600_000ms, module-level Map.
- `searchBooks`: clamps maxResults to 1..40, no `langRestrict`, appends `&key=` if `GOOGLE_BOOKS_API_KEY` is set, `fetch(url, { next: { revalidate: 600 } })`, throws on fetch/HTTP-non-ok/JSON errors.
- `decideMode`: 0 → genre/null; 1 → title/results[0]; >1 → title iff isTitleMatch(query, results[0].title).
- Route: 400 on missing/empty `q`; trims; clamps startIndex>=0, maxResults 1..40; on startIndex===0 calls decideMode, else forces genre/null; returns `Response.json(body, { headers: { 'Cache-Control': 'no-store' } })`; try/catch → 502 `{error, detail}` + console.error.

## Lint
- `bun run lint` → PASS (0 errors, 0 warnings).

## Smoke test (live dev server on :3000)
- `GET /api/books/search?q=` → 400 `{"error":"Missing query parameter \"q\""}` ✓
- `GET /api/books/search?maxResults=2` (no q) → 400 ✓
- `GET /api/books/search?q=atomic%20habits&maxResults=3` → 502 `{"error":"Failed to fetch books","detail":"Google Books responded with HTTP 429 Too Many Requests"}` — error-handling path confirmed; Google is rate-limiting the sandbox egress IP. Setting `GOOGLE_BOOKS_API_KEY` would raise the quota. The lib code is correct.

## Notes for downstream agents
- `previewSnippet` may contain raw `<em>...</em>` tags — render with `dangerouslySetInnerHTML` or strip deliberately.
- `cover` is always `https://` when present.
- `pageCount` / `rating` are `number | null` (not undefined) per the shared type.
- Frontend should gracefully handle 502 `{error, detail}` (e.g. retry button / friendly message).
