'use client'

import * as React from 'react'
import { Pipette, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ToolCardWrapper, FieldLabel, CopyButton } from '@/components/tool-page-shell'
import { toast } from 'sonner'

interface RGB { r: number; g: number; b: number }
interface HSL { h: number; s: number; l: number }
interface CMYK { c: number; m: number; y: number; k: number }

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function rgbToHex({ r, g, b }: RGB): string {
  const h = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase()
}

function hexToRgb(hex: string): RGB | null {
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('')
  }
  if (h.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(h)) return null
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const l = (max + min) / 2
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const sN = s / 100, lN = l / 100
  const c = (1 - Math.abs(2 * lN - 1)) * sN
  const hp = h / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r1 = 0, g1 = 0, b1 = 0
  if (hp >= 0 && hp < 1) { r1 = c; g1 = x }
  else if (hp < 2) { r1 = x; g1 = c }
  else if (hp < 3) { g1 = c; b1 = x }
  else if (hp < 4) { g1 = x; b1 = c }
  else if (hp < 5) { r1 = x; b1 = c }
  else { r1 = c; b1 = x }
  const m = lN - c / 2
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  }
}

function rgbToCmyk({ r, g, b }: RGB): CMYK {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const k = 1 - Math.max(rn, gn, bn)
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 }
  return {
    c: Math.round(((1 - rn - k) / (1 - k)) * 100),
    m: Math.round(((1 - gn - k) / (1 - k)) * 100),
    y: Math.round(((1 - bn - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  }
}

function cmykToRgb({ c, m, y, k }: CMYK): RGB {
  const cN = c / 100, mN = m / 100, yN = y / 100, kN = k / 100
  return {
    r: Math.round(255 * (1 - cN) * (1 - kN)),
    g: Math.round(255 * (1 - mN) * (1 - kN)),
    b: Math.round(255 * (1 - yN) * (1 - kN)),
  }
}

function rgbToString({ r, g, b }: RGB): string {
  return `rgb(${r}, ${g}, ${b})`
}

function parseRgb(s: string): RGB | null {
  const m = s.trim().match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/)
  if (!m) return null
  const r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3])
  if ([r, g, b].some((v) => v > 255)) return null
  return { r, g, b }
}

function hslToString({ h, s, l }: HSL): string {
  return `hsl(${h}, ${s}%, ${l}%)`
}

