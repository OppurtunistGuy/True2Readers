'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Palette } from 'lucide-react'

export interface CoverPaletteProps {
  /** Book cover URL. */
  coverUrl?: string
  /** Number of dominant colors to extract. Default 4. */
  maxColors?: number
}

const DEFAULT_SWATCHES = ['#EFE7D9', '#D9C4A8', '#B08968', '#6B4E3D']

export function CoverPalette({ coverUrl, maxColors = 4 }: CoverPaletteProps) {
  const [colors, setColors] = React.useState<string[]>(DEFAULT_SWATCHES)

  React.useEffect(() => {
    if (!coverUrl) {
      setColors(DEFAULT_SWATCHES)
      return
    }

    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'

    const handleLoad = () => {
      if (cancelled) return
      try {
        const palette = extractPalette(img, maxColors)
        if (!cancelled && palette.length > 0) {
          setColors(palette)
        }
      } catch {
        if (!cancelled) setColors(DEFAULT_SWATCHES)
      }
    }

    const handleError = () => {
      if (!cancelled) setColors(DEFAULT_SWATCHES)
    }

    img.addEventListener('load', handleLoad)
    img.addEventListener('error', handleError)
    img.src = coverUrl

    return () => {
      cancelled = true
      img.removeEventListener('load', handleLoad)
      img.removeEventListener('error', handleError)
      img.src = ''
    }
  }, [coverUrl, maxColors])

  const displayColors = colors.length >= 4 ? colors.slice(0, 4) : DEFAULT_SWATCHES

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5"
    >
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <Palette className="size-4 text-blue-600" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          COVER PALETTE
        </h3>
      </div>
      <div className="grid grid-cols-4 gap-2 pt-1">
        {displayColors.map((hex, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span
              className="h-8 w-full rounded-lg border border-slate-200/80 shadow-2xs"
              style={{ backgroundColor: hex }}
              aria-hidden="true"
            />
            <span className="font-mono text-[10px] font-semibold uppercase text-slate-500">
              {hex}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function extractPalette(img: HTMLImageElement, maxColors: number): string[] {
  const W = 50
  const H = 60
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return []

  ctx.drawImage(img, 0, 0, W, H)

  let pixels: Uint8ClampedArray
  try {
    const imageData = ctx.getImageData(0, 0, W, H)
    pixels = imageData.data
  } catch {
    return []
  }

  type Bucket = { count: number; r: number; g: number; b: number }
  const buckets = new Map<number, Bucket>()
  const BUCKET_STEP = 32
  const round = (v: number) => Math.round(v / BUCKET_STEP) * BUCKET_STEP

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const a = pixels[i + 3]
    if (a < 200) continue

    const br = round(r)
    const bg = round(g)
    const bb = round(b)
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
