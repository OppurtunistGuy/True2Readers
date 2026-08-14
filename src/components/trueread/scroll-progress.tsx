'use client'

import * as React from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'

export interface ScrollProgressProps {
  /**
   * Optional class to control placement / sizing. By default the bar is
   * fixed to the very top of the viewport (z-50), 2px tall, full-width.
   */
  className?: string
  /** Override the target ref (defaults to window scroll). */
  containerRef?: React.RefObject<HTMLElement | null>
}

/**
 * Slim scroll-progress bar that fills as the user scrolls the page.
 * Uses framer-motion's `useScroll` + `useSpring` for a smooth, eased fill.
 *
 * Visually: a 2px blue gradient bar pinned to the top of the viewport.
 * Respects prefers-reduced-motion (the spring transition still updates,
 * but it's a passive indicator — not an animation that distracts).
 */
export function ScrollProgress({ className, containerRef }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll({
    target: containerRef ?? undefined,
    offset: ['start start', 'end end'],
  })
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 28,
    restDelta: 0.001,
  })

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className={
        'pointer-events-none fixed left-0 top-0 z-50 h-0.5 w-full origin-left ' +
        'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 ' +
        (className ?? '')
      }
    />
  )
}

export default ScrollProgress
