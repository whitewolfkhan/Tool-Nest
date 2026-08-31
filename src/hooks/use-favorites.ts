'use client'

import * as React from 'react'

const FAVORITES_KEY = 'toolnest:favorites'
const RECENTS_KEY = 'toolnest:recents'
const MAX_RECENTS = 12

function readStorage(key: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function writeStorage(key: string, value: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore quota errors */
  }
}

/** Hook that tracks the user's favorite tool slugs in localStorage. */
export function useFavorites() {
  const [favorites, setFavorites] = React.useState<string[]>([])
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    setFavorites(readStorage(FAVORITES_KEY))
    setHydrated(true)

    const handler = (e: StorageEvent) => {
      if (e.key === FAVORITES_KEY) setFavorites(readStorage(FAVORITES_KEY))
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const toggle = React.useCallback((slug: string) => {
    setFavorites((prev) => {
      const next = prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
      writeStorage(FAVORITES_KEY, next)
      return next
    })
  }, [])

  const has = React.useCallback(
    (slug: string) => favorites.includes(slug),
    [favorites]
  )

  return { favorites, has, toggle, hydrated }
}

/** Hook that tracks the user's recently-visited tool slugs in localStorage. */
export function useRecents() {
  const [recents, setRecents] = React.useState<string[]>([])
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    setRecents(readStorage(RECENTS_KEY))
    setHydrated(true)
  }, [])

  const add = React.useCallback((slug: string) => {
    setRecents((prev) => {
      const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, MAX_RECENTS)
      writeStorage(RECENTS_KEY, next)
      return next
    })
  }, [])

  const clear = React.useCallback(() => {
    setRecents([])
    writeStorage(RECENTS_KEY, [])
  }, [])

  return { recents, add, clear, hydrated }
}
