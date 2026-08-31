'use client'

import * as React from 'react'
import {
  Eye,
  EyeOff,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Lock,
  Zap,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ToolCardWrapper,
  FieldLabel,
} from '@/components/tool-page-shell'
import { cn } from '@/lib/utils'

// Top 100 most common leaked passwords (subset, lowercase)
const COMMON_PASSWORDS = new Set([
  '123456', 'password', '123456789', '12345678', '12345', 'qwerty', 'abc123',
  '111111', '1234567', '123123', 'admin', 'letmein', 'welcome', 'monkey',
  'password1', '1234', '1234567890', 'football', 'iloveyou', 'sunshine',
  'princess', 'qwerty123', '000000', 'azerty', 'dragon', '1q2w3e4r',
  'pass', 'pass123', 'pass1234', 'password123', 'qwertyuiop', 'baseball',
  'superman', 'batman', 'michael', 'jordan', 'harley', 'david', 'george',
  'robert', 'thomas', 'hockey', 'ranger', 'daniel', 'starwars', 'klaster',
  'computer', 'george', 'charlie', 'andrea', 'jessica', 'joshua', 'michael1',
  'summer', 'winter', '1990', '1991', '1992', '1993', '1994', '1995',
  '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004',
  '2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013',
  '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022',
  '2023', '2024', '2025', 'master', 'fuck', 'fuckyou', 'fuckoff',
  'ashley', 'bailey', 'shadow', '123abc', '654321', '777777', '888888',
])

const KEYBOARD_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

