'use client'

import * as React from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className={cn(
        'bg-[#060D1E] py-8 text-slate-300 border-t border-slate-800',
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-4 px-6 sm:flex-row sm:items-center">
        {/* Left Column: Brand & Tagline */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Heart className="size-4 fill-pink-500 text-pink-500" />
            <span className="text-sm font-bold text-white">Thinkable & Co</span>
          </div>
          <p className="text-xs text-slate-400">
            Built with passion for curious readers.
          </p>
        </div>

        {/* Right: Copyright */}
        <div className="text-xs text-slate-400 font-medium">
          © {currentYear} Thinkable & Co. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer
