# True2Readers — Change Log

All notable changes, iterations, and feature implementations to the True2Readers application are documented in this file.

---

## [Unreleased] — Removal of Excerpt Section & Cleaned Center Column Flow

### 1. Removal of Excerpt Section ([`detail-view.tsx`](file:///c:/Users/vp124/Downloads/True2Readers/src/components/trueread/detail-view.tsx))
- **Section Removal**: Removed the `"Actual Book Excerpt"` / Preview section entirely from the center column as requested.
- **Streamlined Hierarchy**:
  1. **What this book is about** (Concise 80–120 word cleaned overview with `Based on available book metadata and publisher information.`)
  2. **Why it may interest you** (3 evidence-based highlights with `Based on available book metadata and publisher information.`)
  3. **Reading Feel / AI-Style Breakdown — Mock** (Mock breakdown clearly labeled `Mock analysis — not a real AI call.`)
  4. **True2Readers Reader Feedback** (`How readers experience this book` with live DB submission count)

### 2. Description Cleaning & Overview Processing (`extractOverview`)
- **80–120 Word Target**: Processed raw descriptions into a concise 80–120 word overview ending strictly at a sentence boundary.
- **Fluff Removal**: Stripped marketing copy, bestseller claims, copy sales numbers (*"Over 10 million copies sold"*), promotional boilerplate, and review quotes.
- **Single Source Priority**: Uses best single description (Google Books $\rightarrow$ Apple Books $\rightarrow$ Open Library) without concatenating multiple sources.

---

## [Previous Iteration] — Provider Architecture, Split Subtitle, Fast Search & Adaptive UI Trust Rules

### 1. Provider Pattern & Fast Search Performance (`src/lib/providers/`)
- **`IBookProvider` Interface**: Created modular provider contracts (`GoogleBooksProvider`, `AppleBooksProvider`, `OpenLibraryProvider`, `ISBNdbProvider`).
- **Fast Search Execution**: Search queries query Google Books (or Apple fallback) and return search results **instantly** without delaying search with bulk 3rd-party enrichment API calls.
- **On-Demand Enrichment (`/api/books/[id]/enrich`)**: Selected books trigger async Open Library enrichment via ISBN-10 / ISBN-13 on-demand when opening the detail view.
