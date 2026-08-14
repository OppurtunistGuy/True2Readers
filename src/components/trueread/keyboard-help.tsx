'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Search,
  ArrowLeft,
  Bookmark,
  List,
  HelpCircle,
  Keyboard,
  Maximize2,
  ArrowRight,
  Grid3X3,
  Printer,
  Gauge,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface KeyboardHelpProps {
  isOpen: boolean
  onClose: () => void
}

interface Shortcut {
  keys: string[]
  description: string
  icon: React.ReactNode
}

const SHORTCUT_GROUPS: { title: string; shortcuts: Shortcut[] }[] = [
  {
    title: 'Navigation',
    shortcuts: [
      {
        keys: ['/'],
        description: 'Focus the search box (home view)',
        icon: <Search className="size-4 text-blue-500" strokeWidth={2} />,
      },
      {
        keys: ['Esc'],
        description: 'Go back / close dialog / close panel',
        icon: <ArrowLeft className="size-4 text-blue-500" strokeWidth={2} />,
      },
      {
        keys: ['?'],
        description: 'Show this keyboard shortcuts dialog',
        icon: <HelpCircle className="size-4 text-blue-500" strokeWidth={2} />,
      },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      {
        keys: ['Enter'],
        description: 'Submit search / select suggestion',
        icon: <Search className="size-4 text-blue-500" strokeWidth={2} />,
      },
      {
        keys: ['↑', '↓'],
        description: 'Navigate autocomplete suggestions',
        icon: <List className="size-4 text-blue-500" strokeWidth={2} />,
      },
      {
        keys: ['B'],
        description: 'Save / unsave current book (detail view)',
        icon: <Bookmark className="size-4 text-blue-500" strokeWidth={2} />,
      },
      {
        keys: ['R'],
        description: 'Toggle reading mode (detail view)',
        icon: <Maximize2 className="size-4 text-blue-500" strokeWidth={2} />,
      },
      {
        keys: ['P'],
        description: 'Print or save as PDF (detail view)',
        icon: <Printer className="size-4 text-blue-500" strokeWidth={2} />,
      },
      {
        keys: ['C'],
        description: 'Open reading pace calculator (detail view)',
        icon: <Gauge className="size-4 text-blue-500" strokeWidth={2} />,
      },
      {
        keys: ['↑', '↓', '←', '→'],
        description: 'Move between book cards (results grid)',
        icon: <Grid3X3 className="size-4 text-blue-500" strokeWidth={2} />,
      },
      {
        keys: ['Enter'],
        description: 'Open the focused book card',
        icon: <ArrowRight className="size-4 text-blue-500" strokeWidth={2} />,
      },
    ],
  },
]

/**
 * Keyboard shortcuts help overlay.
 * Triggered by pressing `?` (when not typing in an input).
 */
export function KeyboardHelp({ isOpen, onClose }: KeyboardHelpProps) {
  // Close on Escape is handled by the parent (which already listens for Escape).
  React.useEffect(() => {
    if (isOpen) {
      // Lock body scroll while the dialog is open
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-slate-900/30 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
              role="dialog"
              aria-modal="true"
              aria-labelledby="keyboard-help-title"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-transparent px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <Keyboard className="size-5" strokeWidth={2.25} />
                  </span>
                  <div>
                    <h2
                      id="keyboard-help-title"
                      className="text-base font-semibold text-slate-900"
                    >
                      Keyboard Shortcuts
                    </h2>
                    <p className="text-xs text-slate-500">
                      Navigate TrueRead faster
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close keyboard shortcuts"
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
              </div>

              {/* Shortcut groups */}
              <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
                {SHORTCUT_GROUPS.map((group, gi) => (
                  <div key={group.title} className={cn(gi > 0 && 'mt-5')}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {group.title}
                    </h3>
                    <ul className="flex flex-col gap-1">
                      {group.shortcuts.map((sc, si) => (
                        <li
                          key={`${gi}-${si}`}
                          className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-3">
                            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-slate-100">
                              {sc.icon}
                            </span>
                            <span className="text-sm text-slate-700">
                              {sc.description}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {sc.keys.map((key, ki) => (
                              <kbd
                                key={ki}
                                className="inline-flex min-w-7 items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 shadow-sm"
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-3">
                <p className="text-center text-xs text-slate-400">
                  Press{' '}
                  <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                    Esc
                  </kbd>{' '}
                  to close
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default KeyboardHelp
