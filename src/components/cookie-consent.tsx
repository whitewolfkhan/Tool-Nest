'use client'

import * as React from 'react'
import Link from 'next/link'
import { Cookie } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'toolnest-cookie-consent'

type Choice = 'all' | 'essential'

function parseChoice(raw: string | null): Choice | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { choice?: unknown }
    return parsed.choice === 'all' || parsed.choice === 'essential'
      ? parsed.choice
      : null
  } catch {
    return null
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  return () => window.removeEventListener('storage', onChange)
}

function getSnapshot(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function getServerSnapshot(): string | null {
  return null
}

export function CookieConsent() {
  // External-store read: SSR-safe (server snapshot), no mount effect needed.
  const raw = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  // Same-tab writes don't fire `storage` events, so bump to re-render on save.
  const [tick, setTick] = React.useState(0)
  const [reopen, setReopen] = React.useState(false)

  const choice = React.useMemo(() => parseChoice(raw), [raw, tick])

  const save = (c: Choice) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice: c, at: new Date().toISOString() })
      )
    } catch {
      // Storage unavailable (private mode) — banner simply shows again next visit.
    }
    setTick((t) => t + 1)
    setReopen(false)
  }

  // After a choice: tiny floating button to revisit the decision.
  if (choice && !reopen) {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={() => setReopen(true)}
        aria-label="Cookie settings"
        title="Cookie settings"
        className="fixed bottom-4 left-4 z-50 h-9 w-9 rounded-full shadow-md bg-background"
      >
        <Cookie className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-4 shadow-xl sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Cookie className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Only good cookies here</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              ToolNest uses only essential, privacy-friendly storage — your
              theme, favorites, and tool settings, kept on your own device. No
              tracking, no ads, nothing sold. See the{' '}
              <Link href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              onClick={() => save('essential')}
              className="w-full sm:w-auto"
            >
              Essential only
            </Button>
            <Button
              size="sm"
              onClick={() => save('all')}
              className="w-full sm:w-auto"
            >
              Accept all
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
