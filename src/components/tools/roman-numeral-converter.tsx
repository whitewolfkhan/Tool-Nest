'use client'

import * as React from 'react'
import { ArrowLeftRight, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ToolCardWrapper, FieldLabel, CopyButton } from '@/components/tool-page-shell'
import { toast } from 'sonner'

// Roman numeral mapping
const ROMAN_VALUES: [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
]

function numToRoman(num: number): { result: string; steps: { numeral: string; value: number }[] } {
  let n = Math.floor(num)
  let out = ''
  const steps: { numeral: string; value: number }[] = []
  for (const [value, numeral] of ROMAN_VALUES) {
    while (n >= value) {
      out += numeral
      n -= value
      const existing = steps.find((s) => s.numeral === numeral)
      if (existing) {
        // we won't merge; instead push each occurrence
        steps.push({ numeral, value })
      } else {
        steps.push({ numeral, value })
      }
    }
  }
  // Consolidate consecutive identical numerals (e.g., "M + M" → "M × 2")
  const consolidated: { numeral: string; value: number; count: number }[] = []
  for (const step of steps) {
    const last = consolidated[consolidated.length - 1]
    if (last && last.numeral === step.numeral) {
      last.count++
    } else {
      consolidated.push({ ...step, count: 1 })
    }
  }
  // Build the steps with consolidated counts
  const finalSteps: { numeral: string; value: number }[] = []
  for (const c of consolidated) {
    if (c.count === 1) {
      finalSteps.push({ numeral: c.numeral, value: c.value })
    } else {
      // Multi-step: represent as multiplied entry
      finalSteps.push({ numeral: `${c.numeral} × ${c.count}`, value: c.value * c.count })
    }
  }
  return { result: out, steps: finalSteps }
}

function romanToNum(roman: string): number | null {
  const cleaned = roman.trim().toUpperCase()
  if (!cleaned) return null
  if (!/^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(cleaned)) {
    return null
  }
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
  let total = 0
  for (let i = 0; i < cleaned.length; i++) {
    const cur = map[cleaned[i]]
    const next = map[cleaned[i + 1]] ?? 0
    if (next > cur) {
      total -= cur
    } else {
      total += cur
    }
  }
  return total
}

// Build "explanation string" — e.g., "1994 = M (1000) + CM (900) + XC (90) + IV (4)"
function buildExplanation(num: number): string {
  let n = Math.floor(num)
  const parts: string[] = []
  for (const [value, numeral] of ROMAN_VALUES) {
    while (n >= value) {
      parts.push(`${numeral} (${value})`)
      n -= value
    }
  }
  return parts.length ? `${num} = ` + parts.join(' + ') : `${num} = (no value)`
}

