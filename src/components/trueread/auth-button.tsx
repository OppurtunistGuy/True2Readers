'use client'

import * as React from 'react'
import { User, LogIn, LogOut, Loader2 } from 'lucide-react'
import { useAuth } from './auth-context'

export function AuthButton() {
  const { user, loading, openAuthModal, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = React.useState(false)

  if (loading) {
    return (
      <div className="inline-flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white">
        <Loader2 className="size-3.5 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={openAuthModal}
        className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
      >
        <LogIn className="size-3.5" />
        Sign In
      </button>
    )
  }

  const displayName = user.name || user.email.split('@')[0]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setDropdownOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-xs font-semibold text-blue-800 transition-all hover:bg-blue-100 active:scale-95"
      >
        <span className="inline-flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
          <User className="size-2.5" />
        </span>
        <span className="max-w-[100px] truncate">{displayName}</span>
      </button>

      {dropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDropdownOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg ring-1 ring-slate-900/5">
            <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
              <p className="text-[10px] uppercase font-bold text-slate-400">Signed in as</p>
              <p className="truncate text-xs font-medium text-slate-900">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false)
                logout()
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="size-3.5" />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
