'use client'

import * as React from 'react'
import { ArrowRightLeft, Ruler, Weight, FlaskConical, Square } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ToolCardWrapper, FieldLabel, CopyButton } from '@/components/tool-page-shell'

type Category = 'length' | 'weight' | 'volume' | 'area'

interface UnitDef {
  label: string
  factor: number // value of 1 unit in base units
}

// base: meter, kilogram, liter, square meter
const UNITS: Record<Category, UnitDef[]> = {
  length: [
    { label: 'Meter (m)', factor: 1 },
    { label: 'Kilometer (km)', factor: 1000 },
    { label: 'Centimeter (cm)', factor: 0.01 },
    { label: 'Millimeter (mm)', factor: 0.001 },
    { label: 'Mile (mi)', factor: 1609.344 },
    { label: 'Yard (yd)', factor: 0.9144 },
    { label: 'Foot (ft)', factor: 0.3048 },
    { label: 'Inch (in)', factor: 0.0254 },
    { label: 'Nautical Mile (nmi)', factor: 1852 },
  ],
  weight: [
    { label: 'Kilogram (kg)', factor: 1 },
    { label: 'Gram (g)', factor: 0.001 },
    { label: 'Milligram (mg)', factor: 0.000001 },
    { label: 'Metric Ton (t)', factor: 1000 },
    { label: 'Pound (lb)', factor: 0.45359237 },
    { label: 'Ounce (oz)', factor: 0.028349523125 },
    { label: 'Stone (st)', factor: 6.35029318 },
  ],
  volume: [
    { label: 'Liter (L)', factor: 1 },
    { label: 'Milliliter (mL)', factor: 0.001 },
    { label: 'Gallon (US)', factor: 3.785411784 },
    { label: 'Quart (US)', factor: 0.946352946 },
    { label: 'Pint (US)', factor: 0.473176473 },
    { label: 'Cup (US)', factor: 0.2365882365 },
    { label: 'Fluid Ounce (US)', factor: 0.0295735295625 },
  ],
  area: [
    { label: 'Square Meter (m²)', factor: 1 },
    { label: 'Square Kilometer (km²)', factor: 1000000 },
    { label: 'Square Centimeter (cm²)', factor: 0.0001 },
    { label: 'Hectare (ha)', factor: 10000 },
    { label: 'Acre (ac)', factor: 4046.8564224 },
    { label: 'Square Mile (mi²)', factor: 2589988.110336 },
    { label: 'Square Foot (ft²)', factor: 0.09290304 },
  ],
}

const CATEGORY_META: Record<Category, { label: string; icon: React.ElementType }> = {
  length: { label: 'Length', icon: Ruler },
  weight: { label: 'Weight', icon: Weight },
  volume: { label: 'Volume', icon: FlaskConical },
  area: { label: 'Area', icon: Square },
}

function formatNumber(n: number): string {
  if (!isFinite(n) || isNaN(n)) return '—'
  if (n === 0) return '0'
  const abs = Math.abs(n)
  if (abs >= 1e12 || (abs < 1e-6 && abs > 0)) return n.toExponential(6)
  // up to 10 significant digits, then trim trailing zeros
  const str = n.toPrecision(10).replace(/\.?0+$/, '')
  // add thousands separators to integer part
  const [intPart, decPart] = str.split('.')
  const intFmt = Number(intPart).toLocaleString('en-US', { maximumFractionDigits: 0 })
  return decPart ? `${intFmt}.${decPart}` : intFmt
}

export default function UnitConverter() {
  const [category, setCategory] = React.useState<Category>('length')
  const [fromValue, setFromValue] = React.useState<string>('1')
  const [fromUnit, setFromUnit] = React.useState<string>('0')
  const [toUnit, setToUnit] = React.useState<string>('1')

  // Reset unit indices when category changes
  React.useEffect(() => {
    setFromUnit('0')
    setToUnit('1')
  }, [category])

  const units = UNITS[category]
  const fromIdx = Number(fromUnit)
  const toIdx = Number(toUnit)

  const numericFrom = parseFloat(fromValue)
  const isValid = !isNaN(numericFrom) && isFinite(numericFrom)

  // Convert: fromValue * fromFactor (base) / toFactor
  const baseValue = isValid ? numericFrom * units[fromIdx].factor : 0
  const result = isValid ? baseValue / units[toIdx].factor : NaN
  const resultStr = isValid ? formatNumber(result) : '—'

  const handleSwap = () => {
    setFromUnit(toUnit)
    setToUnit(fromUnit)
    if (isValid) setFromValue(formatNumber(result))
  }

  const formula = isValid
    ? `${numericFrom} ${units[fromIdx].label.split(' ')[0]} = ${resultStr} ${units[toIdx].label.split(' ')[0]}`
    : 'Enter a valid number to convert.'

  return (
    <ToolCardWrapper>
      {/* Category selector */}
      <div className="mb-5">
        <FieldLabel>Category</FieldLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(UNITS) as Category[]).map((cat) => {
            const Icon = CATEGORY_META[cat].icon
            const active = category === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background hover:bg-accent'
                }`}
              >
                <Icon className="h-4 w-4" />
                {CATEGORY_META[cat].label}
              </button>
            )
          })}
        </div>
      </div>

      <Separator className="my-4" />

      {/* From / To grid */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] items-end">
        {/* From */}
        <div>
          <FieldLabel>From</FieldLabel>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="number"
              inputMode="decimal"
              value={fromValue}
              onChange={(e) => setFromValue(e.target.value)}
              placeholder="Enter value"
              className="text-base"
            />
            <Select value={fromUnit} onValueChange={setFromUnit}>
              <SelectTrigger className="sm:w-[200px] w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{CATEGORY_META[category].label} units</SelectLabel>
                  {units.map((u, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Swap button */}
        <div className="flex sm:flex-col items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSwap}
            className="rounded-full"
            aria-label="Swap units"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* To */}
        <div>
          <FieldLabel>To</FieldLabel>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              readOnly
              value={resultStr}
              className="text-base font-semibold bg-muted/50"
            />
            <Select value={toUnit} onValueChange={setToUnit}>
              <SelectTrigger className="sm:w-[200px] w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{CATEGORY_META[category].label} units</SelectLabel>
                  {units.map((u, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Result panel */}
      <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
              Result
            </div>
            <div className="text-lg font-semibold break-all">
              {isValid ? (
                <>
                  {numericFrom.toLocaleString('en-US', { maximumFractionDigits: 6 })}{' '}
                  <span className="text-muted-foreground">{units[fromIdx].label.split(' ')[0]}</span>
                  {' = '}
                  <span className="text-primary">{resultStr}</span>{' '}
                  <span className="text-muted-foreground">{units[toIdx].label.split(' ')[0]}</span>
                </>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
          <CopyButton text={resultStr} label="Copy result" />
        </div>
      </div>

      {/* Quick reference */}
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        <Badge variant="secondary">Formula</Badge>
        <span className="font-mono">{formula}</span>
      </div>
    </ToolCardWrapper>
  )
}
