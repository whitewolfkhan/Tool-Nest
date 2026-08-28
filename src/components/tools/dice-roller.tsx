'use client'

import * as React from 'react'
import { Dices, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'

const SIDES: Record<string, { label: string; value: number }> = {
  d4: { label: 'd4', value: 4 },
  d6: { label: 'd6', value: 6 },
  d8: { label: 'd8', value: 8 },
  d10: { label: 'd10', value: 10 },
  d12: { label: 'd12', value: 12 },
  d20: { label: 'd20', value: 20 },
  d100: { label: 'd100', value: 100 },
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

export default function DiceRoller() {
  const [numDice, setNumDice] = React.useState(2)
  const [sideKey, setSideKey] = React.useState<keyof typeof SIDES>('d20')
  const [modifier, setModifier] = React.useState(0)
  const [results, setResults] = React.useState<number[]>([])
  const [rolling, setRolling] = React.useState(false)
  const [history, setHistory] = React.useState<
    { results: number[]; modifier: number; total: number; sides: number }[]
  >([])

  const sides = SIDES[sideKey].value

  const roll = () => {
    setRolling(true)
    const startTime = Date.now()
    // animate fake values during a 400ms spin
    const spinInterval = setInterval(() => {
      const fake = Array.from({ length: numDice }, () =>
        secureRandomInt(sides) + 1
      )
      setResults(fake)
      if (Date.now() - startTime > 380) {
        clearInterval(spinInterval)
        const final = Array.from({ length: numDice }, () =>
          secureRandomInt(sides) + 1
        )
        setResults(final)
        const sum = final.reduce((a, b) => a + b, 0) + modifier
        setHistory((h) =>
          [
            { results: final, modifier, total: sum, sides },
            ...h,
          ].slice(0, 10)
        )
        setRolling(false)
        toast.success(`Rolled ${numDice}${sideKey} → ${sum}`)
      }
    }, 60)
  }

  const reset = () => {
    setResults([])
    setHistory([])
    setModifier(0)
  }

  const total = results.reduce((a, b) => a + b, 0)
  const grandTotal = total + modifier

  return (
    <div className="space-y-4">
      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-4">
          <Dices className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Dice Configuration</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel>Number of dice</FieldLabel>
            <Input
              type="number"
              min={1}
              max={10}
              value={numDice}
              onChange={(e) =>
                setNumDice(
                  Math.max(1, Math.min(10, Number(e.target.value) || 1))
                )
              }
            />
          </div>
          <div>
            <FieldLabel>Dice sides</FieldLabel>
            <Select
              value={sideKey}
              onValueChange={(v) => setSideKey(v as keyof typeof SIDES)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SIDES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label} ({v.value} sides)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>Modifier (±)</FieldLabel>
            <Input
              type="number"
              value={modifier}
              onChange={(e) => setModifier(Number(e.target.value) || 0)}
            />
          </div>
        </div>

        <Button
          onClick={roll}
          disabled={rolling}
          className="w-full mt-4 gap-2 h-11 text-base"
        >
          <Dices className={`h-5 w-5 ${rolling ? 'animate-spin' : ''}`} />
          {rolling ? 'Rolling…' : `Roll ${numDice}${sideKey}${modifier >= 0 ? '+' : ''}${modifier || ''}`}
        </Button>
      </ToolCardWrapper>

      {results.length > 0 && (
        <ToolCardWrapper>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <FieldLabel className="mb-0">Dice results</FieldLabel>
            <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex h-16 w-16 flex-col items-center justify-center rounded-xl border-2 border-primary/30 bg-background shadow-sm ${
                  rolling ? 'animate-pulse' : ''
                }`}
              >
                <div className="text-2xl font-bold">{r}</div>
                <div className="text-[10px] text-muted-foreground">
                  {sideKey}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-5">
            <Stat label="Dice sum" value={String(total)} />
            <Stat
              label="Modifier"
              value={modifier >= 0 ? `+${modifier}` : String(modifier)}
            />
            <Stat label="Total" value={String(grandTotal)} highlight />
          </div>
        </ToolCardWrapper>
      )}

      {history.length > 0 && (
        <ToolCardWrapper>
          <div className="flex items-center gap-2 mb-3">
            <Label className="text-base font-semibold">History (last 10)</Label>
            <Badge variant="secondary">{history.length}</Badge>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <div className="font-mono text-xs text-muted-foreground">
                  #{history.length - i}
                </div>
                <div className="flex gap-1.5">
                  {h.results.map((r, j) => (
                    <span
                      key={j}
                      className="flex h-7 w-7 items-center justify-center rounded bg-muted text-xs font-mono"
                    >
                      {r}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {h.modifier >= 0 ? `+${h.modifier}` : h.modifier} mod
                </div>
                <div className="font-semibold font-mono">{h.total}</div>
              </div>
            ))}
          </div>
        </ToolCardWrapper>
      )}
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
    <div
      className={`rounded-lg border p-3 text-center ${
        highlight
          ? 'border-primary bg-primary/5'
          : 'border-border'
      }`}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`text-2xl font-bold font-mono ${
          highlight ? 'text-primary' : ''
        }`}
      >
        {value}
      </div>
    </div>
  )
}
