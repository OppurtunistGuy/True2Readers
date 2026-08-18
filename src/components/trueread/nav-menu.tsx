'use client'

import * as React from 'react'
import {
  Menu,
  Info,
  Sparkles,
  ShieldCheck,
  FileText,
  Mail,
  X,
  BookOpen,
  Keyboard,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export type NavMenuSection = 'about' | 'how-it-works' | 'privacy' | 'terms' | 'contact'

export interface NavMenuProps {
  onOpenKeyboardHelp?: () => void
}

export function NavMenu({ onOpenKeyboardHelp }: NavMenuProps) {
  const [modalOpen, setModalOpen] = React.useState(false)
  const [activeSection, setActiveSection] = React.useState<NavMenuSection>('about')

  const handleSelectSection = (section: NavMenuSection) => {
    setActiveSection(section)
    setModalOpen(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Open navigation menu"
          >
            <Menu className="size-5 text-slate-700" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-slate-200/80">
          <DropdownMenuItem
            onClick={() => handleSelectSection('about')}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
          >
            <Info className="size-4 text-blue-600" />
            <span>About</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleSelectSection('how-it-works')}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
          >
            <Sparkles className="size-4 text-blue-600" />
            <span>How it works</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleSelectSection('privacy')}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
          >
            <ShieldCheck className="size-4 text-blue-600" />
            <span>Privacy</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleSelectSection('terms')}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
          >
            <FileText className="size-4 text-blue-600" />
            <span>Terms</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleSelectSection('contact')}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
          >
            <Mail className="size-4 text-blue-600" />
            <span>Contact</span>
          </DropdownMenuItem>

          {onOpenKeyboardHelp && (
            <>
              <DropdownMenuSeparator className="my-1 border-slate-100" />
              <DropdownMenuItem
                onClick={onOpenKeyboardHelp}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Keyboard className="size-3.5" />
                  <span>Keyboard shortcuts</span>
                </div>
                <kbd className="rounded border border-slate-200 bg-slate-100 px-1 text-[10px] font-semibold text-slate-600">?</kbd>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Info Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-slate-200 shadow-2xl">
          <div className="flex flex-col md:flex-row min-h-[420px]">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-48 bg-slate-50 p-4 border-b md:border-b-0 md:border-r border-slate-200/80 flex flex-col gap-1">
              <div className="flex items-center gap-2 px-2 py-2 mb-2">
                <BookOpen className="size-4 text-blue-600" />
                <span className="text-xs font-black tracking-tight text-slate-900">True2Readers</span>
              </div>

              {(
                [
                  { id: 'about', label: 'About', icon: Info },
                  { id: 'how-it-works', label: 'How it works', icon: Sparkles },
                  { id: 'privacy', label: 'Privacy', icon: ShieldCheck },
                  { id: 'terms', label: 'Terms', icon: FileText },
                  { id: 'contact', label: 'Contact', icon: Mail },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon
                const isActive = activeSection === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveSection(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                      isActive
                        ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`size-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 flex flex-col justify-between">
              <div>
                {activeSection === 'about' && (
                  <div className="space-y-3">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black text-slate-900">About True2Readers</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      True2Readers is built with passion by <strong>Thinkable & Co.</strong> for curious readers who value their time.
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Our mission is to help readers understand any book in seconds—matching prose difficulty, pacing, and reading commitment before they commit to reading.
                    </p>
                    <div className="mt-4 rounded-2xl bg-blue-50/60 p-3.5 border border-blue-100 text-xs text-blue-900">
                      <strong>Core Promise:</strong> We never fabricate reviews or AI content. All volume metadata and previews are grounded in authentic, authoritative literary APIs.
                    </div>
                  </div>
                )}

                {activeSection === 'how-it-works' && (
                  <div className="space-y-3">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black text-slate-900">How It Works</DialogTitle>
                    </DialogHeader>
                    <ul className="space-y-2.5 text-xs text-slate-600">
                      <li className="flex items-start gap-2">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">1</span>
                        <span><strong>Search & Extract:</strong> Instant omni-search queries Google Books and Apple Books for real volume metadata and excerpts.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">2</span>
                        <span><strong>Text Analysis:</strong> Transparently derives reading difficulty scores from prose character length and sentence complexity.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">3</span>
                        <span><strong>Anti-Slump Tools:</strong> Custom pacing, 10-minute micro-goals, and reading modes keep momentum high.</span>
                      </li>
                    </ul>
                  </div>
                )}

                {activeSection === 'privacy' && (
                  <div className="space-y-3">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black text-slate-900">Privacy Policy</DialogTitle>
                    </DialogHeader>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Your privacy is sacred. True2Readers does not sell, broker, or monetize your reading history or personal data.
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-500 list-disc pl-4">
                      <li>Saved books and recent searches are stored locally in your browser.</li>
                      <li>User accounts are authenticated securely with encrypted session tokens.</li>
                      <li>No third-party tracking pixels or behavioral ad cookies.</li>
                    </ul>
                  </div>
                )}

                {activeSection === 'terms' && (
                  <div className="space-y-3">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black text-slate-900">Terms of Service</DialogTitle>
                    </DialogHeader>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      True2Readers is provided for informational and book-discovery purposes. Book excerpts, covers, and descriptions belong to their respective copyright holders and publishers.
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Affiliate purchase links help support independent development without adding any extra cost to your book purchases.
                    </p>
                  </div>
                )}

                {activeSection === 'contact' && (
                  <div className="space-y-3">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black text-slate-900">Contact Thinkable & Co.</DialogTitle>
                    </DialogHeader>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Have a suggestion, feedback, or a book you’d love to see featured? We’d love to hear from you.
                    </p>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs space-y-2 text-slate-700">
                      <p><strong>Email:</strong> hello@thinkable.co</p>
                      <p><strong>Team:</strong> Thinkable & Co. Product & Literary Intelligence</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>&copy; {new Date().getFullYear()} Thinkable & Co.</span>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl bg-slate-100 px-3.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default NavMenu