interface Analysis {
  length: number
  hasUpper: boolean
  hasLower: boolean
  hasDigit: boolean
  hasSymbol: boolean
  uniqueChars: number
  charsetSize: number
  entropyBits: number
  isCommon: boolean
  patterns: string[]
  crackTimes: { label: string; value: string; detail: string }[]
  recommendations: string[]
  score: number // 0-4
  label: string
  color: string
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return 'instant'
  if (seconds < 1) return '< 1 second'
  if (seconds < 60) return `${Math.round(seconds)} seconds`
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`
  if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`
  if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`
  const years = seconds / 31536000
  if (years < 1000) return `${Math.round(years)} years`
  if (years < 1_000_000) return `${Math.round(years / 1000)}K years`
  if (years < 1_000_000_000) return `${Math.round(years / 1_000_000)}M years`
  if (years < 1e12) return `${Math.round(years / 1e9)}B years`
  return 'centuries (essentially uncrackable)'
}

function detectPatterns(pw: string): string[] {
  const lower = pw.toLowerCase()
  const out: string[] = []

  // Sequential alphabetical (3+)
  for (let i = 0; i < lower.length - 2; i++) {
    const a = lower.charCodeAt(i)
    const b = lower.charCodeAt(i + 1)
    const c = lower.charCodeAt(i + 2)
    if (b === a + 1 && c === b + 1) {
      out.push(`Sequential: "${lower.slice(i, i + 3)}..."`)
      break
    }
    if (b === a - 1 && c === b - 1) {
      out.push(`Reverse sequential: "${lower.slice(i, i + 3)}..."`)
      break
    }
  }

  // Sequential digits (3+)
  for (let i = 0; i < pw.length - 2; i++) {
    const sub = pw.slice(i, i + 3)
    if (/^\d{3}$/.test(sub)) {
      const a = parseInt(sub[0]!)
      const b = parseInt(sub[1]!)
      const c = parseInt(sub[2]!)
      if (b === a + 1 && c === b + 1) {
        out.push(`Numeric sequence: "${sub}"`)
        break
      }
    }
  }

  // Repeated chars (3+)
  if (/(.)\1\1/.test(pw)) {
    const m = pw.match(/(.)\1\1+/)
    if (m) out.push(`Repeated character: "${m[0]}"`)
  }

  // Keyboard patterns (4+)
  for (const row of KEYBOARD_ROWS) {
    for (let i = 0; i <= row.length - 4; i++) {
      const slice = row.slice(i, i + 4)
      if (lower.includes(slice)) {
        out.push(`Keyboard pattern: "${slice}"`)
      }
      const rev = slice.split('').reverse().join('')
      if (lower.includes(rev)) {
        out.push(`Keyboard pattern: "${rev}"`)
      }
    }
  }

  // Year pattern
  if (/(19|20)\d{2}/.test(pw)) {
    const m = pw.match(/(19|20)\d{2}/)
    if (m) out.push(`Looks like a year: "${m[0]}"`)
  }

  // Deduplicate
  return Array.from(new Set(out)).slice(0, 5)
}

function analyze(pw: string): Analysis | null {
  if (!pw) return null

  const hasUpper = /[A-Z]/.test(pw)
  const hasLower = /[a-z]/.test(pw)
  const hasDigit = /\d/.test(pw)
  const hasSymbol = /[^A-Za-z0-9]/.test(pw)

  const uniqueChars = new Set(pw).size
  let charsetSize = 0
  if (hasLower) charsetSize += 26
  if (hasUpper) charsetSize += 26
  if (hasDigit) charsetSize += 10
  if (hasSymbol) charsetSize += 33 // approximate printable ASCII symbols

  // Entropy: log2(charsetSize^length), reduced for low uniqueness
  let entropyBits = charsetSize > 0 ? Math.log2(charsetSize) * pw.length : 0
  // Penalize for low uniqueness (repeats reduce effective entropy)
  if (uniqueChars < pw.length) {
    const ratio = uniqueChars / pw.length
    entropyBits *= 0.5 + 0.5 * ratio
  }
  // Penalize common patterns
  const patterns = detectPatterns(pw)
  entropyBits = Math.max(0, entropyBits - patterns.length * 6)

  const isCommon = COMMON_PASSWORDS.has(pw.toLowerCase())

  // Crack time (seconds to exhaust half the keyspace)
  const halfSpace = Math.pow(2, entropyBits) / 2
  const crackTimes = [
    {
      label: 'Online attack (1,000/s)',
      value: formatTime(halfSpace / 1000),
      detail: 'Throttled web login attempts',
    },
    {
      label: 'Offline, slow hash (10⁴/s)',
      value: formatTime(halfSpace / 1e4),
      detail: 'bcrypt / scrypt on a single GPU',
    },
    {
      label: 'Offline, fast hash (10¹⁰/s)',
      value: formatTime(halfSpace / 1e10),
      detail: 'SHA-256 / MD5 on consumer GPU',
    },
    {
      label: 'Massive GPU array (10¹²/s)',
      value: formatTime(halfSpace / 1e12),
      detail: 'State-actor level hardware',
    },
  ]

  // Score: based on entropy + penalties
  let score = 0
  if (entropyBits >= 28) score = 1
  if (entropyBits >= 50) score = 2
  if (entropyBits >= 70) score = 3
  if (entropyBits >= 100) score = 4
  if (isCommon) score = 0
  if (pw.length < 8) score = Math.min(score, 1)
  if (patterns.length >= 3) score = Math.max(0, score - 1)

  const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong']
  const colors = [
    'text-rose-500',
    'text-orange-500',
    'text-amber-500',
    'text-emerald-500',
    'text-emerald-600',
  ]

  const recommendations: string[] = []
  if (pw.length < 12) recommendations.push('Use at least 12 characters (16+ is better).')
  if (!hasUpper) recommendations.push('Add uppercase letters (A–Z).')
  if (!hasLower) recommendations.push('Add lowercase letters (a–z).')
  if (!hasDigit) recommendations.push('Add digits (0–9).')
  if (!hasSymbol) recommendations.push('Add symbols (!@#$%^&*...).')
  if (uniqueChars < pw.length * 0.7) recommendations.push('Avoid repeated characters.')
  if (patterns.some((p) => p.includes('sequence') || p.includes('Keyboard'))) {
    recommendations.push('Avoid keyboard walks and sequential characters (abc, 123, qwerty).')
  }
  if (patterns.some((p) => p.includes('year'))) {
    recommendations.push('Avoid using years (birthdates, current year).')
  }
  if (isCommon) {
    recommendations.push('This password is in a common-password list — change it immediately.')
  }
  if (recommendations.length === 0) {
    recommendations.push('Excellent! Your password follows strong practices.')
  }

  return {
    length: pw.length,
    hasUpper,
    hasLower,
    hasDigit,
    hasSymbol,
    uniqueChars,
    charsetSize,
    entropyBits: Math.round(entropyBits * 10) / 10,
    isCommon,
    patterns,
    crackTimes,
    recommendations,
    score,
    label: labels[score] ?? 'Very weak',
    color: colors[score] ?? 'text-rose-500',
  }
}

export default function PasswordStrengthAnalyzer() {
  const [pw, setPw] = React.useState('')
  const [show, setShow] = React.useState(false)
  const analysis = React.useMemo(() => analyze(pw), [pw])

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="space-y-5">
          <div>
            <FieldLabel>Password</FieldLabel>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={show ? 'text' : 'password'}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="Type a password to analyze..."
                  className="pr-10 font-mono"
                  autoComplete="off"
                  spellCheck={false}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setPw('')}
                disabled={!pw}
              >
                Clear
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Your password is analyzed entirely in your browser — nothing is sent anywhere.
            </p>
          </div>

          {analysis && (
            <>
              {/* Strength meter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {analysis.score >= 3 ? (
                      <ShieldCheck className={cn('h-5 w-5', analysis.color)} />
                    ) : (
                      <ShieldAlert className={cn('h-5 w-5', analysis.color)} />
                    )}
                    <span className={cn('text-sm font-semibold', analysis.color)}>
                      {analysis.label}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Score: {analysis.score} / 4
                  </span>
                </div>
                <Progress
                  value={(analysis.score / 4) * 100}
                  className={cn(
                    'h-2',
                    analysis.score === 0 && '[&>div]:bg-rose-500',
                    analysis.score === 1 && '[&>div]:bg-orange-500',
                    analysis.score === 2 && '[&>div]:bg-amber-500',
                    analysis.score === 3 && '[&>div]:bg-emerald-500',
                    analysis.score === 4 && '[&>div]:bg-emerald-600'
                  )}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {/* Stats */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Composition</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Stat label="Length" value={`${analysis.length}`} />
                    <Stat label="Unique chars" value={`${analysis.uniqueChars}`} />
                    <Stat label="Charset size" value={`${analysis.charsetSize}`} />
                    <Stat
                      label="Entropy"
                      value={`${analysis.entropyBits} bits`}
                      highlight={analysis.entropyBits >= 70}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Check active={analysis.hasUpper} label="A-Z" />
                    <Check active={analysis.hasLower} label="a-z" />
                    <Check active={analysis.hasDigit} label="0-9" />
                    <Check active={analysis.hasSymbol} label="!@#" />
                  </div>

                  {analysis.isCommon && (
                    <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                      <ShieldAlert className="h-4 w-4 inline mr-1" />
                      This password is in a list of common passwords. It will be cracked almost instantly.
                    </div>
                  )}

                  {analysis.patterns.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold mb-1.5 text-muted-foreground">
                        Patterns detected
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.patterns.map((p, i) => (
                          <Badge key={i} variant="outline" className="text-amber-700 dark:text-amber-400 border-amber-500/40">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Crack times */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" />
                    Estimated crack time
                  </h3>
                  <div className="space-y-2">
                    {analysis.crackTimes.map((c, i) => {
                      const icon = [Zap, Lock, Lock, ShieldAlert][i] ?? Lock
                      const Icon = icon
                      return (
                        <div
                          key={i}
                          className="rounded-md border border-border bg-muted/30 p-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Icon className="h-3.5 w-3.5" />
                              {c.label}
                            </span>
                            <span className="font-mono text-sm font-semibold">{c.value}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">{c.detail}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Recommendations</h3>
                <ul className="space-y-1.5">
                  {analysis.recommendations.map((r, i) => {
                    const good = r.startsWith('Excellent')
                    return (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        {good ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        )}
                        <span className={good ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground'}>
                          {r}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </>
          )}

          {!analysis && (
            <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
              Start typing a password above to see a detailed analysis.
            </div>
          )}
        </div>
      </ToolCardWrapper>

      <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">How we calculate entropy</p>
        <p>
          Entropy (in bits) = <code className="font-mono">log₂(charsetSize) × length</code>, with
          penalties for low character uniqueness and detected patterns. Crack time assumes an
          attacker can test half of all possible combinations. Real-world attackers use dictionary
          and rule-based attacks which can crack even high-entropy passwords if they follow
          predictable patterns — so always use a unique password per site.
        </p>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={cn(
          'font-mono text-sm font-semibold',
          highlight && 'text-emerald-600 dark:text-emerald-400'
        )}
      >
        {value}
      </div>
    </div>
  )
}

function Check({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-mono',
        active
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          : 'border-border text-muted-foreground line-through opacity-60'
      )}
    >
      <CheckCircle2 className="h-3 w-3" />
      {label}
    </div>
  )
}
