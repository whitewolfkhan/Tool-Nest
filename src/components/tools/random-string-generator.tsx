'use client'

import * as React from 'react'
import { Dices, RefreshCw, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import {
  CopyButton,
  ToolCardWrapper,
  FieldLabel,
} from '@/components/tool-page-shell'

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  number: '0123456789',
  symbol: '!@#$%^&*()_+-=[]{}|;:,.<>?/~`',
  similar: 'il1Lo0O',
}

function secureRandomInt(maxExclusive: number): number {
  // Uniform random integer in [0, maxExclusive)
  if (maxExclusive <= 0) return 0
  const maxUint32 = 0xffffffff
  const limit = maxUint32 - (maxUint32 % maxExclusive)
  const arr = new Uint32Array(1)
  let val: number
  do {
    crypto.getRandomValues(arr)
    val = arr[0]
  } while (val >= limit)
  return val % maxExclusive
}

function generateString(
  length: number,
  opts: {
    lower: boolean
    upper: boolean
    number: boolean
    symbol: boolean
    excludeSimilar: boolean
  }
): string {
  let pool = ''
  if (opts.lower) pool += SETS.lower
  if (opts.upper) pool += SETS.upper
  if (opts.number) pool += SETS.number
  if (opts.symbol) pool += SETS.symbol
  if (opts.excludeSimilar) {
    pool = pool
      .split('')
      .filter((c) => !SETS.similar.includes(c))
      .join('')
  }
  if (pool.length === 0) return ''
  const chars: string[] = []
  for (let i = 0; i < length; i++) {
    chars.push(pool[secureRandomInt(pool.length)])
  }
  return chars.join('')
}

export default function RandomStringGenerator() {
  const [length, setLength] = React.useState(16)
  const [count, setCount] = React.useState(5)
  const [opts, setOpts] = React.useState({
    lower: true,
    upper: true,
    number: true,
    symbol: false,
    excludeSimilar: false,
  })
  const [results, setResults] = React.useState<string[]>([])

  const noCharset =
    !opts.lower && !opts.upper && !opts.number && !opts.symbol

  const generate = () => {
    if (noCharset) {
      toast.error('Select at least one character set')
      return
    }
    const list: string[] = []
    for (let i = 0; i < count; i++) {
      list.push(generateString(length, opts))
    }
    setResults(list)
    toast.success(`Generated ${count} strings`)
  }

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(results.join('\n'))
      toast.success('Copied all strings')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const toggle = (k: keyof typeof opts) =>
    setOpts((o) => ({ ...o, [k]: !o[k] }))

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-4">
          <Dices className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Options</h2>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel className="mb-0">Length</FieldLabel>
              <Badge variant="secondary" className="font-mono">
                {length} chars
              </Badge>
            </div>
            <Slider
              min={4}
              max={256}
              step={1}
              value={[length]}
              onValueChange={(v) => setLength(v[0])}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <FieldLabel className="mb-0">Count</FieldLabel>
              <Badge variant="secondary" className="font-mono">
                {count} strings
              </Badge>
            </div>
            <Slider
              min={1}
              max={50}
              step={1}
              value={[count]}
              onValueChange={(v) => setCount(v[0])}
            />
          </div>

          <div>
            <FieldLabel>Character sets</FieldLabel>
            <div className="grid sm:grid-cols-2 gap-2 mt-1">
              <ToggleRow
                id="rs-lower"
                label="Lowercase (a-z)"
                checked={opts.lower}
                onCheck={() => toggle('lower')}
              />
              <ToggleRow
                id="rs-upper"
                label="Uppercase (A-Z)"
                checked={opts.upper}
                onCheck={() => toggle('upper')}
              />
              <ToggleRow
                id="rs-num"
                label="Numbers (0-9)"
                checked={opts.number}
                onCheck={() => toggle('number')}
              />
              <ToggleRow
                id="rs-sym"
                label="Symbols (!@#$)"
                checked={opts.symbol}
                onCheck={() => toggle('symbol')}
              />
              <ToggleRow
                id="rs-sim"
                label="Exclude similar (il1Lo0O)"
                checked={opts.excludeSimilar}
                onCheck={() => toggle('excludeSimilar')}
              />
            </div>
          </div>
        </div>

        <Button onClick={generate} className="w-full mt-4 gap-2" disabled={noCharset}>
          <RefreshCw className="h-4 w-4" />
          Generate {count} random strings
        </Button>
        {noCharset && (
          <p className="text-xs text-rose-600 mt-2 text-center">
            Please select at least one character set above.
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Uses <code>crypto.getRandomValues</code> for cryptographically secure
          randomness.
        </p>
      </ToolCardWrapper>

      {results.length > 0 && (
        <ToolCardWrapper>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <FieldLabel className="mb-0">Generated strings</FieldLabel>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyAll}
                className="gap-1.5"
              >
                <Copy className="h-4 w-4" /> Copy all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={generate}
                className="gap-1.5"
              >
                <RefreshCw className="h-4 w-4" /> Regenerate
              </Button>
            </div>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {results.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-muted-foreground font-mono w-6">
                    {i + 1}
                  </span>
                  <code className="text-sm font-mono break-all">{s}</code>
                </div>
                <CopyButton text={s} label="" />
              </div>
            ))}
          </div>
        </ToolCardWrapper>
      )}
    </div>
  )
}

function ToggleRow({
  id,
  label,
  checked,
  onCheck,
}: {
  id: string
  label: string
  checked: boolean
  onCheck: () => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <Label htmlFor={id} className="text-sm cursor-pointer">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheck} />
    </div>
  )
}
