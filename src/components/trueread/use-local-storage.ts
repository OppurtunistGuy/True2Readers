'use client'

import * as React from 'react'

/**
 * useLocalStorage — SSR-safe, JSON-serializing localStorage state hook.
 *
 * - On first render, returns `fallback` (no SSR mismatch).
 * - After mount, reads & parses the stored value; if parse fails or the
 *   stored value is `null`, keeps `fallback`.
 * - Writes are debounced via the React state cycle — every setState triggers
 *   a `localStorage.setItem` in an effect.
 * - Cross-tab sync: listens to the `storage` event so other tabs update too.
 * - All reads/writes are wrapped in try/catch so a blocked or quota-exceeded
 *   localStorage never crashes the app.
 *
 * Returns a tuple identical in shape to useState.
 */
export function useLocalStorage<T>(
  key: string,
  fallback: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = React.useState<T>(fallback)

  // Read once on mount (and whenever the key changes).
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw == null) return
      const parsed = JSON.parse(raw) as T
      setValue(parsed)
    } catch {
      // Ignore parse errors / blocked storage — keep fallback.
    }
  }, [key])

  // Persist on every value change.
  React.useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage may be full or blocked — fail silently.
    }
  }, [key, value])

  // Cross-tab synchronization.
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return
      if (e.newValue == null) {
        setValue(fallback)
        return
      }
      try {
        setValue(JSON.parse(e.newValue) as T)
      } catch {
        // Ignore malformed cross-tab writes.
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  return [value, setValue]
}