function parseHsl(s: string): HSL | null {
  const m = s.trim().match(/^hsla?\(\s*(-?\d+)\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?/)
  if (!m) return null
  return {
    h: (parseInt(m[1]) % 360 + 360) % 360,
    s: clamp(parseInt(m[2]), 0, 100),
    l: clamp(parseInt(m[3]), 0, 100),
  }
}

function cmykToString({ c, m, y, k }: CMYK): string {
  return `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`
}

function parseCmyk(s: string): CMYK | null {
  const m = s.trim().match(/^cmyk\(\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?/)
  if (!m) return null
  return {
    c: clamp(parseInt(m[1]), 0, 100),
    m: clamp(parseInt(m[2]), 0, 100),
    y: clamp(parseInt(m[3]), 0, 100),
    k: clamp(parseInt(m[4]), 0, 100),
  }
}

export default function ColorConverterTool() {
  const [rgb, setRgb] = React.useState<RGB>({ r: 89, g: 172, b: 195 })
  const [hex, setHex] = React.useState<string>('#59ACC3')
  const [rgbStr, setRgbStr] = React.useState<string>('rgb(89, 172, 195)')
  const [hslStr, setHslStr] = React.useState<string>('hsl(194, 41%, 56%)')
  const [cmykStr, setCmykStr] = React.useState<string>('cmyk(54%, 12%, 0%, 24%)')

  // Sync all fields from rgb
  const syncFromRgb = React.useCallback((next: RGB) => {
    setRgb(next)
    setHex(rgbToHex(next))
    setRgbStr(rgbToString(next))
    setHslStr(hslToString(rgbToHsl(next)))
    setCmykStr(cmykToString(rgbToCmyk(next)))
  }, [])

  const onHexChange = (val: string) => {
    setHex(val)
    const parsed = hexToRgb(val)
    if (parsed) {
      setRgb(parsed)
      setRgbStr(rgbToString(parsed))
      setHslStr(hslToString(rgbToHsl(parsed)))
      setCmykStr(cmykToString(rgbToCmyk(parsed)))
    }
  }

  const onRgbChange = (val: string) => {
    setRgbStr(val)
    const parsed = parseRgb(val)
    if (parsed) {
      setRgb(parsed)
      setHex(rgbToHex(parsed))
      setHslStr(hslToString(rgbToHsl(parsed)))
      setCmykStr(cmykToString(rgbToCmyk(parsed)))
    }
  }

  const onHslChange = (val: string) => {
    setHslStr(val)
    const parsed = parseHsl(val)
    if (parsed) {
      const nextRgb = hslToRgb(parsed)
      setRgb(nextRgb)
      setHex(rgbToHex(nextRgb))
      setRgbStr(rgbToString(nextRgb))
      setCmykStr(cmykToString(rgbToCmyk(nextRgb)))
    }
  }

  const onCmykChange = (val: string) => {
    setCmykStr(val)
    const parsed = parseCmyk(val)
    if (parsed) {
      const nextRgb = cmykToRgb(parsed)
      setRgb(nextRgb)
      setHex(rgbToHex(nextRgb))
      setRgbStr(rgbToString(nextRgb))
      setHslStr(hslToString(rgbToHsl(nextRgb)))
    }
  }

  // Complementary: hue + 180
  const hsl = rgbToHsl(rgb)
  const complementaryHsl = { h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l }
  const complementaryRgb = hslToRgb(complementaryHsl)
  const complementaryHex = rgbToHex(complementaryRgb)

  const hexBg = rgbToHex(rgb)

  const randomize = () => {
    const next: RGB = {
      r: Math.floor(Math.random() * 256),
      g: Math.floor(Math.random() * 256),
      b: Math.floor(Math.random() * 256),
    }
    syncFromRgb(next)
    toast.success('Random color applied')
  }

  const fieldDefs: { label: string; value: string; onChange: (v: string) => void; placeholder: string }[] = [
    { label: 'HEX', value: hex, onChange: onHexChange, placeholder: '#000000' },
    { label: 'RGB', value: rgbStr, onChange: onRgbChange, placeholder: 'rgb(0, 0, 0)' },
    { label: 'HSL', value: hslStr, onChange: onHslChange, placeholder: 'hsl(0, 0%, 0%)' },
    { label: 'CMYK', value: cmykStr, onChange: onCmykChange, placeholder: 'cmyk(0%, 0%, 0%, 100%)' },
  ]

  return (
    <ToolCardWrapper>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Left: preview + picker */}
        <div className="space-y-4">
          <FieldLabel>Color Picker</FieldLabel>
          <div className="relative h-40 w-full overflow-hidden rounded-xl border border-border">
            <div
              className="absolute inset-0"
              style={{ backgroundColor: hexBg }}
              aria-label="Color preview"
            />
            <input
              type="color"
              value={hexBg}
              onChange={(e) => onHexChange(e.target.value.toUpperCase())}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="Pick color"
            />
            <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 font-mono text-xs text-white">
              {hexBg}
            </div>
          </div>

          {/* Complementary */}
          <div>
            <FieldLabel>Complementary Color</FieldLabel>
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-lg border border-border shrink-0"
                style={{ backgroundColor: complementaryHex }}
                aria-label="Complementary color swatch"
              />
              <div className="min-w-0">
                <div className="font-mono text-sm font-semibold">{complementaryHex}</div>
                <div className="text-xs text-muted-foreground">{rgbToString(complementaryRgb)}</div>
              </div>
            </div>
          </div>

          <Button variant="outline" onClick={randomize} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Random Color
          </Button>
        </div>

        {/* Right: text inputs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Pipette className="h-4 w-4 text-primary" />
              Color Values
            </h3>
            <span className="text-xs text-muted-foreground">Edit any field — all sync live</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {fieldDefs.map((f) => (
              <div key={f.label}>
                <FieldLabel>{f.label}</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    placeholder={f.placeholder}
                    className="font-mono text-sm"
                    spellCheck={false}
                  />
                  <CopyButton text={f.value} label="" className="px-2.5" />
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Quick info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="rounded-lg border border-border p-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Red</div>
              <div className="font-mono text-sm font-semibold">{rgb.r}</div>
            </div>
            <div className="rounded-lg border border-border p-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Green</div>
              <div className="font-mono text-sm font-semibold">{rgb.g}</div>
            </div>
            <div className="rounded-lg border border-border p-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Blue</div>
              <div className="font-mono text-sm font-semibold">{rgb.b}</div>
            </div>
            <div className="rounded-lg border border-border p-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Hue</div>
              <div className="font-mono text-sm font-semibold">{hsl.h}°</div>
            </div>
          </div>
        </div>
      </div>
    </ToolCardWrapper>
  )
}
