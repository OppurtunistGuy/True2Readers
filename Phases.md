# TrueRead — Build Specification (Phases)

> Single-page book discovery app. Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui.
> Core loop: **Home → Search → Results grid → Book Detail**.
> Visual style locked to **Prototype 2** (navy `#0F172A` + blue `#2563EB`, slate-50 bg, NO indigo/purple).

---

## Phase 1 — Core single-page experience (COMPLETE)

### Scope
Single-page experience (no new page routes, no reloads). State machine: Home → Results → Detail.

### Home
- TrueRead branding (book + sparkles icon; "True" navy + "Read" blue)
- One prominent search box (accepts a specific title OR a genre/topic)
- Suggestion tags ("Atomic Habits", "self-help", "Fantasy", ...)
- "How TrueRead works" 3-step section (Search / Select / Understand)

### Search behavior
- Specific title match → skip straight to Book Detail (single best match)
- Genre/topic → Results grid (cover, title, author, year)
- Both use Google Books API (real metadata only — never fabricated)

### Results grid
- Responsive grid, simple sort (Relevance/Newest/Oldest on the page)
- Simple pagination (Prev/Next + page numbers)
- Decade jump-bar (client-side filter)
- List view + Grid view toggle

### Book Detail
- Large white card, 3-column responsive layout (cover | meta+preview | AI breakdown)
- Real Google Books preview text (or "No preview available" empty state)
- Mock AI-style breakdown (Pacing, Tone, Dialogue, Complexity) — deterministic, clearly labeled "MOCK"
- Cover lightbox (click to zoom)
- "More from this author" auto-section
- Source attribution (Google Books / Apple Books)

### Backend API
- `GET /api/books/search?q=<query>&startIndex=<n>&maxResults=<n>`
- Google Books API as primary data source
- Transparent Apple Books (iTunes Search API) fallback when Google Books is environmentally unavailable (sandbox shared-IP → HTTP 429)
- Response shape: `{ query, mode: 'title'|'genre', bestMatch, results, totalItems, startIndex, maxResults, source: 'google'|'apple' }`

---

## Phase 2 — Polish & progressive enhancements (COMPLETE)

