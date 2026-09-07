'use client'

import * as React from 'react'
import { Triangle, Compass, RotateCw, CircleDot } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ToolCardWrapper, FieldLabel, CopyButton } from '@/components/tool-page-shell'

type Unit = 'deg' | 'rad' | 'grad' | 'turn' | 'arcmin' | 'arcsec'

const UNITS: {
  id: Unit
  label: string
  short: string
  icon: React.ElementType
  perDeg: number // value of 1 unit expressed in degrees
}[] = [
  { id: 'deg', label: 'Degrees', short: '°', icon: Triangle, perDeg: 1 },
  { id: 'rad', label: 'Radians', short: 'rad', icon: CircleDot, perDeg: Math.PI / 180 },
  { id: 'grad', label: 'Gradians', short: 'gon', icon: Compass, perDeg: 0.9 },
  { id: 'turn', label: 'Turns', short: 'rev', icon: RotateCw, perDeg: 360 },
  { id: 'arcmin', label: 'Arcminutes', short: '′', icon: Triangle, perDeg: 1 / 60 },
  { id: 'arcsec', label: 'Arcseconds', short: '″', icon: Triangle, perDeg: 1 / 3600 },
]

function formatNum(n: number): string {
  if (!isFinite(n) || isNaN(n)) return '—'
  if (n === 0) return '0'
  const abs = Math.abs(n)
  if (abs >= 1e12 || (abs < 1e-6 && abs > 0)) return n.toExponential(4)
  const str = n.toPrecision(10).replace(/\.?0+$/, '')
  const [intPart, decPart] = str.split('.')
  const intFmt = Number(intPart).toLocaleString('en-US', { maximumFractionDigits: 0 })
  return decPart ? `${intFmt}.${decPart}` : intFmt
}

export default function AngleConverter() {
  const [values, setValues] = React.useState<Record<Unit, string>>({
    deg: '90',
    rad: (90 * Math.PI / 180).toString(),
    grad: '100',
    turn: '0.25',
    arcmin: '5400',
    arcsec: '324000',
  })
  const [lastEdited, setLastEdited] = React.useState<Unit>('deg')

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
    // Convert input to degrees, then to all others
    const perDeg = UNITS.find((u) => u.id === unit)!.perDeg
    const deg = num * perDeg
    const next: Record<Unit, string> = { ...values }
    next[unit] = raw
    UNITS.forEach((u) => {
      if (u.id !== unit) {
        next[u.id] = formatNum(deg / u.perDeg)
      }
    })
    setValues(next)
  }

  const refs = [
    { label: '0°', deg: 0 },
    { label: '30°', deg: 30 },
    { label: '45°', deg: 45 },
    { label: '60°', deg: 60 },
    { label: '90° (right)', deg: 90 },
    { label: '180° (straight)', deg: 180 },
    { label: '270°', deg: 270 },
    { label: '360° (full)', deg: 360 },
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
          <span className="font-semibold text-primary">{values.deg || '—'}</span>
          <span className="text-muted-foreground"> °</span>
          <span className="mx-2 text-muted-foreground">·</span>
          <span className="font-semibold text-primary">{values.rad || '—'}</span>
          <span className="text-muted-foreground"> rad</span>
          <span className="mx-2 text-muted-foreground">·</span>
          <span className="font-semibold text-primary">{values.turn || '—'}</span>
          <span className="text-muted-foreground"> rev</span>
        </p>
      </div>

      {/* Quick reference angles */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-2">Quick Reference Angles</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {refs.map((r) => (
            <button
              key={r.label}
              onClick={() => handleChange('deg', String(r.deg))}
              className="text-left rounded-lg border border-border bg-background p-2.5 hover:border-primary/40 hover:bg-accent transition-colors"
            >
              <div className="text-xs font-semibold mb-0.5">{r.label}</div>
              <div className="font-mono text-xs text-muted-foreground">
                {formatNum(r.deg * Math.PI / 180)} rad
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="mt-6 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">Conversion Formulas</p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Radians:</strong> rad = deg × π / 180</li>
          <li><strong>Gradians:</strong> gon = deg × 10 / 9 &nbsp;(400 gon = 360°)</li>
          <li><strong>Turns:</strong> rev = deg / 360</li>
          <li><strong>Arcminutes:</strong> 1° = 60′ · <strong>Arcseconds:</strong> 1° = 3600″</li>
        </ul>
      </div>
    </ToolCardWrapper>
  )
}
