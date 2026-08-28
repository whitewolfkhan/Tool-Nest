'use client'

import * as React from 'react'
import { RefreshCw, Copy, Check, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'
import { toast } from 'sonner'

const SETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  number: '0123456789',
  symbol: '!@#$%^&*()-_=+[]{};:,.?/~',
}

const AMBIGUOUS = new Set(['I', 'l', 'O', '0', '1', '|', '`'])

function secureRandomInt(maxExclusive: number): number {
  // Rejection sampling for uniform distribution
  const range = 256 - (256 % maxExclusive)
  const buf = new Uint8Array(1)
  while (true) {
    crypto.getRandomValues(buf)
    if (buf[0] < range) return buf[0] % maxExclusive
  }
}

interface PwOptions {
  length: number
  upper: boolean
  lower: boolean
  number: boolean
  symbol: boolean
  excludeAmbiguous: boolean
}

function generatePassword(opts: PwOptions): string {
  let pool = ''
  if (opts.upper) pool += SETS.upper
  if (opts.lower) pool += SETS.lower
  if (opts.number) pool += SETS.number
  if (opts.symbol) pool += SETS.symbol
  if (opts.excludeAmbiguous) {
    pool = pool
      .split('')
      .filter((c) => !AMBIGUOUS.has(c))
      .join('')
  }
  if (!pool) return ''
  const out: string[] = []
  for (let i = 0; i < opts.length; i++) {
    out.push(pool[secureRandomInt(pool.length)])
  }
  return out.join('')
}

function scorePassword(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '—', color: 'bg-muted' }
  let charsetSize = 0
  if (/[a-z]/.test(pw)) charsetSize += 26
  if (/[A-Z]/.test(pw)) charsetSize += 26
  if (/[0-9]/.test(pw)) charsetSize += 10
  if (/[^a-zA-Z0-9]/.test(pw)) charsetSize += 32
  const entropy = pw.length * Math.log2(charsetSize || 1)
  if (entropy < 28) return { score: 1, label: 'Very weak', color: 'bg-red-500' }
  if (entropy < 40) return { score: 2, label: 'Weak', color: 'bg-orange-500' }
  if (entropy < 56) return { score: 3, label: 'Fair', color: 'bg-amber-500' }
  if (entropy < 80) return { score: 4, label: 'Strong', color: 'bg-emerald-500' }
  return { score: 5, label: 'Very strong', color: 'bg-emerald-600' }
}

export default function PasswordGenerator() {
  const [opts, setOpts] = React.useState<PwOptions>({
    length: 16,
    upper: true,
    lower: true,
    number: true,
    symbol: true,
    excludeAmbiguous: false,
  })
  const [password, setPassword] = React.useState('')
  const [autoRegen, setAutoRegen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const regenerate = React.useCallback(() => {
    const next = generatePassword(opts)
    setPassword(next)
  }, [opts])

  React.useEffect(() => {
    regenerate()
  }, [regenerate])

  React.useEffect(() => {
    if (autoRegen) regenerate()
  }, [autoRegen, regenerate])

  const strength = scorePassword(password)

  const copy = async () => {
    if (!password) return
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      toast.success('Password copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const optsList: { key: keyof Omit<PwOptions, 'length' | 'excludeAmbiguous'>; label: string; sub: string }[] = [
    { key: 'upper', label: 'Uppercase (A-Z)', sub: 'ABC' },
    { key: 'lower', label: 'Lowercase (a-z)', sub: 'abc' },
    { key: 'number', label: 'Numbers (0-9)', sub: '012' },
    { key: 'symbol', label: 'Symbols', sub: '!@#$' },
  ]

  const noCharSets = !opts.upper && !opts.lower && !opts.number && !opts.symbol

  return (
    <ToolCardWrapper>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Password display */}
        <div className="space-y-4">
          <div>
            <FieldLabel>Generated password</FieldLabel>
            <div className="relative">
              <Input
                value={password}
                readOnly
                placeholder="Click generate..."
                className="font-mono text-lg sm:text-xl h-14 pr-28"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1.5">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-10 w-10"
                  onClick={copy}
                  disabled={!password}
                  aria-label="Copy password"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  className="h-10 w-10"
                  onClick={regenerate}
                  disabled={noCharSets}
                  aria-label="Regenerate password"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Strength meter */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs text-muted-foreground">Strength</span>
              <Badge
                variant="outline"
                className={`text-xs border-0 text-white ${strength.color}`}
              >
                {strength.label}
              </Badge>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full ${
                    i <= strength.score ? strength.color : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Based on length and character-set entropy (~{password ? Math.round(password.length * Math.log2((opts.upper ? 26 : 0) + (opts.lower ? 26 : 0) + (opts.number ? 10 : 0) + (opts.symbol ? 32 : 0))) : 0} bits)
            </p>
          </div>

          {noCharSets && (
            <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-3 text-xs text-amber-800 dark:text-amber-300">
              Select at least one character set on the right to generate a password.
            </div>
          )}
        </div>

        {/* Options */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="pw-length" className="text-sm font-medium">Length</Label>
              <Badge variant="secondary" className="font-mono">{opts.length}</Badge>
            </div>
            <Slider
              id="pw-length"
              min={4}
              max={64}
              step={1}
              value={[opts.length]}
              onValueChange={([v]) => setOpts((o) => ({ ...o, length: v }))}
            />
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
              <span>4</span><span>16</span><span>32</span><span>64</span>
            </div>
          </div>

          <div className="space-y-2">
            {optsList.map((o) => (
              <label
                key={o.key}
                htmlFor={`pw-${o.key}`}
                className="flex items-center justify-between gap-3 rounded-md border border-border p-2.5 cursor-pointer hover:bg-accent/40 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    id={`pw-${o.key}`}
                    checked={opts[o.key]}
                    onCheckedChange={(v) => setOpts((s) => ({ ...s, [o.key]: !!v }))}
                  />
                  <span className="text-sm">{o.label}</span>
                </div>
                <code className="font-mono text-xs text-muted-foreground">{o.sub}</code>
              </label>
            ))}

            <label
              htmlFor="pw-amb"
              className="flex items-center justify-between gap-3 rounded-md border border-border p-2.5 cursor-pointer hover:bg-accent/40 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Checkbox
                  id="pw-amb"
                  checked={opts.excludeAmbiguous}
                  onCheckedChange={(v) => setOpts((s) => ({ ...s, excludeAmbiguous: !!v }))}
                />
                <span className="text-sm">Exclude ambiguous (IlO0|)</span>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between rounded-md border border-border p-2.5">
            <div>
              <Label htmlFor="pw-auto" className="text-sm">Auto-regenerate</Label>
              <p className="text-xs text-muted-foreground">Refresh on option change</p>
            </div>
            <Switch
              id="pw-auto"
              checked={autoRegen}
              onCheckedChange={setAutoRegen}
            />
          </div>

          <Button onClick={regenerate} className="w-full gap-2" disabled={noCharSets}>
            <RefreshCw className="h-4 w-4" /> Generate password
          </Button>
        </div>
      </div>
    </ToolCardWrapper>
  )
}
