'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

export interface ScrollToTopProps {
  /** Scroll threshold in px before the button appears. */
  threshold?: number
}

/**
 * Floating scroll-to-top button that appears when the user scrolls down.
 * Positioned bottom-right, above the reading list FAB if present.
 */
export function ScrollToTop({ threshold = 400 }: ScrollToTopProps) {
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > threshold)
    }
    // Check initial position
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          type="button"
          onClick={handleClick}
          className="fixed bottom-6 right-6 z-30 inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-95 sm:bottom-8 sm:right-8"
          aria-label="Scroll to top"
        >
          <ArrowUp className="size-4" strokeWidth={2.25} />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

export default ScrollToTop
