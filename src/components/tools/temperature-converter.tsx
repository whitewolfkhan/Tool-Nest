'use client'

import * as React from 'react'
import { Thermometer, Snowflake, Flame, Sun } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ToolCardWrapper, FieldLabel, CopyButton } from '@/components/tool-page-shell'

type Unit = 'celsius' | 'fahrenheit' | 'kelvin' | 'rankine'

const UNITS: { id: Unit; label: string; symbol: string; icon: React.ElementType }[] = [
  { id: 'celsius', label: 'Celsius', symbol: '°C', icon: Snowflake },
  { id: 'fahrenheit', label: 'Fahrenheit', symbol: '°F', icon: Flame },
  { id: 'kelvin', label: 'Kelvin', symbol: 'K', icon: Thermometer },
  { id: 'rankine', label: 'Rankine', symbol: '°R', icon: Sun },
]

// Convert any unit to Celsius as the canonical base
function toCelsius(unit: Unit, value: number): number {
  switch (unit) {
    case 'celsius': return value
    case 'fahrenheit': return (value - 32) * (5 / 9)
    case 'kelvin': return value - 273.15
    case 'rankine': return (value - 491.67) * (5 / 9)
  }
}

function fromCelsius(unit: Unit, celsius: number): number {
  switch (unit) {
    case 'celsius': return celsius
    case 'fahrenheit': return (celsius * 9) / 5 + 32
    case 'kelvin': return celsius + 273.15
    case 'rankine': return (celsius + 273.15) * (9 / 5)
  }
}

// Formulas for display
const FORMULAS: { from: Unit; to: Unit; formula: string }[] = [
  { from: 'celsius', to: 'fahrenheit', formula: '°F = (°C × 9/5) + 32' },
  { from: 'celsius', to: 'kelvin', formula: 'K = °C + 273.15' },
  { from: 'celsius', to: 'rankine', formula: '°R = (°C + 273.15) × 9/5' },
  { from: 'fahrenheit', to: 'celsius', formula: '°C = (°F − 32) × 5/9' },
  { from: 'fahrenheit', to: 'kelvin', formula: 'K = (°F − 32) × 5/9 + 273.15' },
  { from: 'fahrenheit', to: 'rankine', formula: '°R = °F + 459.67' },
  { from: 'kelvin', to: 'celsius', formula: '°C = K − 273.15' },
  { from: 'kelvin', to: 'fahrenheit', formula: '°F = (K − 273.15) × 9/5 + 32' },
  { from: 'kelvin', to: 'rankine', formula: '°R = K × 9/5' },
  { from: 'rankine', to: 'celsius', formula: '°C = (°R − 491.67) × 5/9' },
  { from: 'rankine', to: 'fahrenheit', formula: '°F = °R − 459.67' },
  { from: 'rankine', to: 'kelvin', formula: 'K = °R × 5/9' },
]

function formatNum(n: number): string {
  if (!isFinite(n) || isNaN(n)) return '—'
  // Up to 4 decimal places, trim trailing zeros
  return n.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

export default function TemperatureConverter() {
  const [values, setValues] = React.useState<Record<Unit, string>>({
    celsius: '25',
    fahrenheit: '77',
    kelvin: '298.15',
    rankine: '536.67',
  })
  const [lastEdited, setLastEdited] = React.useState<Unit>('celsius')

  const handleChange = (unit: Unit, raw: string) => {
    // Allow empty / partial input
    setValues((prev) => ({ ...prev, [unit]: raw }))
    setLastEdited(unit)
    const num = parseFloat(raw)
    if (isNaN(num)) {
      // Clear other fields too if invalid
      const cleared: Record<Unit, string> = { ...values }
      UNITS.forEach((u) => {
        if (u.id !== unit) cleared[u.id] = ''
      })
      cleared[unit] = raw
      setValues(cleared)
      return
    }
    // Compute celsius from edited unit
    const celsius = toCelsius(unit, num)
    // Convert to all others
    const next: Record<Unit, string> = { ...values }
    next[unit] = raw
    UNITS.forEach((u) => {
      if (u.id !== unit) {
        next[u.id] = formatNum(fromCelsius(u.id, celsius))
      }
    })
    setValues(next)
  }

  const editedNum = parseFloat(values[lastEdited])
  const editedValid = !isNaN(editedNum)
  const celsius = editedValid ? toCelsius(lastEdited, editedNum) : NaN

  // Reference: water freezing/boiling
  const refTemps = [
    { label: 'Absolute Zero', c: -273.15 },
    { label: 'Water Freezing', c: 0 },
    { label: 'Room Temp', c: 22 },
    { label: 'Body Temp', c: 37 },
    { label: 'Water Boiling', c: 100 },
  ]

  return (
    <ToolCardWrapper>
      {/* Inputs grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {UNITS.map((u) => (
          <div key={u.id}>
            <FieldLabel>
              <span className="flex items-center gap-2">
                <u.icon className="h-4 w-4 text-muted-foreground" />
                {u.label}
                <span className="text-muted-foreground font-normal">({u.symbol})</span>
              </span>
            </FieldLabel>
            <div className="flex gap-2">
              <Input
                type="number"
                value={values[u.id]}
                onChange={(e) => handleChange(u.id, e.target.value)}
                placeholder="—"
                inputMode="decimal"
                className="font-mono text-base"
              />
              <CopyButton text={values[u.id]} label="" className="px-2.5" />
            </div>
          </div>
        ))}
      </div>

      <Separator className="my-6" />

      {/* Active formula display */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
          Active Formula
        </div>
        {editedValid ? (
          <p className="font-mono text-sm break-words">
            {formatNum(editedNum)} <span className="text-muted-foreground">{UNITS.find((u) => u.id === lastEdited)?.symbol}</span>
            <span className="mx-2 text-muted-foreground">=</span>
            <span className="font-semibold text-primary">
              {formatNum(fromCelsius('fahrenheit', celsius))}
            </span>
            <span className="text-muted-foreground"> °F</span>
            <span className="mx-2 text-muted-foreground">·</span>
            <span className="font-semibold text-primary">
              {formatNum(fromCelsius('kelvin', celsius))}
            </span>
            <span className="text-muted-foreground"> K</span>
            <span className="mx-2 text-muted-foreground">·</span>
            <span className="font-semibold text-primary">
              {formatNum(fromCelsius('rankine', celsius))}
            </span>
            <span className="text-muted-foreground"> °R</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Enter a valid temperature to see conversions.</p>
        )}
      </div>

      {/* Formula reference */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-2">Conversion Formulas</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {FORMULAS.map((f, i) => (
            <div
              key={i}
              className="rounded-md border border-border bg-background px-3 py-2 text-xs font-mono"
            >
              {f.formula}
            </div>
          ))}
        </div>
      </div>

      {/* Quick references */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-2">Quick Reference Points</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {refTemps.map((r) => (
            <button
              key={r.label}
              onClick={() => handleChange('celsius', String(r.c))}
              className="text-left rounded-lg border border-border bg-background p-2.5 hover:border-primary/40 hover:bg-accent transition-colors"
            >
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{r.label}</div>
              <div className="font-mono text-sm font-semibold">{r.c}°C</div>
              <div className="text-xs text-muted-foreground">
                {formatNum(fromCelsius('fahrenheit', r.c))}°F · {formatNum(fromCelsius('kelvin', r.c))}K
              </div>
            </button>
          ))}
        </div>
      </div>
    </ToolCardWrapper>
  )
}