### Discovery features
- Search autocomplete dropdown (curated titles + genres + recent searches)
- "Surprise me" button (curated list of 20 real genres, no repeat)
- Mood Match (8 mood → genre chips: Cozy, Thrilling, Romantic, Mind-bending, Epic, Educational, Dark, Whimsical)
- Recently viewed books strip (localStorage, capped at 8)
- Clickable author links → `author:Name` search
- "Find similar books" CTA (uses book's first category)
- "More from this author" auto-section

### Book Detail insights (all real-derived, no fabrication)
- Reading time estimate (from real pageCount)
- Reading sessions breakdown (Pomodoro-style, from real pageCount)
- Personalized reading pace calculator (WPM slider, from real pageCount)
- Book age pill ("Published N years ago", from real publishedDate)
- Cover palette (3 dominant colors extracted client-side from real cover image via canvas)
- Themes & keywords cloud (top 8 words from real description, stopword-filtered)
- **Reading difficulty** (1-5 score from avg word length + avg sentence length of real description) — Phase 2 round 8

### Reading list (localStorage, survives reload)
- Slide-out panel with mini covers + titles + authors
- Per-book "Mark as read" toggle (records ISO timestamp)
- Read-status filter (All / Read / Unread) with live counts
- View toggle: List | By category (grouped by primary category)
- Reading goal progress bar (X/20 books)
- Est. reading time (sum of real page counts)
- "Copy all titles" export to clipboard
- "Mark as read" badge (emerald) + cover ring + tinted row background

### Results page filters
- Decade jump-bar (client-side, from real years)
- Rating filter (Any / 4+ stars / 3+ stars, from real ratings)
- **Book length filter** (Any / Short <300p / Medium 300–600p / Long >600p, from real pageCount) — Phase 2 round 8
- Combined empty state with smart copy + "Clear filters" button

### Compare mode
- Toggle compare mode in results header
- Select up to 3 books (compare-select badge on each card)
- Side-by-side modal: Rating, Pages, Reading Time, Published year, + 4 AI breakdown metrics
- Each metric row highlights the "winner" with a blue badge + checkmark

### Reading mode
- Full-screen distraction-free overlay for the preview/description text
- Drop cap, larger text, body scroll locked
- Closes on Esc / backdrop click / minimize button

### Keyboard shortcuts
- `/` → focus home search
- `Esc` → go back / close dialog / close panel
- `?` → toggle keyboard help overlay
- `B` → toggle bookmark (detail view)
- `R` → toggle reading mode (detail view)
- `P` → print / save as PDF (detail view)
- `C` → open pace calculator (detail view)
- `M` → toggle mark as read (detail view) — Phase 2 round 8
- `↑↓←→` → navigate result cards (results grid)
- `Enter` → open focused card
- `Home` / `End` → jump to first / last card

### Print / Save as PDF
- Native browser print dialog with comprehensive @media print CSS
- Hides all chrome (header, footer, search, chips, floating buttons)
- Renders only the book detail article (cover + title + author + meta + preview + breakdown)

### Transparency / source attribution
- "Google Books is temporarily unavailable..." banner when Apple Books fallback is active
- Per-book source attribution (Google Books / Apple Books)
- "Real data, always" trust section on home (3 items)

---

## Styling & Visual Polish

### Color palette (locked — Prototype 2)
- Page bg: `#F8FAFC` (slate-50)
- Card / surface: `#FFFFFF`
- Navy (headings, "True" in logo): `#0F172A` (slate-900)
- Blue (primary — "Read" in logo, buttons, links, active bars): `#2563EB` (blue-600)
- Blue tint (icon containers, suggestion tags): `#EFF6FF` (blue-50)
- Secondary text: `#64748B` (slate-500)
- Muted text: `#94A3B8` (slate-400)
- Border: `#E2E8F0` (slate-200)
- Font: Inter (geometric sans-serif)
- Soft diffused shadows, generous whitespace, rounded corners (8–16px)
- **NO indigo/purple. Navy + blue only.**

### Custom CSS utilities (in globals.css)
- `.trueread-aurora` — subtle cool radial wash behind hero
- `.trueread-grid` — faint dotted texture
- `.trueread-shadow-soft` / `.trueread-shadow-card` / `.trueread-shadow-lift` — soft layered shadows
- `.trueread-shimmer` — loading skeleton shimmer
- `.trueread-dropcap` — drop cap for first letter of preview
- `.trueread-float-slow` / `.trueread-float-slower` — subtle floating animation for hero accents
- `.trueread-glow` — pulse glow for interactive elements
- `.trueread-slide-in-right` — slide-in for reading list panel
- `.trueread-badge-bounce` — badge bounce for count updates
- `.trueread-progress-bar` — slim top loading indicator with shimmer
- `.trueread-card-hover` — card hover lift + glow
- `.trueread-chip-focus` / `.trueread-chip-hover` — chip hover/focus polish
- `.trueread-focus` — consistent focus-visible ring (blue-500)
- `.trueread-hero-mesh` — animated multi-radial-gradient hero background
- `.trueread-scroll-x` — slim horizontal scrollbar for strips
- `.trueread-cta-shine` — animated gradient border shine on primary CTAs (Phase 2 round 8)
- `.trueread-cover-glow` — ambient blue radial behind book covers (Phase 2 round 8)
- `.trueread-heading-balance` / `.trueread-heading-pretty` — balanced text wrapping for headings (Phase 2 round 8)

### Animations (Framer Motion)
- View transitions (home ↔ results ↔ detail) with opacity + y translate
- Staggered card entrances in results grid
- Staggered mood chip entrances
- Reading list panel slide-in (spring)
- AnimatePresence for overlays (lightbox, reading mode, compare modal, keyboard help, pace calculator, quote of the day)
- Count-up animation for result count
- Cover image loading shimmer with cross-fade
- Scroll progress bar (detail view)

### Responsive design
- Mobile-first with Tailwind responsive prefixes (sm/md/lg/xl)
- Grid: 2 cols mobile → 3 cols sm → 4 cols lg → 5 cols xl
- Touch-friendly: minimum 44px touch targets
- Kbd hints hidden on mobile to save space
- Sticky header with glass morphism (backdrop-blur)
- Sticky footer pushed down naturally by flex-col + mt-auto

### Accessibility
- Semantic HTML (main, header, nav, section, article, dialog)
- ARIA labels on all icon-only buttons
- Screen reader text (sr-only) where needed
- Alt text on all images
- Keyboard navigation throughout
- Focus-visible rings locked to blue-500
- prefers-reduced-motion respected (animations disabled)

---

## Data sources (real, no fabrication)

### Primary: Google Books API
- `https://www.googleapis.com/books/v1/volumes?q=<query>&startIndex=<n>&maxResults=<n>`
- Returns: title, authors, publishedDate, description, cover, categories, publisher, pageCount, averageRating, previewSnippet, previewLink
- Title detection: if the query is quoted or matches a known title pattern, treat as title search (mode='title', bestMatch = results[0])

### Fallback: Apple Books (iTunes Search API)
- `https://itunes.apple.com/search?term=<query>&entity=ebook&limit=<n>`
- Activated transparently when Google Books returns HTTP 429 (shared-IP quota exhaustion in sandbox)
- Returns: title, authors, publishedDate, cover, categories, description (no previewSnippet, no pageCount, no ratings)
- Detail view shows "No preview available" empty state for Apple Books books

### localStorage keys (versioned)
- `trueread:recent:v1` — recent searches (max 6)
- `trueread:reading-list:v1` — saved books (max 30)
- `trueread:recently-viewed:v1` — recently viewed books (max 8)
- `trueread:read-books:v1` — mark-as-read records (book id → ISO timestamp)
- `trueread:pace:v1` — personalized reading pace (WPM)
- `trueread:reading-list-view:v1` — list view mode preference (list | category)

---

## File structure

```
src/
├── app/
│   ├── page.tsx                      # Single user-visible route — state machine
│   ├── globals.css                   # Tailwind + TrueRead utilities
│   └── api/books/search/route.ts     # Backend search API
├── components/
│   ├── ui/                           # shadcn/ui primitives (pre-existing)
│   └── trueread/                     # TrueRead components
│       ├── types.ts                  # Shared Book + SearchResponse types
│       ├── home-view.tsx             # Home view (hero + suggestions + mood + quote + how-it-works)
│       ├── results-view.tsx          # Results grid + filters + compare mode + pagination
│       ├── detail-view.tsx           # Book detail (cover + meta + preview + breakdown + insights)
│       ├── book-card.tsx             # Book card (grid + list variants, compare-select, focus ring)
│       ├── cover-image.tsx           # Cover image with loading shimmer
│       ├── search-bar.tsx            # Hero + compact search variants
│       ├── search-autocomplete.tsx   # Autocomplete dropdown
│       ├── search-progress.tsx       # Top loading bar
│       ├── scroll-progress.tsx       # Detail page scroll progress
│       ├── scroll-to-top.tsx         # Floating scroll-to-top button
│       ├── logo.tsx                  # TrueRead logo (animated)
│       ├── footer.tsx                # Sticky footer
│       ├── reading-list.tsx          # Slide-out panel + BookmarkButton
│       ├── reading-difficulty.tsx    # Reading difficulty chip (1-5 score) [Phase 2 r8]
│       ├── reading-insights.ts       # estimateReadingTime, getReadingSessions, getBookAge, getReadingDifficulty
│       ├── pace-calculator.tsx       # Personalized WPM modal
│       ├── themes-analyzer.ts        # extractThemes (text mining)
│       ├── themes-cloud.tsx          # Themes & keywords cloud
│       ├── cover-palette.tsx         # Canvas-based cover color extraction
│       ├── cover-lightbox.tsx        # Fullscreen cover zoom
│       ├── ai-breakdown.tsx          # Mock AI breakdown (Pacing/Tone/Dialogue/Complexity)
│       ├── mock-ai.ts                # getBreakdown (deterministic mock)
│       ├── star-rating.tsx           # Star rating display
│       ├── author-links.tsx          # Clickable author pills
│       ├── explore-related.tsx       # Related categories section
│       ├── more-from-author.tsx      # Auto author-search section
│       ├── surprise-me.tsx           # Random genre button
│       ├── recently-viewed.tsx       # Recently-viewed strip
│       ├── quote-of-the-day.tsx      # Curated real literary quotes [Phase 2 r8]
│       ├── compare-modal.tsx         # Side-by-side comparison modal
│       ├── keyboard-help.tsx         # Keyboard shortcuts overlay
│       ├── query-format.ts           # formatQueryForDisplay, isAuthorSearch
│       ├── use-local-storage.ts      # SSR-safe localStorage hook
│       └── use-count-up.ts           # requestAnimationFrame count-up hook
└── lib/
    ├── db.ts                         # Prisma client (unused — no DB in this app)
    ├── google-books.ts               # Google Books + Apple Books fetch + mapping
    └── utils.ts                      # cn() class merger
```

---

## Round history

| Round | Focus | Result |
|-------|-------|--------|
| 1 | Core Phase 1 (home/results/detail + Google Books API) | Complete |
| 2 | Apple Books fallback + Prototype 2 visual lock | Complete |
| 3 | Search autocomplete + clickable authors + toasts + progress bar + scroll-to-top + related topics | Complete |
| 4 | Compare mode + reading mode + keyboard help + rating filter + stats card | Complete |
| 5 | Cover lightbox + find-similar CTA + reading list stats + scroll progress + b/r shortcuts + showing X-Y of Z | Complete |
| 6 | Mood Match + more-from-author + localStorage persistence + arrow-key navigation | Complete |
| 7 | Surprise me + recently viewed + reading sessions + print/PDF + copy-all-titles + reading goal progress | Complete |
| 8 (this round) | Reading difficulty + quote of the day + mark-as-read + length filter + CTA shine + cover glow + heading balance | Complete |
