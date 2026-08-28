'use client'

import * as React from 'react'
import { Clock, Zap, Hourglass, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ToolCardWrapper, FieldLabel, CopyButton } from '@/components/tool-page-shell'

type Unit = 'ms' | 's' | 'min' | 'h' | 'd' | 'w' | 'mo' | 'y'

const UNITS: { id: Unit; label: string; short: string; icon: React.ElementType; perMs: number }[] = [
  { id: 'ms', label: 'Milliseconds', short: 'ms', icon: Zap, perMs: 1 },
  { id: 's', label: 'Seconds', short: 's', icon: Clock, perMs: 1000 },
  { id: 'min', label: 'Minutes', short: 'min', icon: Clock, perMs: 60 * 1000 },
  { id: 'h', label: 'Hours', short: 'h', icon: Clock, perMs: 60 * 60 * 1000 },
  { id: 'd', label: 'Days', short: 'd', icon: Hourglass, perMs: 24 * 60 * 60 * 1000 },
  { id: 'w', label: 'Weeks', short: 'wk', icon: Calendar, perMs: 7 * 24 * 60 * 60 * 1000 },
  // month = 30.436875 days (1/12 of a 365.2425-day year)
  { id: 'mo', label: 'Months', short: 'mo', icon: Calendar, perMs: (365.2425 / 12) * 24 * 60 * 60 * 1000 },
  { id: 'y', label: 'Years', short: 'yr', icon: Calendar, perMs: 365.2425 * 24 * 60 * 60 * 1000 },
]

function formatNum(n: number): string {
  if (!isFinite(n) || isNaN(n)) return '—'
  if (n === 0) return '0'
  const abs = Math.abs(n)
  if (abs >= 1e15 || (abs < 1e-6 && abs > 0)) return n.toExponential(4)
  const str = n.toPrecision(12).replace(/\.?0+$/, '')
  const [intPart, decPart] = str.split('.')
  const intFmt = Number(intPart).toLocaleString('en-US', { maximumFractionDigits: 0 })
  return decPart ? `${intFmt}.${decPart}` : intFmt
}

export default function TimeConverter() {
  const [values, setValues] = React.useState<Record<Unit, string>>({
    ms: '60000',
    s: '60',
    min: '1',
    h: '0.016667',
    d: '0.000694',
    w: '0.0000992',
    mo: '0.0000228',
    y: '0.0000019',
  })
  const [lastEdited, setLastEdited] = React.useState<Unit>('min')

  const handleChange = (unit: Unit, raw: string) => {
    setLastEdited(unit)
    const num = parseFloat(raw)
    if (isNaN(num)) {
      const cleared: Record<Unit, string> = { ...values }
      UNITS.forEach((u) => {
        cleared[u.id] = u.id === unit ? raw : ''
      })
      setValues(cleared)
      return
    }
    const ms = num * UNITS.find((u) => u.id === unit)!.perMs
    const next: Record<Unit, string> = { ...values }
    next[unit] = raw
    UNITS.forEach((u) => {
      if (u.id !== unit) {
        next[u.id] = formatNum(ms / u.perMs)
      }
    })
    setValues(next)
  }

  // Reference points
  const refs = [
    { label: '1 Second', ms: 1000 },
    { label: '1 Minute', ms: 60000 },
    { label: '1 Hour', ms: 3600000 },
    { label: '1 Day', ms: 86400000 },
    { label: '1 Week', ms: 7 * 86400000 },
    { label: '1 Year', ms: 365.2425 * 86400000 },
  ]

  return (
    <ToolCardWrapper>
      {/* Inputs grid — 2 cols */}
      <div className="grid gap-4 sm:grid-cols-2">
        {UNITS.map((u) => (
          <div key={u.id}>
            <FieldLabel>
              <span className="flex items-center gap-2">
                <u.icon className="h-4 w-4 text-muted-foreground" />
                {u.label}
                <span className="text-muted-foreground font-normal">({u.short})</span>
              </span>
            </FieldLabel>
            <div className="flex gap-2">
              <Input
                type="number"
                inputMode="decimal"
                value={values[u.id]}
                onChange={(e) => handleChange(u.id, e.target.value)}
                placeholder="—"
                className="font-mono text-base"
              />
              <CopyButton text={values[u.id]} label="" className="px-2.5" />
            </div>
          </div>
        ))}
      </div>

      <Separator className="my-6" />

      {/* Active formula */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
          Active Conversion
        </div>
        <p className="font-mono text-sm break-words">
          {values[lastEdited] || '—'}{' '}
          <span className="text-muted-foreground">{UNITS.find((u) => u.id === lastEdited)?.short}</span>
          <span className="mx-2 text-muted-foreground">=</span>
          <span className="font-semibold text-primary">{values.h || '—'}</span>
          <span className="text-muted-foreground"> h</span>
          <span className="mx-2 text-muted-foreground">·</span>
          <span className="font-semibold text-primary">{values.d || '—'}</span>
          <span className="text-muted-foreground"> days</span>
          <span className="mx-2 text-muted-foreground">·</span>
          <span className="font-semibold text-primary">{values.s || '—'}</span>
          <span className="text-muted-foreground"> s</span>
        </p>
      </div>

      {/* Quick reference */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-2">Quick References</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {refs.map((r) => (
            <button
              key={r.label}
              onClick={() => handleChange('ms', String(r.ms))}
              className="text-left rounded-lg border border-border bg-background p-2.5 hover:border-primary/40 hover:bg-accent transition-colors"
            >
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{r.label}</div>
              <div className="font-mono text-xs">
                {formatNum(r.ms / UNITS.find((u) => u.id === 's')!.perMs)} s ·{' '}
                {formatNum(r.ms / UNITS.find((u) => u.id === 'min')!.perMs)} min
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="mt-6 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">Notes</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Year is based on the Gregorian average: <strong>365.2425 days</strong>.</li>
          <li>Month is defined as 1/12 of a year: <strong>30.436875 days</strong>.</li>
          <li>Week = 7 days · Day = 24 hours · Hour = 60 min · Min = 60 s · Second = 1000 ms.</li>
        </ul>
      </div>
    </ToolCardWrapper>
  )
}
