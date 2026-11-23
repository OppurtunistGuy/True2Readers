'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Bookmark, BookOpen } from 'lucide-react'
import type { Book } from '@/components/trueread/types'
import { SearchBar } from './search-bar'
import { cn } from '@/lib/utils'
import { playPosterOpen } from '@/lib/poster-open'

/**
 * ShelfView — an alternative "bent VHS shelf" way to browse a list of books.
 *
 * It is a pure presentation layer: it receives books + callbacks and never
 * fetches anything, so the classic list views keep working untouched and the
 * user can toggle between the two on the same data.
 *
 * 3D layout is a port of the Leon Vasari film-archive shelf: every book is a
 * spine (narrow face) plus a cover (wide face turned 90deg). The book nearest
 * the current position rotates to face the viewer; the others fan away along
 * a compressed arc.
 */

export interface ShelfNote {
  why?: string
  mismatch?: string
}

export interface ShelfViewProps {
  books: Book[]
  heading: string
  subheading?: string
  chips?: string[]
  backLabel: string
  onBack: () => void
  onSelectBook: (book: Book) => void
  onSearch: (query: string) => void
  isLoading?: boolean
  bookmarkedIds: Set<string>
  onToggleBookmark: (book: Book) => void
  /** Optional curated notes shown under the caption (curated books only). */
  getNote?: (book: Book) => ShelfNote | undefined
  pagination?: {
    page: number
    totalItems: number
    maxResults: number
    onPageChange: (page: number) => void
  }
  /** Book index to start on (restores position after returning from a book). */
  initialIndex?: number
  onActiveChange?: (index: number) => void
}

const PALETTE: Array<[string, string]> = [
  ['#1d1b1a', '#efe5cf'],
  ['#2543b4', '#efe5cf'],
  ['#e2472d', '#efe5cf'],
  ['#efe5cf', '#1d1b1a'],
  ['#2f5d50', '#efe5cf'],
  ['#d9a441', '#1d1b1a'],
  ['#5a3e6b', '#efe5cf'],
]

