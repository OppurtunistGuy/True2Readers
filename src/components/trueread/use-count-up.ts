'use client'

import * as React from 'react'

/**
 * useCountUp — animates a number from 0 (or the previous value) up to the
 * target value over `durationMs` using requestAnimationFrame + ease-out cubic.
 *
 * - Resets to 0 whenever `target` changes (so the animation replays on each
 *   new search / page load).
 * - Respects `prefers-reduced-motion`: returns the target immediately.
 * - No layout thrash — uses a single rAF loop per target change.
 *
 * Used by the results view to animate the "About N results" count.
 */
export function useCountUp(target: number, durationMs = 600): number {
  const [display, setDisplay] = React.useState(0)

  React.useEffect(() => {
    // Respect reduced-motion: skip the animation entirely.
    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced || !Number.isFinite(target) || target <= 0) {
      setDisplay(Math.max(0, Math.round(target)))
      return
    }

    const start = Math.max(0, 0)
    const end = Math.round(target)
    if (start === end) {
      setDisplay(end)
      return
    }

    let raf = 0
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const t = Math.min(1, elapsed / durationMs)
      // ease-out cubic: 1 - (1 - t)^3
      const eased = 1 - Math.pow(1 - t, 3)
      const value = Math.round(start + (end - start) * eased)
      setDisplay(value)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setDisplay(end)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return display
}
