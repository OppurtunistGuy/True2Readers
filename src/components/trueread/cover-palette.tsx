'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Palette } from 'lucide-react'

export interface CoverPaletteProps {
  /** Book cover URL. If missing, the component renders nothing. */
  coverUrl?: string
  /** Number of dominant colors to extract. Default 3. */
  maxColors?: number
}

/**
 * CoverPalette — extracts the dominant colors from a book's real cover image
 * and renders them as small swatches with hex codes.
 *
 * Approach:
 * - Loads the cover into an offscreen `Image()` with `crossOrigin='anonymous'`.
 * - Draws it onto a small canvas (50x60) to keep pixel-read cost low.
 * - Reads pixel data, bucketing RGB channels into coarse buckets (each
 *   channel rounded to nearest 32) so similar colors group together.
 * - Skips near-white / near-black / near-gray pixels (saturation < 0.1 or
 *   lightness extremes) — these usually represent the cover background or
 *   margins, not the cover's identity colors.
 * - Picks the top N buckets by count, returns the average color of each.
 *
 * Robustness:
 * - Apple Books (mzstatic.com) covers may NOT send CORS headers. In that case
 *   the canvas becomes tainted and `getImageData` throws a SecurityError —
 *   we catch that and silently render null.
 * - Any other error (network failure, decode error, etc.) also results in
 *   null. Never throws to the parent.
 *
 * Real data, computed client-side. No fabrication.
 */
export function CoverPalette({ coverUrl, maxColors = 3 }: CoverPaletteProps) {
  const [colors, setColors] = React.useState<string[]>([])
  const [failed, setFailed] = React.useState(false)

  const prefersReduced = React.useMemo(() => {
    if (typeof window === 'undefined') return false
    return (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  }, [])

  React.useEffect(() => {
    setColors([])
    setFailed(false)
    if (!coverUrl) return

    let cancelled = false
    const img = new Image()
    // Setting crossOrigin BEFORE src — required for clean canvas reads.
    // If the host doesn't send CORS headers, the image will fail to load
    // (or the canvas will taint on draw). Either way we end up in the
    // error branch and silently render null.
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'

    const handleLoad = () => {
      if (cancelled) return
      try {
        const palette = extractPalette(img, maxColors)
        if (cancelled) return
        if (palette.length === 0) {
          setFailed(true)
        } else {
          setColors(palette)
        }
      } catch {
        if (!cancelled) setFailed(true)
      }
    }

    const handleError = () => {
      if (!cancelled) setFailed(true)
    }

    img.addEventListener('load', handleLoad)
    img.addEventListener('error', handleError)
    img.src = coverUrl

    return () => {
      cancelled = true
      img.removeEventListener('load', handleLoad)
      img.removeEventListener('error', handleError)
      // Release the image to free memory.
      img.src = ''
    }
  }, [coverUrl, maxColors])

  // Hide entirely when no cover, when extraction failed, or when we don't
  // have a complete palette (avoid partial palettes that look broken).
  if (!coverUrl || failed || colors.length !== maxColors) return null

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="mt-4 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70"
    >
      <h3 className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Palette className="size-3" strokeWidth={2.25} />
          Cover palette
        </span>
      </h3>
      <div className="flex flex-wrap gap-3 px-1">
        {colors.map((hex, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span
              className="size-7 rounded-md ring-1 ring-slate-200"
              style={{ backgroundColor: hex }}
              aria-hidden="true"
            />
            <span className="font-mono text-[10px] tabular-nums text-slate-500">
              {hex.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/**
 * Core extraction routine — exported separately so it could be tested in
 * isolation if needed. Pure DOM, no React.
 *
 * Throws if the canvas is tainted (crossOrigin set but server didn't send
 * CORS headers) — the caller is responsible for catching.
 */
function extractPalette(img: HTMLImageElement, maxColors: number): string[] {
  // Small downscale for speed — we don't need pixel-perfect fidelity for
  // dominant-color extraction.
  const W = 50
  const H = 60
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return []

  // Draw cover-to-fit so we don't crop color regions.
  ctx.drawImage(img, 0, 0, W, H)

  let pixels: Uint8ClampedArray
  try {
    const imageData = ctx.getImageData(0, 0, W, H)
    pixels = imageData.data
  } catch {
    // SecurityError on tainted canvas — bail.
    return []
  }

  // Bucket: round each channel to nearest 32. Each bucket also tracks the
  // sum of its actual pixel colors so we can return the average (smoother
  // output than the raw bucket key).
  type Bucket = { count: number; r: number; g: number; b: number }
  const buckets = new Map<number, Bucket>()

  const BUCKET_STEP = 32
  const round = (v: number) => Math.round(v / BUCKET_STEP) * BUCKET_STEP

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const a = pixels[i + 3]
    // Skip fully-transparent pixels.
    if (a < 200) continue

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const lightness = (max + min) / 2
    const saturation = max === 0 ? 0 : (max - min) / max

    // Skip near-white / near-black / near-gray pixels.
    if (lightness > 245 || lightness < 12) continue
    if (saturation < 0.1) continue

    const br = round(r)
    const bg = round(g)
    const bb = round(b)
    // Composite bucket key — fits in 32 bits since each channel rounds to 0..256.
    const key = (br << 16) | (bg << 8) | bb
    const existing = buckets.get(key)
    if (existing) {
      existing.count++
      existing.r += r
      existing.g += g
      existing.b += b
    } else {
      buckets.set(key, { count: 1, r, g, b })
    }
  }

  if (buckets.size === 0) return []

  const sorted = Array.from(buckets.values()).sort((a, b) => b.count - a.count)
  const chosen = sorted.slice(0, maxColors)

  return chosen.map((b) => {
    const r = Math.round(b.r / b.count)
    const g = Math.round(b.g / b.count)
    const bl = Math.round(b.b / b.count)
    return toHex(r, g, bl)
  })
}

function toHex(r: number, g: number, b: number): string {
  const pad = (v: number) => v.toString(16).padStart(2, '0')
  return `#${pad(r)}${pad(g)}${pad(b)}`
}

export default CoverPalette