function paletteFor(title: string): [string, string] {
  let h = 0
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

/** Best cover URL we can try: the book's own, else Open Library by ISBN (404s when unknown). */
function coverSrc(b: Book): string | undefined {
  if (b.cover) return b.cover
  const isbn = b.isbn13 || b.isbn10
  return isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false` : undefined
}

/**
 * Shelf-sized version of a cover URL. Apple artwork URLs carry their size and
 * the app asks for 600x600; the shelf only needs ~360x540, so request that
 * (a third of the bytes, and ~30 of them load at once). Others pass through.
 */
function shelfCover(b: Book, failed: Set<string>): string | undefined {
  if (failed.has(b.id)) return undefined
  const src = coverSrc(b)
  return src && src.includes('mzstatic.com') ? src.replace(/\/\d+x\d+bb(?=\.)/i, '/360x540bb') : src
}

/** Main title only ("Sapiens", not "Sapiens: A Brief History of Humankind"). */
function mainTitle(title: string): string {
  const main = title.split(/\s*[:—–]\s*|\s+-\s+|\s*\(/)[0].trim()
  return main.length >= 3 ? main : title
}
const spineTitle = (title: string) => mainTitle(title).toUpperCase()

/** Font size that fits `text` on one vertical line of the spine (about 42% of its height). */
function spineFont(text: string): string {
  const k = (0.42 / (Math.max(text.length, 4) * 0.7)).toFixed(4)
  return `clamp(calc(var(--ws) * 0.17), calc(var(--Hp) * ${k}), calc(var(--ws) * 0.34))`
}

const P = 1400 // CSS perspective in px (must match the wrapper)
const smooth = (x: number) => x * x * (3 - 2 * x)
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))

interface Metrics {
  H: number
  ws: number
  d: number
  gap: number
  U: number
  XS: number[]
}

function computeMetrics(w: number, h: number): Metrics {
  const mobile = w < 768
  const H = Math.max(160, Math.min(h * 0.8, w * (mobile ? 0.7 : 0.36)))
  const ws = (H * 142) / 840
  const d = (H * 2) / 3
  const gap = H * 0.035
  const U = H * (mobile ? 1.05 : 1.3)
  const XS: number[] = []
  let acc = 0
  for (let u = 0; u <= 3 * U; u += 2) {
    XS.push(acc)
    acc += 2 / (1 + (u / U) ** 1.6)
  }
  return { H, ws, d, gap, U, XS }
}

export function ShelfView({
  books,
  heading,
  subheading,
  chips,
  backLabel,
  onBack,
  onSelectBook,
  onSearch,
  isLoading = false,
  bookmarkedIds,
  onToggleBookmark,
  getNote,
  pagination,
  initialIndex,
  onActiveChange,
}: ShelfViewProps) {
  const n = books.length
  const onActiveRef = React.useRef(onActiveChange)
  onActiveRef.current = onActiveChange
  const areaRef = React.useRef<HTMLDivElement>(null)
  const tapeRefs = React.useRef<Array<HTMLDivElement | null>>([])
  const spineRefs = React.useRef<Array<HTMLDivElement | null>>([])
  const coverRefs = React.useRef<Array<HTMLDivElement | null>>([])
  const [active, setActive] = React.useState(0)
  const [query, setQuery] = React.useState('')
  // Books whose cover image failed to load fall back to the generated cover.
  const [failed, setFailed] = React.useState<Set<string>>(() => new Set())
  const markFailed = React.useCallback((id: string) => {
    setFailed((prev) => (prev.has(id) ? prev : new Set(prev).add(id)))
  }, [])
  // How a book opens is the reader's choice; remembered on this device.
  const [openStyle, setOpenStyle] = React.useState<'poster' | 'swing'>(() => {
    try {
      return localStorage.getItem('shelf-open-style') === 'swing' ? 'swing' : 'poster'
    } catch {
      return 'poster'
    }
  })
  const chooseOpenStyle = (s: 'poster' | 'swing') => {
    setOpenStyle(s)
    try {
      localStorage.setItem('shelf-open-style', s)
    } catch {}
  }
  const posterBusy = React.useRef(false)
  const [opening, setOpening] = React.useState<{
    book: Book
    rect: DOMRect
  } | null>(null)

  // Mutable animation state (never triggers a render).
  const st = React.useRef({
    T: 0,
    s: 0,
    tiltX: 0,
    tiltY: 0,
    mx: -9999,
    my: -9999,
    dragging: false,
    downX: 0,
    downT: 0,
    justDragged: false,
    wheelTO: 0 as unknown as ReturnType<typeof setTimeout>,
    m: computeMetrics(1200, 600),
    reduced: false,
    active: 0,
  })

  const go = React.useCallback(
    (delta: number) => {
      st.current.T = clamp(Math.round(st.current.T) + delta, 0, Math.max(0, n - 1))
    },
    [n],
  )

  const openBook = React.useCallback(
    (i: number) => {
      const base = books[i]
      if (!base) return
      // Hand the detail page the cover the shelf already loaded (curated books
      // have no cover of their own), so it doesn't show a placeholder.
      const src = failed.has(base.id) ? undefined : coverSrc(base)
      const book = !base.cover && src ? { ...base, cover: src } : base
      const el = coverRefs.current[i]
      if (st.current.reduced || !el) {
        onSelectBook(book)
        return
      }
      if (openStyle === 'poster') {
        if (posterBusy.current) return
        posterBusy.current = true
        playPosterOpen(el.getBoundingClientRect(), () => onSelectBook(book))
        window.setTimeout(() => (posterBusy.current = false), 1500)
        return
      }
      setOpening({ book, rect: el.getBoundingClientRect() })
      window.setTimeout(() => onSelectBook(book), 480)
    },
    [books, onSelectBook, failed, openStyle],
  )

  // Animation loop + layout.
  React.useEffect(() => {
    const area = areaRef.current
    if (!area) return
    st.current.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const measure = () => {
      const r = area.getBoundingClientRect()
      st.current.m = computeMetrics(r.width, r.height)
      area.style.setProperty('--Hp', `${st.current.m.H}px`)
      area.style.setProperty('--ws', `${st.current.m.ws}px`)
      area.style.setProperty('--d', `${st.current.m.d}px`)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(area)

    const xsc = (u: number) => {
      const { XS } = st.current.m
      return Math.sign(u) * XS[Math.min(XS.length - 1, Math.floor(Math.abs(u) / 2))]
    }

    let raf = 0
    let last = performance.now()
    let lastKey = ''
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const S = st.current
      const k = S.dragging ? 18 : 5.2
      S.s = S.reduced ? S.T : S.s + (S.T - S.s) * (1 - Math.exp(-k * dt))
      if (Math.abs(S.T - S.s) < 0.0004) S.s = S.T

      const idx = clamp(Math.round(S.s), 0, Math.max(0, n - 1))
      if (idx !== S.active) {
        S.active = idx
        setActive(idx)
        onActiveRef.current?.(idx)
      }

      const r0 = area.getBoundingClientRect()
      const settled = Math.abs(S.T - S.s) < 0.3
      const { H, ws, d, gap, U } = S.m
      const onCover =
        settled &&
        Math.abs(S.mx - (r0.left + r0.width / 2)) < 0.55 * d &&
        Math.abs(S.my - (r0.top + r0.height / 2)) < 0.55 * H
      const ty = onCover ? ((S.mx - (r0.left + r0.width / 2)) / (0.55 * d)) * 8 : 0
      const tx = onCover ? (-(S.my - (r0.top + r0.height / 2)) / (H / 2)) * 5 : 0
      const e7 = 1 - Math.exp(-7 * dt)
      S.tiltY += (ty - S.tiltY) * e7
      S.tiltX += (tx - S.tiltX) * e7

      const key = `${S.s.toFixed(4)}|${S.tiltX.toFixed(3)}|${S.tiltY.toFixed(3)}|${H.toFixed(1)}`
      if (key !== lastKey) {
        lastKey = key
        for (let i = 0; i < n; i++) {
          const el = tapeRefs.current[i]
          if (!el) continue
          const r = i - S.s
          const ar = Math.abs(r)
          const B = ar < 1 ? (r + Math.sin(Math.PI * r) / Math.PI) / 2 : Math.sign(r) * 0.5
          const u = r * (ws + gap) + (d - ws + 1.4 * gap) * B
          const au = Math.abs(u)
          if (au > U * 1.95) {
            el.style.visibility = 'hidden'
            continue
          }
          el.style.visibility = ''
          const o = smooth(Math.max(0, 1 - ar))
          const sc = 1 / (1 + (au / U) ** 1.6)
          const kk = 1 / sc
          const z = P * (1 - kk) + o * H * 0.1
          const x = xsc(u) * kk
          const y = (H * 0.5 * (1 - sc) * 0.42 + o * H * 0.012) * kk
          const ry = Math.sign(u) * Math.min(1, au / U) * 26 * (1 - o) - 90 * o + S.tiltY * o
          const rx = S.tiltX * o
          el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,${z.toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg)`
          el.style.zIndex = String(Math.round(3000 + z))
          spineRefs.current[i]?.style.setProperty(
            '--shade',
            Math.min(0.6, o * 0.55 + (1 - sc) * 0.32).toFixed(3),
          )
          coverRefs.current[i]?.style.setProperty('--shade', ((1 - o) * 0.82).toFixed(3))
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    // Wheel scrolling over the shelf (non-passive so the page doesn't scroll).
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const S = st.current
      const dl = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      S.T = clamp(S.T + (dl / (S.m.ws + S.m.gap)) * 0.5, 0, Math.max(0, n - 1))
      clearTimeout(S.wheelTO)
      S.wheelTO = setTimeout(() => {
        S.T = Math.round(S.T)
      }, 160)
    }
    area.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      area.removeEventListener('wheel', onWheel)
    }
  }, [n])

  // Keyboard: ← → move, Enter opens (unless typing in a field or on a button).
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      // A focused book on the shelf still takes the arrow keys (and handles Enter/Space itself).
      const onItem = !!t?.closest('[data-shelf-item]')
      if (!onItem && t && (t.closest('input,textarea,select,button,a,[contenteditable]') || t.isContentEditable)) return
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        go(e.key === 'ArrowLeft' ? -1 : 1)
        if (onItem) {
          // keep the focus ring on the book that is now centred (roving tabindex)
          const next = Math.round(st.current.T)
          spineRefs.current[next]?.focus({ preventScroll: true })
        }
      } else if (e.key === 'Enter' && !onItem) openBook(st.current.active)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, openBook])

  // Position: restore `initialIndex` on first mount (coming back from a book),
  // and reset to the first book only when the list itself changes. Keyed on the
  // ids, not the array identity, so parent re-renders don't move the shelf.
  const sig = books.map((b) => b.id).join('|')
  const prevSig = React.useRef<string | null>(null)
  React.useEffect(() => {
    // Same list as last time (e.g. Strict Mode's double effect): keep position.
    if (prevSig.current === sig) return
    const start = prevSig.current === null ? clamp(initialIndex ?? 0, 0, Math.max(0, n - 1)) : 0
    prevSig.current = sig
    st.current.T = start
    st.current.s = start
    st.current.active = start
    setActive(start)
    onActiveRef.current?.(start)
     
  }, [sig])

  // Warm the browser cache for the books around the one in view, so the next
  // swipe lands on a finished cover.
  React.useEffect(() => {
    for (let i = Math.max(0, active - 2); i <= Math.min(n - 1, active + 4); i++) {
      const u = books[i] && shelfCover(books[i], failed)
      if (u) new Image().src = u
    }
  }, [active, books, n, failed])

  const current = books[active]
  const note = current && getNote ? getNote(current) : undefined
  const saved = current ? bookmarkedIds.has(current.id) : false

  const onPointerDown = (e: React.PointerEvent) => {
    const S = st.current
    S.downX = e.clientX
    S.downT = S.T
    S.justDragged = false
    S.dragging = false
    ;(e.currentTarget as HTMLElement).dataset.down = '1'
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const S = st.current
    S.mx = e.clientX
    S.my = e.clientY
    if ((e.currentTarget as HTMLElement).dataset.down !== '1') return
    const dx = e.clientX - S.downX
    if (!S.dragging && Math.abs(dx) > 6) S.dragging = true
    if (S.dragging) {
      S.T = clamp(S.downT - dx / (S.m.ws + S.m.gap), -0.3, n - 0.7)
    }
  }
  const endDrag = (e: React.PointerEvent) => {
    const S = st.current
    ;(e.currentTarget as HTMLElement).dataset.down = '0'
    if (S.dragging) {
      S.T = clamp(Math.round(S.T), 0, Math.max(0, n - 1))
      S.justDragged = true
    }
    S.dragging = false
  }
  const onPointerLeave = (e: React.PointerEvent) => {
    st.current.mx = -9999
    st.current.my = -9999
    endDrag(e)
  }

  const onTapeClick = (i: number) => {
    const S = st.current
    if (S.justDragged) {
      S.justDragged = false
      return
    }
    if (i === Math.round(S.T) && Math.abs(S.T - S.s) < 0.3) openBook(i)
    else S.T = i
  }

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.totalItems / pagination.maxResults))
    : 1

  return (
    <div className="relative flex min-h-[calc(100svh-64px)] flex-col overflow-hidden bg-[#ECE8E0] font-[family-name:var(--font-shelf-sans)] text-[#141414]">
      {/* Decoration (purely visual): faint vertical words, a shadow under the
          shelf and a paper-grain overlay. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 hidden lg:block">
        {(['READ', 'NEXT'] as const).map((w, i) => (
          <span
            key={w}
            className="absolute font-extrabold leading-none tracking-tight text-[#6e7aa0]/20 select-none"
            style={{
              writingMode: 'vertical-rl',
              fontSize: 'clamp(72px, 17vh, 170px)',
              top: i === 0 ? '14%' : '10%',
              [i === 0 ? 'left' : 'right']: '2.4vw',
            }}
          >
            {w}
          </span>
        ))}
        <div
          className="absolute left-1/2 h-[18%] w-[min(94%,1200px)] -translate-x-1/2"
          style={{
            top: '58%',
            background:
              'radial-gradient(50% 50% at 50% 40%, rgba(40,32,20,.26), rgba(40,32,20,.08) 55%, transparent 72%)',
          }}
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[5] opacity-60 mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .45 0 0 0 0 .42 0 0 0 0 .38 0 0 0 .22 0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: '220px',
        }}
      />

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between gap-3 px-4 pt-3 sm:px-8 sm:pt-4">
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#1F3FB0] hover:opacity-70"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">{backLabel}</span>
        </button>
        <div className="min-w-0 flex-1 sm:max-w-sm sm:flex-none sm:basis-80">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={onSearch}
            isLoading={isLoading}
            variant="compact"
            placeholder="Search a title or author…"
          />
        </div>
      </div>

      {/* Heading */}
      <div className="relative z-20 px-4 pt-2 text-center sm:px-8 sm:pt-3">
        <h1 className="text-base font-semibold tracking-tight text-[#1F3FB0] sm:text-xl">{heading}</h1>
        {subheading && <p className="mt-0.5 hidden text-xs text-[#5C5952] sm:block">{subheading}</p>}
        {chips && chips.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1 sm:mt-2 sm:gap-1.5">
            {chips.map((c) => (
              <span
                key={c}
                className="border border-[#141414]/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
              >
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {n === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-[#5C5952]">
          No books to show. Try a different search.
        </div>
      ) : (
        <>
          {/* 3D shelf */}
          <div
            ref={areaRef}
            className="relative z-10 h-[42svh] min-h-[240px] flex-none touch-pan-y select-none sm:h-auto sm:min-h-[260px] sm:flex-1"
            style={{ perspective: `${P}px`, perspectiveOrigin: '50% 50%' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={onPointerLeave}
            role="group"
            aria-roledescription="carousel"
            aria-label="Recommended books"
            data-shelf
          >
            <div
              className="absolute left-1/2 top-1/2 h-0 w-0"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {books.map((b, i) => {
                const [bg, fg] = paletteFor(b.title)
                const src = shelfCover(b, failed)
                const near = Math.abs(i - active) <= 3
                const spineText = spineTitle(b.title)
                // Images fade in over the generated cover once decoded, so a slow
                // network never leaves a blank face. Nearby books load eagerly.
                const imgProps = {
                  src,
                  draggable: false,
                  decoding: 'async' as const,
                  loading: near ? ('eager' as const) : ('lazy' as const),
                  referrerPolicy: 'no-referrer' as const,
                  onError: () => markFailed(b.id),
                  onLoad: (e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.style.opacity = '1'
                  },
                  ref: (el: HTMLImageElement | null) => {
                    if (el && el.complete && el.naturalWidth > 0) el.style.opacity = '1'
                  },
                  style: { opacity: 0, transition: 'opacity 300ms ease-out' },
                }
                return (
                  <div
                    key={b.id}
                    ref={(el) => {
                      tapeRefs.current[i] = el
                    }}
                    className="absolute left-0 top-0 h-0 w-0 will-change-transform"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Spine */}
                    <div
                      ref={(el) => {
                        spineRefs.current[i] = el
                      }}
                      role="button"
                      data-shelf-item
                      tabIndex={i === active ? 0 : -1}
                      aria-current={i === active ? 'true' : undefined}
                      // The name starts with the words printed on the spine (WCAG 2.5.3), then the author.
                      aria-label={`${mainTitle(b.title)} ${b.authors[0] ?? ''}`.trim()}
                      onClick={() => onTapeClick(i)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onTapeClick(i)
                        }
                      }}
                      className="absolute overflow-hidden rounded-[2px] [backface-visibility:hidden] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F3FB0]"
                      style={{
                        top: 'calc(var(--Hp) / -2)',
                        height: 'var(--Hp)',
                        width: 'var(--ws)',
                        left: 'calc(var(--ws) / -2)',
                        transform: 'translateZ(calc(var(--d) / 2))',
                        background: bg,
                        color: fg,
                        cursor: 'pointer',
                      }}
                    >
                      <div className="flex h-full flex-col items-center gap-2 px-[6%] py-[8%]">
                        {src && (
                          <div className="relative aspect-[2/3] w-[82%] shrink-0 overflow-hidden bg-black/15">
                            { }
                            <img
                              {...imgProps}
                              alt=""
                              width={360}
                              height={540}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div
                          className="min-h-0 flex-1 overflow-hidden text-center font-extrabold leading-tight"
                          style={{
                            writingMode: 'vertical-rl',
                            fontSize: spineFont(spineText),
                            letterSpacing: '0.02em',
                          }}
                        >
                          {spineText}
                        </div>
                        {/* A real space between title and author in the page text (flex ignores it visually),
                            so the visible text reads "TITLE AUTHOR" and matches the accessible name. */}
                        {' '}
                        <div
                          className="shrink-0 overflow-hidden text-center font-semibold opacity-80"
                          style={{
                            writingMode: 'vertical-rl',
                            fontSize: 'calc(var(--ws) * 0.2)',
                            maxHeight: '26%',
                          }}
                        >
                          {(b.authors[0] ?? '').toUpperCase()}
                        </div>
                      </div>
                      <div
                        className="pointer-events-none absolute inset-0 bg-black"
                        style={{ opacity: 'var(--shade, 0)' }}
                      />
                    </div>

                    {/* Cover */}
                    <div
                      ref={(el) => {
                        coverRefs.current[i] = el
                      }}
                      onClick={() => onTapeClick(i)}
                      className="absolute overflow-hidden rounded-[2px] shadow-[0_34px_60px_-30px_rgba(20,16,10,0.6)] [backface-visibility:hidden]"
                      style={{
                        top: 'calc(var(--Hp) / -2)',
                        height: 'var(--Hp)',
                        width: 'var(--d)',
                        left: 'calc(var(--d) / -2)',
                        transform: 'rotateY(90deg) translateZ(calc(var(--ws) / 2))',
                        background: bg,
                        color: fg,
                        cursor: 'pointer',
                      }}
                    >
                      {/* Generated cover: always rendered, so there is never a blank
                          face while (or if) the real image loads. */}
                      <div className="flex h-full flex-col items-center justify-between p-[8%] text-center">
                        <span className="text-[9px] font-semibold uppercase tracking-[0.2em] opacity-80">
                          True2Readers
                        </span>
                        <span
                          className="line-clamp-4 font-extrabold leading-[1.05]"
                          style={{ fontSize: 'calc(var(--d) * 0.12)' }}
                        >
                          {mainTitle(b.title)}
                        </span>
                        <span
                          className="font-medium opacity-90"
                          style={{ fontSize: 'calc(var(--d) * 0.06)' }}
                        >
                          {b.authors.join(', ')}
                        </span>
                      </div>
                      {src && (
                         
                        <img
                          {...imgProps}
                          alt={b.title}
                          width={360}
                          height={540}
                          fetchPriority={i === active ? 'high' : 'auto'}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      )}
                      <div
                        className="pointer-events-none absolute inset-0 bg-black"
                        style={{ opacity: 'var(--shade, 0)' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Caption + actions */}
          <div className="relative z-20 mx-auto flex w-full max-w-2xl flex-col items-center gap-2 px-4 pb-3 text-center">
            {/* Announced by screen readers when the centred book changes. */}
            <p className="sr-only" aria-live="polite">
              {current ? `${active + 1} of ${n}: ${current.title} by ${current.authors.join(', ')}` : ''}
            </p>
            <div className="flex w-full items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous book"
                disabled={active <= 0}
                className="grid size-10 place-items-center text-[#1F3FB0] transition-opacity hover:opacity-70 disabled:opacity-25"
              >
                <ArrowLeft className="size-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="line-clamp-2 text-xl font-semibold leading-tight tracking-tight text-[#1F3FB0] sm:text-3xl">
                  {current?.title}
                </h2>
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1F3FB0]">
                  {current?.authors.join(', ')}
                </p>
                <p className="mt-0.5 text-[11px] font-medium tracking-wide text-[#141414]/80">
                  {[current?.year, current?.categories?.[0]].filter(Boolean).join(' — ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next book"
                disabled={active >= n - 1}
                className="grid size-10 place-items-center text-[#1F3FB0] transition-opacity hover:opacity-70 disabled:opacity-25"
              >
                <ArrowRight className="size-5" />
              </button>
            </div>

            {note?.why && (
              <p className="line-clamp-2 max-w-xl text-xs leading-snug text-[#141414]/80">
                <span className="font-semibold text-[#1F3FB0]">Why it fits: </span>
                {note.why}
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => current && openBook(active)}
                className="inline-flex h-10 items-center gap-2 border border-[#1F3FB0] px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1F3FB0] transition-colors hover:bg-[#1F3FB0] hover:text-white"
              >
                <BookOpen className="size-3.5" />
                Open book
              </button>
              <button
                type="button"
                onClick={() => current && onToggleBookmark(current)}
                aria-pressed={saved}
                aria-label={saved ? 'Remove from saved books' : 'Save this book'}
                className={cn(
                  'inline-flex h-10 items-center gap-2 border px-4 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors',
                  saved
                    ? 'border-[#1F3FB0] bg-[#1F3FB0] text-white'
                    : 'border-[#141414]/70 hover:border-[#1F3FB0] hover:text-[#1F3FB0]',
                )}
              >
                <Bookmark className={cn('size-3.5', saved && 'fill-current')} />
                {saved ? 'Saved' : 'Save'}
              </button>
            </div>

            {/* Position ruler */}
            <div className="mt-1 flex w-full max-w-md items-center gap-[3px]" aria-hidden="true">
              {books.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    st.current.T = i
                  }}
                  className="flex h-4 flex-1 items-center"
                >
                  <span
                    className={cn(
                      'h-px w-full bg-[#1F3FB0] transition-all',
                      i === active ? 'h-[3px] opacity-100' : 'opacity-35',
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5C5952]">
              {active + 1} / {n}
              <span className="hidden sm:inline"> · drag, scroll or use ← →</span>
              <span className="sm:hidden"> · swipe</span>
            </p>

            <div
              role="group"
              aria-label="How books open"
              className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5C5952]"
            >
              <span>Opening</span>
              {(['poster', 'swing'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={openStyle === s}
                  onClick={() => chooseOpenStyle(s)}
                  className={cn(
                    'border px-2 py-1 transition-colors',
                    openStyle === s
                      ? 'border-[#1F3FB0] bg-[#1F3FB0] text-white'
                      : 'border-[#141414]/40 hover:border-[#1F3FB0] hover:text-[#1F3FB0]',
                  )}
                >
                  {s === 'poster' ? 'Page turn' : 'Book swing'}
                </button>
              ))}
            </div>

            {pagination && totalPages > 1 && (
              <div className="flex items-center gap-3 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1F3FB0]">
                <button
                  type="button"
                  disabled={pagination.page <= 1 || isLoading}
                  onClick={() => pagination.onPageChange(pagination.page - 1)}
                  className="disabled:opacity-30"
                >
                  ← Previous 24
                </button>
                <span className="text-[#5C5952]">
                  Page {pagination.page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={pagination.page >= totalPages || isLoading}
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                  className="disabled:opacity-30"
                >
                  Next 24 →
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Cover-expand transition into the detail page */}
      {/* Rendered on <body>: `fixed` inside the page's transformed view wrapper
          would be positioned and clipped relative to that wrapper instead of
          the screen. The panel grows from the cover to the full screen while
          the cover fades out (so it is never stretched), then the panel fades
          to reveal the detail page. */}
      {opening &&
        createPortal(
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-[100]"
            style={{ perspective: '1800px' }}
          >
            {/* The page inside: starts exactly under the cover and fills the
                screen, in the same paper colour as the detail page. */}
            <motion.div
              className="absolute bg-[#ECE8E0]"
              initial={{
                top: opening.rect.top,
                left: opening.rect.left,
                width: opening.rect.width,
                height: opening.rect.height,
                opacity: 1,
              }}
              animate={{ top: 0, left: 0, width: '100%', height: '100%', opacity: 0 }}
              transition={{
                default: { duration: 0.55, ease: [0.76, 0, 0.18, 1] },
                opacity: { delay: 0.5, duration: 0.25, ease: 'linear' },
              }}
            />
            {/* The cover swings open on its left edge, like a hardcover. */}
            <motion.div
              className="absolute overflow-hidden rounded-[2px] shadow-[0_30px_60px_-20px_rgba(20,16,10,0.55)]"
              style={{
                top: opening.rect.top,
                left: opening.rect.left,
                width: opening.rect.width,
                height: opening.rect.height,
                transformOrigin: 'left center',
                backfaceVisibility: 'hidden',
                background: paletteFor(opening.book.title)[0],
              }}
              initial={{ rotateY: 0, opacity: 1 }}
              animate={{ rotateY: -118, opacity: [1, 1, 0] }}
              transition={{
                rotateY: { duration: 0.6, ease: [0.55, 0, 0.2, 1] },
                opacity: { duration: 0.75, times: [0, 0.75, 1] },
              }}
            >
              {shelfCover(opening.book, failed) && (
                 
                <img
                  src={shelfCover(opening.book, failed)}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              )}
            </motion.div>
          </div>,
          document.body,
        )}
    </div>
  )
}
