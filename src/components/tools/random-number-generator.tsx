'use client'

import * as React from 'react'
import { Hash, RefreshCw, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import {
  ToolCardWrapper,
  FieldLabel,
} from '@/components/tool-page-shell'

interface Options {
  min: number
  max: number
  count: number
  unique: boolean
  integer: boolean
  decimals: number
}

function secureRandomInt(maxExclusive: number): number {
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

function secureRandomFloat(): number {
  // Returns a float in [0, 1) using crypto.getRandomValues
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  return arr[0] / 0x100000000
}

function generate(opts: Options): { results: string[]; error?: string } {
  const { min, max, count, unique, integer, decimals } = opts
  if (min >= max) return { results: [], error: 'Min must be less than max.' }
  const range = max - min

  if (unique) {
    if (integer) {
      const totalInts = Math.floor(max) - Math.ceil(min) + 1
      if (count > totalInts) {
        return {
          results: [],
          error: `Cannot pick ${count} unique integers from a range of ${totalInts}.`,
        }
      }
      const pool: number[] = []
      const start = Math.ceil(min)
      const end = Math.floor(max)
      for (let i = start; i <= end; i++) pool.push(i)
      // Fisher-Yates partial shuffle
      for (let i = 0; i < count; i++) {
        const j = i + secureRandomInt(pool.length - i)
        ;[pool[i], pool[j]] = [pool[j], pool[i]]
      }
      return { results: pool.slice(0, count).map((n) => n.toString()) }
    }
    // Floats: very limited unique count, use random + small offset
    if (count > 1000) {
      return { results: [], error: 'Max 1000 results.' }
    }
    const seen = new Set<string>()
    const out: string[] = []
    while (out.length < count) {
      const v = min + secureRandomFloat() * range
      const k = v.toFixed(decimals)
      if (!seen.has(k)) {
        seen.add(k)
        out.push(k)
      }
      if (seen.size > 100000) break
    }
    return { results: out }
  }

  // Non-unique
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    if (integer) {
      const start = Math.ceil(min)
      const end = Math.floor(max)
      const v = start + secureRandomInt(end - start + 1)
      out.push(v.toString())
    } else {
      const v = min + secureRandomFloat() * range
      out.push(v.toFixed(decimals))
    }
  }
  return { results: out }
}

export default function RandomNumberGenerator() {
  const [opts, setOpts] = React.useState<Options>({
    min: 1,
    max: 100,
    count: 5,
    unique: false,
    integer: true,
    decimals: 2,
  })
  const [results, setResults] = React.useState<string[]>([])
  const [error, setError] = React.useState('')

  const generateNumbers = () => {
    const { results: r, error: e } = generate(opts)
    if (e) {
      setError(e)
      setResults([])
      toast.error(e)
      return
    }
    setError(e || '')
    setResults(r)
    toast.success(`Generated ${r.length} numbers`)
  }

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(results.join('\n'))
      toast.success('Copied all numbers')
    } catch {
      toast.error('Failed to copy')
    }
  }

  const update = <K extends keyof Options>(k: K, v: Options[K]) =>
    setOpts((o) => ({ ...o, [k]: v }))

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-4">
          <Hash className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Options</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Minimum</FieldLabel>
            <Input
              type="number"
              value={opts.min}
              onChange={(e) => update('min', Number(e.target.value))}
              className="font-mono"
            />
          </div>
          <div>
            <FieldLabel>Maximum</FieldLabel>
            <Input
              type="number"
              value={opts.max}
              onChange={(e) => update('max', Number(e.target.value))}
              className="font-mono"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <FieldLabel className="mb-0">How many</FieldLabel>
            <Badge variant="secondary" className="font-mono">
              {opts.count}
            </Badge>
          </div>
          <Slider
            min={1}
            max={1000}
            step={1}
            value={[opts.count]}
            onValueChange={(v) => update('count', v[0])}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="ng-int" className="text-sm">Integers only</Label>
              <p className="text-xs text-muted-foreground">No decimals</p>
            </div>
            <Switch
              id="ng-int"
              checked={opts.integer}
              onCheckedChange={(v) => update('integer', v)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="ng-uniq" className="text-sm">Unique values</Label>
              <p className="text-xs text-muted-foreground">No duplicates</p>
            </div>
            <Switch
              id="ng-uniq"
              checked={opts.unique}
              onCheckedChange={(v) => update('unique', v)}
            />
          </div>
        </div>

        {!opts.integer && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <FieldLabel className="mb-0">Decimals</FieldLabel>
              <Badge variant="secondary" className="font-mono">
                {opts.decimals} places
              </Badge>
            </div>
            <Slider
              min={0}
              max={10}
              step={1}
              value={[opts.decimals]}
              onValueChange={(v) => update('decimals', v[0])}
            />
          </div>
        )}

        <Button onClick={generateNumbers} className="w-full mt-4 gap-2 h-11">
          <RefreshCw className="h-4 w-4" /> Generate {opts.count} numbers
        </Button>
        {error && (
          <p className="text-xs text-rose-600 mt-2 text-center">{error}</p>
        )}
      </ToolCardWrapper>

      {results.length > 0 && (
        <ToolCardWrapper>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <FieldLabel className="mb-0">Results</FieldLabel>
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
                onClick={generateNumbers}
                className="gap-1.5"
              >
                <RefreshCw className="h-4 w-4" /> Regenerate
              </Button>
            </div>
          </div>
          {results.length <= 50 ? (
            <div className="flex flex-wrap gap-2">
              {results.map((r, i) => (
                <span
                  key={i}
                  className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm font-mono hover:bg-accent transition-colors"
                >
                  {r}
                </span>
              ))}
            </div>
          ) : (
            <pre className="rounded-lg bg-muted p-4 text-sm font-mono overflow-x-auto max-h-96 overflow-y-auto">
              {results.join('\n')}
            </pre>
          )}
        </ToolCardWrapper>
      )}
    </div>
  )
}