export default function RomanNumeralConverter() {
  const [tab, setTab] = React.useState<'toRoman' | 'fromRoman'>('toRoman')
  const [numInput, setNumInput] = React.useState<string>('1994')
  const [romanInput, setRomanInput] = React.useState<string>('MCMXCIV')

  // To-Roman state
  const num = parseInt(numInput)
  const numValid = !isNaN(num) && num >= 1 && num <= 3999
  const numError = numInput !== '' && !numValid
  const toRomanResult = numValid ? numToRoman(num) : null
  const explanation = numValid ? buildExplanation(num) : ''

  // From-Roman state
  const romanNum = romanToNum(romanInput)
  const romanValid = romanNum !== null
  const romanError = romanInput.trim() !== '' && !romanValid
  const fromRomanExplanation = romanValid ? buildExplanation(romanNum!) : ''

  const handleNumBlur = () => {
    if (numInput !== '' && !numValid) {
      toast.error('Please enter a whole number between 1 and 3999.')
    }
  }

  const handleRomanBlur = () => {
    if (romanInput.trim() !== '' && !romanValid) {
      toast.error('Invalid Roman numeral. Use I, V, X, L, C, D, M only (max 3999 = MMMCMXCIX).')
    }
  }

  return (
    <ToolCardWrapper>
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'toRoman' | 'fromRoman')}>
        <TabsList className="grid w-full sm:w-auto grid-cols-2">
          <TabsTrigger value="toRoman" className="gap-1.5">
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Number → Roman
          </TabsTrigger>
          <TabsTrigger value="fromRoman" className="gap-1.5">
            <ArrowLeftRight className="h-3.5 w-3.5 rotate-90" />
            Roman → Number
          </TabsTrigger>
        </TabsList>

        {/* Number → Roman */}
        <TabsContent value="toRoman">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <FieldLabel>Decimal Number (1 – 3999)</FieldLabel>
              <Input
                type="number"
                min={1}
                max={3999}
                value={numInput}
                onChange={(e) => setNumInput(e.target.value)}
                onBlur={handleNumBlur}
                placeholder="e.g. 1994"
                className={numError ? 'border-destructive focus-visible:ring-destructive/30' : ''}
              />
              {numError && (
                <p className="mt-1.5 text-xs text-destructive">
                  Number must be an integer between 1 and 3999.
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {[1, 4, 9, 40, 90, 400, 900, 2024, 3999].map((n) => (
                  <button
                    key={n}
                    onClick={() => setNumInput(String(n))}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs hover:bg-accent transition-colors"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Roman Numeral</FieldLabel>
              <div className="flex gap-2">
                <div className="flex-1 rounded-md border border-border bg-muted/50 px-3 py-2 font-mono text-lg font-bold tracking-wider">
                  {toRomanResult?.result ?? '—'}
                </div>
                <CopyButton text={toRomanResult?.result ?? ''} label="Copy" />
              </div>
              {explanation && (
                <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-3">
                  <div className="text-xs font-semibold mb-1 flex items-center gap-1.5">
                    <Info className="h-3 w-3 text-primary" />
                    Conversion Explanation
                  </div>
                  <p className="font-mono text-sm break-words">{explanation}</p>
                </div>
              )}

              {toRomanResult && toRomanResult.steps.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold mb-1.5">Step-by-step</div>
                  <div className="flex flex-wrap gap-1.5">
                    {toRomanResult.steps.map((s, i) => (
                      <span
                        key={i}
                        className="rounded-md border border-border bg-background px-2 py-1 font-mono text-xs"
                      >
                        {s.numeral} = {s.value.toLocaleString()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Roman → Number */}
        <TabsContent value="fromRoman">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <FieldLabel>Roman Numeral</FieldLabel>
              <Input
                value={romanInput}
                onChange={(e) => setRomanInput(e.target.value.toUpperCase())}
                onBlur={handleRomanBlur}
                placeholder="e.g. MCMXCIV"
                className={`font-mono uppercase ${romanError ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                spellCheck={false}
              />
              {romanError && (
                <p className="mt-1.5 text-xs text-destructive">
                  Invalid Roman numeral — only I, V, X, L, C, D, M (max 3999).
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {['III', 'IV', 'IX', 'XL', 'XC', 'CD', 'CM', 'MCMXCIV', 'MMMCMXCIX'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRomanInput(r)}
                    className="rounded-md border border-border bg-background px-2 py-1 font-mono text-xs hover:bg-accent transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Decimal Number</FieldLabel>
              <div className="flex gap-2">
                <div className="flex-1 rounded-md border border-border bg-muted/50 px-3 py-2 font-mono text-lg font-bold">
                  {romanNum !== null ? romanNum.toLocaleString() : '—'}
                </div>
                <CopyButton text={romanNum !== null ? String(romanNum) : ''} label="Copy" />
              </div>
              {fromRomanExplanation && (
                <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/30 p-3">
                  <div className="text-xs font-semibold mb-1 flex items-center gap-1.5">
                    <Info className="h-3 w-3 text-primary" />
                    Conversion Explanation
                  </div>
                  <p className="font-mono text-sm break-words">{fromRomanExplanation}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Reference table */}
      <div className="mt-6 rounded-lg border border-border bg-muted/30 p-3">
        <div className="text-xs font-semibold mb-2">Roman Numeral Reference</div>
        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 text-center">
          {[
            { n: 'I', v: 1 },
            { n: 'V', v: 5 },
            { n: 'X', v: 10 },
            { n: 'L', v: 50 },
            { n: 'C', v: 100 },
            { n: 'D', v: 500 },
            { n: 'M', v: 1000 },
          ].map((x) => (
            <div key={x.n} className="rounded border border-border bg-background p-1.5">
              <div className="font-mono text-sm font-bold">{x.n}</div>
              <div className="text-[10px] text-muted-foreground">{x.v.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </ToolCardWrapper>
  )
}
