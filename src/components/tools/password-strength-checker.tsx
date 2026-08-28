'use client'

import * as React from 'react'
import { ShieldCheck, ShieldAlert, KeyRound, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'

interface Analysis {
  length: number
  hasUpper: boolean
  hasLower: boolean
  hasNumber: boolean
  hasSymbol: boolean
  poolSize: number
  entropyBits: number
  strength: 'weak' | 'fair' | 'good' | 'strong'
  score: number // 0-100
  crackTime: string
  suggestions: string[]
}

function formatTime(seconds: number): string {
  if (seconds < 1) return 'instantly'
  if (seconds < 60) return `${Math.round(seconds)} seconds`
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`
  const years = seconds / 31536000
  if (years < 1000) return `${Math.round(years)} years`
  if (years < 1e6) return `${Math.round(years / 1000)} thousand years`
  if (years < 1e9) return `${Math.round(years / 1e6)} million years`
  if (years < 1e12) return `${Math.round(years / 1e9)} billion years`
  return `${(years / 1e12).toExponential(2)} trillion years`
}

function analyze(pw: string): Analysis {
  const hasUpper = /[A-Z]/.test(pw)
  const hasLower = /[a-z]/.test(pw)
  const hasNumber = /[0-9]/.test(pw)
  const hasSymbol = /[^A-Za-z0-9]/.test(pw)
  const length = pw.length

  let poolSize = 0
  if (hasUpper) poolSize += 26
  if (hasLower) poolSize += 26
  if (hasNumber) poolSize += 10
  if (hasSymbol) poolSize += 33

  const entropyBits = length > 0 && poolSize > 0
    ? Math.round(length * Math.log2(poolSize))
    : 0

  // 10 billion guesses per second (offline fast attack)
  const guesses = Math.pow(2, entropyBits)
  const seconds = guesses / 1e10
  const crackTime = formatTime(seconds)

  let score = 0
  if (length >= 8) score += 20
  if (length >= 12) score += 15
  if (length >= 16) score += 15
  if (hasUpper) score += 10
  if (hasLower) score += 10
  if (hasNumber) score += 10
  if (hasSymbol) score += 15
  if (length >= 20) score += 5
  score = Math.min(score, 100)

  let strength: Analysis['strength'] = 'weak'
  if (entropyBits >= 100) strength = 'strong'
  else if (entropyBits >= 60) strength = 'good'
  else if (entropyBits >= 36) strength = 'fair'

  const suggestions: string[] = []
  if (length < 8) suggestions.push('Use at least 8 characters')
  else if (length < 12) suggestions.push('Consider 12+ characters for stronger protection')
  if (!hasUpper) suggestions.push('Add uppercase letters')
  if (!hasLower) suggestions.push('Add lowercase letters')
  if (!hasNumber) suggestions.push('Add numbers')
  if (!hasSymbol) suggestions.push('Add symbols (!@#$%)')
  if (/^(.)\1+$/.test(pw)) suggestions.push('Avoid repeated characters')
  if (/^[0-9]+$/.test(pw) && length) suggestions.push('Avoid all-numeric PINs')

  return {
    length,
    hasUpper,
    hasLower,
    hasNumber,
    hasSymbol,
    poolSize,
    entropyBits,
    strength,
    score,
    crackTime,
    suggestions,
  }
}

const STRENGTH_STYLES: Record<
  Analysis['strength'],
  { color: string; label: string; bg: string }
> = {
  weak: { color: 'text-rose-600', label: 'Weak', bg: 'bg-rose-500' },
  fair: { color: 'text-amber-600', label: 'Fair', bg: 'bg-amber-500' },
  good: { color: 'text-emerald-600', label: 'Good', bg: 'bg-emerald-500' },
  strong: { color: 'text-emerald-700', label: 'Strong', bg: 'bg-emerald-600' },
}

function Criterion({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-2 text-sm ${
        ok ? 'text-emerald-600' : 'text-muted-foreground'
      }`}
    >
      <div
        className={`flex h-5 w-5 items-center justify-center rounded-full ${
          ok ? 'bg-emerald-100' : 'bg-muted'
        }`}
      >
        {ok ? (
          <ShieldCheck className="h-3.5 w-3.5" />
        ) : (
          <span className="text-xs">—</span>
        )}
      </div>
      <span className={ok ? 'font-medium' : ''}>{label}</span>
    </div>
  )
}

export default function PasswordStrengthChecker() {
  const [pw, setPw] = React.useState('')
  const [show, setShow] = React.useState(false)
  const a = React.useMemo(() => analyze(pw), [pw])
  const style = STRENGTH_STYLES[a.strength]

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-2">
          <KeyRound className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Enter a password to check</h2>
        </div>
        <FieldLabel>Password</FieldLabel>
        <div className="relative">
          <Input
            type={show ? 'text' : 'password'}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Type your password…"
            className="pr-12 font-mono"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-9 w-9"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" />
          Your password never leaves your browser. Analysis is performed
          entirely on-device.
        </p>
      </ToolCardWrapper>

      {pw && (
        <>
          <ToolCardWrapper>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <FieldLabel className="mb-0">Strength</FieldLabel>
              <Badge className={style.color}>
                {style.label}
              </Badge>
            </div>
            <Progress value={a.score} className={`h-3 ${style.bg}`} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <Stat label="Length" value={String(a.length)} />
              <Stat label="Entropy" value={`${a.entropyBits} bits`} />
              <Stat label="Char pool" value={String(a.poolSize)} />
              <Stat label="Score" value={`${a.score}/100`} />
            </div>
            <div className="mt-4 rounded-lg bg-muted p-3">
              <div className="text-xs text-muted-foreground mb-0.5">
                Estimated time to crack (offline, fast attack)
              </div>
              <div className={`text-base font-semibold ${style.color}`}>
                {a.crackTime}
              </div>
            </div>
          </ToolCardWrapper>

          <ToolCardWrapper>
            <FieldLabel>Character variety</FieldLabel>
            <div className="grid sm:grid-cols-2 gap-2 mt-1">
              <Criterion ok={a.length >= 8} label="At least 8 characters" />
              <Criterion ok={a.hasUpper} label="Uppercase letter (A-Z)" />
              <Criterion ok={a.hasLower} label="Lowercase letter (a-z)" />
              <Criterion ok={a.hasNumber} label="Number (0-9)" />
              <Criterion ok={a.hasSymbol} label="Symbol (!@#$%^&*)" />
              <Criterion ok={a.length >= 12} label="12+ characters" />
            </div>
          </ToolCardWrapper>

          {a.suggestions.length > 0 && (
            <ToolCardWrapper>
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                <h2 className="text-base font-semibold">Suggestions to improve</h2>
              </div>
              <ul className="space-y-2">
                {a.suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm rounded-md border border-border px-3 py-2"
                  >
                    <span className="text-amber-600 mt-0.5">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </ToolCardWrapper>
          )}
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold font-mono">{value}</div>
    </div>
  )
}
