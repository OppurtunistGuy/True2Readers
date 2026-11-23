'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, LogIn, UserPlus, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from './auth-context'

export function AuthModal() {
  const { authModalOpen, closeAuthModal, login, signup } = useAuth()
  const [mode, setMode] = React.useState<'login' | 'signup'>('login')

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [name, setName] = React.useState('')

  const [error, setError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (authModalOpen) {
      setError(null)
      setEmail('')
      setPassword('')
      setName('')
    }
  }, [authModalOpen])

  if (!authModalOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        const res = await login(email, password)
        if (!res.success) {
          setError(res.error || 'Failed to sign in.')
        }
      } else {
        const res = await signup(email, password, name)
        if (!res.success) {
          setError(res.error || 'Failed to create account.')
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuthModal}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200"
        >
          {/* Close button */}
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 inline-flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>

          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 inline-flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              {mode === 'login' ? (
                <LogIn className="size-6" strokeWidth={2} />
              ) : (
                <UserPlus className="size-6" strokeWidth={2} />
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {mode === 'login' ? 'Welcome back to True2Readers' : 'Create your True2Readers account'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {mode === 'login'
                ? 'Sign in to share how books felt to you'
                : 'Join to submit reader style feedback and ratings'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="mb-5 flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError(null)
              }}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setError(null)
              }}
              className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {mode === 'signup' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Name (Optional)
                </label>
                <div className="relative">
                  <User className="absolute top-2.5 left-3 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pr-3 pl-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute top-2.5 left-3 size-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="reader@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pr-3 pl-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute top-2.5 left-3 size-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pr-3 pl-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : mode === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
