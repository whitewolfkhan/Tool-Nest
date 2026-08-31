'use client'

import * as React from 'react'
import {
  Palette,
  Copy,
  Check,
  Download,
  Sun,
  Moon,
  Droplets,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  ToolCardWrapper,
  FieldLabel,
  DownloadButton,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

interface HSL { h: number; s: number; l: number }
interface RGB { r: number; g: number; b: number }

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

function hexToRgb(hex: string): RGB | null {
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}
function rgbToHex({ r, g, b }: RGB): string {
  const to = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase()
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
  const hp = (h % 360) / 60
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

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
// Tailwind-like target lightness values (approximate)
const STEP_LIGHTNESS: Record<number, number> = {
  50: 97,
  100: 93,
  200: 86,
  300: 76,
  400: 64,
  500: 52,
  600: 44,
  700: 36,
  800: 28,
  900: 21,
  950: 14,
}

interface ShadeColor {
  step: number
  hex: string
  rgb: string
  hsl: string
  hslRaw: HSL
}

type Mode = 'full' | 'lighten' | 'darken' | 'hue'

function buildScale(baseHex: string, mode: Mode): ShadeColor[] {
  const baseRgb = hexToRgb(baseHex)
  if (!baseRgb) return []
  const baseHsl = rgbToHsl(baseRgb)
  return STEPS.map((step) => {
    let hsl: HSL
    if (mode === 'full') {
      // Standard: shift lightness toward Tailwind-like targets
      hsl = {
        h: baseHsl.h,
        s: baseHsl.s,
        l: STEP_LIGHTNESS[step] ?? 50,
      }
    } else if (mode === 'lighten') {
      // Tints: only lighten (50=lightest, 950=base)
      const ratio = (950 - step) / (950 - 50) // 0 at 950, 1 at 50
      const newL = Math.min(98, baseHsl.l + (95 - baseHsl.l) * ratio)
      hsl = { h: baseHsl.h, s: baseHsl.s, l: Math.round(newL) }
    } else if (mode === 'darken') {
      // Shades: only darken
      const ratio = (step - 50) / (950 - 50)
      const newL = Math.max(2, baseHsl.l - (baseHsl.l - 5) * ratio)
      hsl = { h: baseHsl.h, s: baseHsl.s, l: Math.round(newL) }
    } else {
      // Hue variations: rotate hue while keeping S/L
      const offset = ((step - 500) / 100) * 12 // ±60° range
      hsl = {
        h: (((baseHsl.h + offset) % 360) + 360) % 360,
        s: baseHsl.s,
        l: baseHsl.l,
      }
    }
    const rgb = hslToRgb(hsl)
    return {
      step,
      hex: rgbToHex(rgb),
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      hslRaw: hsl,
    }
  })
}

function exportCssVars(scale: ShadeColor[]): string {
  const lines = scale.map((c) => `  --shade-${c.step}: ${c.hex};`)
  return `:root {\n${lines.join('\n')}\n}`
}
function exportJson(scale: ShadeColor[]): string {
  return JSON.stringify(
    Object.fromEntries(scale.map((c) => [c.step, c.hex])),
    null,
    2
  )
}
function exportTailwind(scale: ShadeColor[]): string {
  const lines = scale.map((c) => `        ${c.step}: '${c.hex}',`)
  return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        brand: {\n${lines.join('\n')}\n        }\n      }\n    }\n  }\n}`
}

export default function ColorShadeGenerator() {
  const [baseHex, setBaseHex] = React.useState('#10B981')
  const [hexInput, setHexInput] = React.useState('#10B981')
  const [mode, setMode] = React.useState<Mode>('full')
  const [copiedStep, setCopiedStep] = React.useState<number | null>(null)
  const [exportTab, setExportTab] = React.useState<'css' | 'json' | 'tailwind'>('css')

  const scale = React.useMemo(() => buildScale(baseHex, mode), [baseHex, mode])

  const onHexChange = (val: string) => {
    setHexInput(val)
    const rgb = hexToRgb(val)
    if (rgb) setBaseHex(rgbToHex(rgb))
  }
  const onPicker = (val: string) => {
    const upper = val.toUpperCase()
    setBaseHex(upper)
    setHexInput(upper)
  }
  const randomize = () => {
    const r = Math.floor(Math.random() * 256)
    const g = Math.floor(Math.random() * 256)
    const b = Math.floor(Math.random() * 256)
    const hex = rgbToHex({ r, g, b })
    setBaseHex(hex)
    setHexInput(hex)
    toast.success('Random color applied')
  }

  const copy = (c: ShadeColor) => {
    navigator.clipboard
      .writeText(c.hex)
      .then(() => {
        setCopiedStep(c.step)
        toast.success(`${c.hex} copied`)
        setTimeout(() => setCopiedStep((cur) => (cur === c.step ? null : cur)), 1500)
      })
      .catch(() => toast.error('Failed to copy'))
  }

  const exportText =
    exportTab === 'css'
      ? exportCssVars(scale)
      : exportTab === 'json'
        ? exportJson(scale)
        : exportTailwind(scale)

  const downloadExport = () => {
    const ext = exportTab === 'json' ? 'json' : 'txt'
    const blob = new Blob([exportText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `color-shades.${ext}`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported')
  }

  const MODE_INFO: Record<Mode, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
    full: { label: 'Tints & Shades', icon: Palette },
    lighten: { label: 'Lighten only', icon: Sun },
    darken: { label: 'Darken only', icon: Moon },
    hue: { label: 'Hue variations', icon: Droplets },
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Controls */}
          <div className="space-y-5">
            <div>
              <FieldLabel>Base color</FieldLabel>
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border">
                  <div className="absolute inset-0" style={{ backgroundColor: baseHex }} />
                  <input
                    type="color"
                    aria-label="Pick base color"
                    value={baseHex}
                    onChange={(e) => onPicker(e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
                <Input
                  value={hexInput}
                  onChange={(e) => onHexChange(e.target.value)}
                  placeholder="#10B981"
                  spellCheck={false}
                  className="font-mono uppercase"
                />
              </div>
            </div>

            <div>
              <FieldLabel>Mode</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(MODE_INFO) as Mode[]).map((m) => {
                  const info = MODE_INFO[m]
                  const Icon = info.icon
                  const active = mode === m
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`rounded-md border px-3 py-2 text-xs font-medium flex items-center gap-1.5 transition-colors text-left ${
                        active
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-accent'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {info.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <Button onClick={randomize} variant="outline" className="w-full gap-1.5">
              <Palette className="h-4 w-4" />
              Random color
            </Button>

            <div className="text-xs text-muted-foreground">
              <Badge variant="secondary" className="mb-2">Base</Badge>
              <div className="font-mono">{baseHex}</div>
              <div className="font-mono mt-0.5">
                {(() => {
                  const rgb = hexToRgb(baseHex)
                  if (!rgb) return 'Invalid'
                  const hsl = rgbToHsl(rgb)
                  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
                })()}
              </div>
            </div>
          </div>

          {/* Output */}
          <div className="space-y-4">
            {/* Big swatches gradient bar */}
            <div className="flex h-24 w-full overflow-hidden rounded-lg border border-border">
              {scale.map((c) => (
                <button
                  key={c.step}
                  type="button"
                  onClick={() => copy(c)}
                  className="group relative flex-1 transition-all hover:flex-[1.5]"
                  style={{ backgroundColor: c.hex }}
                  title={`${c.step}: ${c.hex}`}
                  aria-label={`Shade ${c.step} ${c.hex}`}
                >
                  <span className="absolute inset-x-0 bottom-0 bg-black/30 py-1 text-center text-[10px] font-mono text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {copiedStep === c.step ? 'Copied!' : c.hex}
                  </span>
                </button>
              ))}
            </div>

            {/* Step swatches */}
            <div className="grid gap-2 sm:grid-cols-2 max-h-96 overflow-y-auto pr-1">
              {scale.map((c) => (
                <button
                  key={`row-${c.step}`}
                  type="button"
                  onClick={() => copy(c)}
                  className="flex items-center gap-3 rounded-md border border-border p-3 text-left transition-colors hover:bg-accent"
                >
                  <div
                    className="h-10 w-10 shrink-0 rounded-md border border-border"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{c.step}</span>
                      <span className="font-mono text-xs">{c.hex}</span>
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground truncate">{c.rgb}</div>
                    <div className="font-mono text-[10px] text-muted-foreground truncate">{c.hsl}</div>
                  </div>
                  {copiedStep === c.step ? (
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ToolCardWrapper>

      {/* Export */}
      <ToolCardWrapper>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Download className="h-4 w-4 text-primary" />
            Export scale
          </h3>
          <DownloadButton onClick={downloadExport} label="Download" />
        </div>
        <Tabs value={exportTab} onValueChange={(v) => setExportTab(v as typeof exportTab)}>
          <TabsList className="mb-3">
            <TabsTrigger value="css">CSS Variables</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="tailwind">Tailwind config</TabsTrigger>
          </TabsList>
          <TabsContent value="css">
            <pre className="max-h-72 overflow-auto rounded-md border border-border bg-muted/40 p-4 text-xs font-mono">
              {exportCssVars(scale)}
            </pre>
          </TabsContent>
          <TabsContent value="json">
            <pre className="max-h-72 overflow-auto rounded-md border border-border bg-muted/40 p-4 text-xs font-mono">
              {exportJson(scale)}
            </pre>
          </TabsContent>
          <TabsContent value="tailwind">
            <pre className="max-h-72 overflow-auto rounded-md border border-border bg-muted/40 p-4 text-xs font-mono">
              {exportTailwind(scale)}
            </pre>
          </TabsContent>
        </Tabs>
      </ToolCardWrapper>

      <p className="text-xs text-muted-foreground text-center">
        Inspired by Tailwind&apos;s color scale. All calculations run locally in your browser using HSL math.
      </p>
    </div>
  )
}
