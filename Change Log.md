# True2Readers — Change Log

All notable changes, iterations, and feature implementations to the True2Readers application are documented in this file.

---

## [Unreleased] — 3-State Preview Engine, Cleaned Overview & Pixel-Perfect Detail View Hierarchy

### 1. 3-State Preview Engine ([`detail-view.tsx`](file:///c:/Users/vp124/Downloads/True2Readers/src/components/trueread/detail-view.tsx))
- **State A (Google Books Sample Available)**: When `embeddable` is true or viewability is `PARTIAL`/`ALL_PAGES`, displays sample viewer container labeled `Book Preview` / `Google Books · Sample available`.
- **State B (Text Snippet Only)**: Renders text snippet labeled `Preview snippet`.
- **State C (No Preview)**: Renders compact `Preview unavailable` card (*"Google Books does not provide a readable preview snippet for this title."*).
- **Label Cleanup**: Removed misleading hardcoded page range labels like `"Pages 1–15"`. Total page count stays strictly under Book Details on the left panel.

### 2. Description Cleaning & Overview Processing (`extractOverview`)
- **80–120 Word Target**: Processed raw descriptions into a concise 80–120 word overview ending strictly at a sentence boundary.
- **Fluff Removal**: Stripped marketing copy, bestseller claims, copy sales numbers (*"Over 10 million copies sold"*), promotional boilerplate, and review quotes.
- **Single Source Priority**: Uses best single description (Google Books $\rightarrow$ Apple Books $\rightarrow$ Open Library) without concatenating multiple sources.

### 3. Pixel-Perfect Layout Alignment
- **Center Column**: 1. What this book is about $\rightarrow$ 2. Book Preview $\rightarrow$ 3. Why it may interest you (3 items with icon + label + description + `Based on available book metadata and publisher information.`) $\rightarrow$ 4. AI-Style Breakdown — Mock $\rightarrow$ 5. How readers experience this book.
- **Right Column**: 1. Where to get this book (Amazon, Apple Books, Google Books) $\rightarrow$ 2. About the Author $\rightarrow$ 3. Our Commitment (*"We show information as it is provided by trusted sources. We do not fabricate previews, reviews, or data."*).

---

## [Previous Iteration] — Provider Architecture, Split Subtitle, Fast Search & Adaptive UI Trust Rules

### 1. Provider Pattern & Fast Search Performance (`src/lib/providers/`)
- **`IBookProvider` Interface**: Created modular provider contracts (`GoogleBooksProvider`, `AppleBooksProvider`, `OpenLibraryProvider`, `ISBNdbProvider`).
- **Fast Search Execution**: Search queries query Google Books (or Apple fallback) and return search results **instantly** without delaying search with bulk 3rd-party enrichment API calls.
- **On-Demand Enrichment (`/api/books/[id]/enrich`)**: Selected books trigger async Open Library enrichment via ISBN-10 / ISBN-13 on-demand when opening the detail view.
- **ISBNdb Preparedness**: Created `ISBNdbProvider` adapter interface, disabled gracefully when API credentials are not set.
