'use client'

import * as React from 'react'
import { HardDrive, Binary, ToggleLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ToolCardWrapper, FieldLabel, CopyButton } from '@/components/tool-page-shell'

type Unit = 'bit' | 'byte' | 'kb' | 'mb' | 'gb' | 'tb' | 'pb' | 'kib' | 'mib' | 'gib' | 'tib' | 'pib'

const SI_UNITS: { id: Unit; label: string; short: string }[] = [
  { id: 'bit', label: 'Bit', short: 'b' },
  { id: 'byte', label: 'Byte', short: 'B' },
  { id: 'kb', label: 'Kilobyte', short: 'KB' },
  { id: 'mb', label: 'Megabyte', short: 'MB' },
  { id: 'gb', label: 'Gigabyte', short: 'GB' },
  { id: 'tb', label: 'Terabyte', short: 'TB' },
  { id: 'pb', label: 'Petabyte', short: 'PB' },
]

const BINARY_UNITS: { id: Unit; label: string; short: string }[] = [
  { id: 'bit', label: 'Bit', short: 'b' },
  { id: 'byte', label: 'Byte', short: 'B' },
  { id: 'kib', label: 'Kibibyte', short: 'KiB' },
  { id: 'mib', label: 'Mebibyte', short: 'MiB' },
  { id: 'gib', label: 'Gibibyte', short: 'GiB' },
  { id: 'tib', label: 'Tebibyte', short: 'TiB' },
  { id: 'pib', label: 'Pebibyte', short: 'PiB' },
]

function toBits(value: number, unit: Unit, mode: 'si' | 'binary'): number {
  const base = mode === 'si' ? 1000 : 1024
  switch (unit) {
    case 'bit': return value
    case 'byte': return value * 8
    case 'kb': return value * 8 * base
    case 'mb': return value * 8 * base ** 2
    case 'gb': return value * 8 * base ** 3
    case 'tb': return value * 8 * base ** 4
    case 'pb': return value * 8 * base ** 5
    case 'kib': return value * 8 * 1024
    case 'mib': return value * 8 * 1024 ** 2
    case 'gib': return value * 8 * 1024 ** 3
    case 'tib': return value * 8 * 1024 ** 4
    case 'pib': return value * 8 * 1024 ** 5
  }
}

function fromBits(bits: number, unit: Unit, mode: 'si' | 'binary'): number {
  const base = mode === 'si' ? 1000 : 1024
  switch (unit) {
    case 'bit': return bits
    case 'byte': return bits / 8
    case 'kb': return bits / (8 * base)
    case 'mb': return bits / (8 * base ** 2)
    case 'gb': return bits / (8 * base ** 3)
    case 'tb': return bits / (8 * base ** 4)
    case 'pb': return bits / (8 * base ** 5)
    case 'kib': return bits / (8 * 1024)
    case 'mib': return bits / (8 * 1024 ** 2)
    case 'gib': return bits / (8 * 1024 ** 3)
    case 'tib': return bits / (8 * 1024 ** 4)
    case 'pib': return bits / (8 * 1024 ** 5)
  }
}

function formatNum(n: number): string {
  if (!isFinite(n) || isNaN(n)) return '—'
  if (n === 0) return '0'
  const abs = Math.abs(n)
  if (abs >= 1e15 || abs < 1e-6) return n.toExponential(4)
  // Show significant digits, trim trailing zeros
  const str = n.toPrecision(12).replace(/\.?0+$/, '')
  // Add thousands separators on integer portion
  const [intPart, decPart] = str.split('.')
  const intFmt = Number(intPart).toLocaleString('en-US', { maximumFractionDigits: 0 })
  return decPart ? `${intFmt}.${decPart}` : intFmt
}

export default function DataStorageConverter() {
  const [mode, setMode] = React.useState<'si' | 'binary'>('si')
  const [input, setInput] = React.useState('1')
  const [fromUnit, setFromUnit] = React.useState<Unit>('gb')

  const units = mode === 'si' ? SI_UNITS : BINARY_UNITS

  // Reset unit if not valid in current mode
  React.useEffect(() => {
    if (!units.some((u) => u.id === fromUnit)) {
      setFromUnit('gb')
    }
  }, [mode, units, fromUnit])

  const num = parseFloat(input)
  const valid = !isNaN(num) && isFinite(num)
  const bits = valid ? toBits(num, fromUnit, mode) : NaN

  const modeLabel = mode === 'si' ? 'SI (Base 1000)' : 'Binary (Base 1024)'

  return (
    <ToolCardWrapper>
      {/* Mode toggle */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">{modeLabel}</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className={mode === 'si' ? 'text-sm font-medium' : 'text-sm text-muted-foreground'}>
            SI (1000)
          </span>
          <Switch
            checked={mode === 'binary'}
            onCheckedChange={(c) => setMode(c ? 'binary' : 'si')}
            aria-label="Toggle base mode"
          />
          <span className={mode === 'binary' ? 'text-sm font-medium' : 'text-sm text-muted-foreground'}>
            Binary (1024)
          </span>
        </div>
      </div>

      {/* Input + from-unit selector */}
      <div className="grid gap-4 lg:grid-cols-[1fr_220px] items-end mb-6">
        <div>
          <FieldLabel>Input Value</FieldLabel>
          <Input
            type="number"
            inputMode="decimal"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter value"
            className="text-base"
          />
        </div>
        <div>
          <FieldLabel>From Unit</FieldLabel>
          <Tabs value={fromUnit} onValueChange={(v) => setFromUnit(v as Unit)}>
            <TabsList className="flex h-9 w-full overflow-x-auto">
              {units.map((u) => (
                <TabsTrigger key={u.id} value={u.id} className="text-xs px-1">
                  {u.short}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Output dashboard — all units */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Binary className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">All Conversions</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {units.map((u) => {
            const val = valid ? formatNum(fromBits(bits, u.id, mode)) : '—'
            const isFrom = u.id === fromUnit
            return (
              <div
                key={u.id}
                className={`group rounded-lg border p-3 transition-colors ${
                  isFrom
                    ? 'border-primary/60 bg-primary/5'
                    : 'border-border bg-muted/30 hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide">
                      {u.label}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{u.short}</div>
                  </div>
                  <CopyButton
                    text={val}
                    label=""
                    className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <div className="font-mono text-sm break-all min-h-[1.25rem]">
                  {val || '—'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Educational note */}
      <div className="mt-6 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
        <p className="mb-1.5 font-medium text-foreground">Decimal (SI) vs Binary (IEC)</p>
        <ul className="space-y-1">
          <li><strong>SI (base 1000):</strong> 1 KB = 1000 bytes, 1 MB = 1000 KB — used by storage manufacturers for disk sizes.</li>
          <li><strong>Binary (base 1024):</strong> 1 KiB = 1024 bytes, 1 MiB = 1024 KiB — used by RAM and OS file sizes (often shown as KB/MB).</li>
          <li>8 bits = 1 byte. All conversions go through bits internally.</li>
        </ul>
      </div>
    </ToolCardWrapper>
  )
}
