'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface SearchProgressProps {
  /** Whether a search is in progress. */
  isLoading: boolean
}

/**
 * Animated top progress bar that appears during search loading.
 * Uses a two-phase animation: fast fill to ~60%, then slow crawl to ~90%,
 * then completes instantly when loading finishes.
 */
export function SearchProgress({ isLoading }: SearchProgressProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed left-0 right-0 top-0 z-50 h-[3px] bg-blue-100/50"
        >
          {/* Phase 1: Fast fill to 60% */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 0.6 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-y-0 left-0 origin-left bg-gradient-to-r from-blue-500 to-blue-400"
            style={{ width: '100%' }}
          />
          {/* Phase 2: Slow crawl 60% → 90% */}
          <motion.div
            initial={{ scaleX: 0.6 }}
            animate={{ scaleX: 0.9 }}
            transition={{
              duration: 4,
              ease: 'linear',
              delay: 0.4,
            }}
            className="absolute inset-y-0 left-0 origin-left bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300"
            style={{ width: '100%' }}
          />
          {/* Shimmer overlay */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SearchProgress
