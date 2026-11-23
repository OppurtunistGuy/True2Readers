'use client'

import * as React from 'react'
import { AUTH_ENABLED } from '@/lib/features'

export interface UserProfile {
  id: string
  email: string
  name?: string | null
}

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  authModalOpen: boolean
  openAuthModal: () => void
  closeAuthModal: () => void
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserProfile | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [authModalOpen, setAuthModalOpen] = React.useState(false)

  const refreshUser = React.useCallback(async () => {
    // Accounts off (src/lib/features.ts): nobody can be signed in, so skip the request.
    if (!AUTH_ENABLED) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user || null)
      } else {
        setUser(null)
      }
    } catch (err) {
      console.error('Failed to check auth session:', err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed.' }
      }
      setUser(data.user)
      setAuthModalOpen(false)
      return { success: true }
    } catch (err) {
      console.error('Login error:', err)
      return { success: false, error: 'Network or server error.' }
    }
  }

  const signup = async (email: string, password: string, name?: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Signup failed.' }
      }
      setUser(data.user)
      setAuthModalOpen(false)
      return { success: true }
    } catch (err) {
      console.error('Signup error:', err)
      return { success: false, error: 'Network or server error.' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authModalOpen,
        openAuthModal: () => setAuthModalOpen(true),
        closeAuthModal: () => setAuthModalOpen(false),
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
