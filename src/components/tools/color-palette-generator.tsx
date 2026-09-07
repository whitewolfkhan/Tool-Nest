'use client'

import * as React from 'react'
import {
  Palette,
  RefreshCw,
  Copy,
  Check,
  Save,
  Trash2,
  Sparkles,
  Download,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  ToolCardWrapper,
  FieldLabel,
  EmptyState,
  DownloadButton,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ---------- Color math ----------

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

function rgbToString({ r, g, b }: RGB) {
  return `rgb(${r}, ${g}, ${b})`
}

function hslToString({ h, s, l }: HSL) {
  return `hsl(${h}, ${s}%, ${l}%)`
}

// ---------- Palette generation ----------

type PaletteType = 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'monochromatic' | 'shades'

interface PaletteColor {
  hex: string
  rgb: string
  hsl: string
  hslRaw: HSL
  name: string
}

function buildPalette(baseHex: string, type: PaletteType, count: number): PaletteColor[] {
  const baseRgb = hexToRgb(baseHex)
  if (!baseRgb) return []
  const baseHsl = rgbToHsl(baseRgb)
  const make = (h: number, s: number, l: number, name: string): PaletteColor => {
    const hsl: HSL = {
      h: ((Math.round(h) % 360) + 360) % 360,
      s: clamp(Math.round(s), 0, 100),
      l: clamp(Math.round(l), 0, 100),
    }
    const rgb = hslToRgb(hsl)
    return {
      hex: rgbToHex(rgb),
      rgb: rgbToString(rgb),
      hsl: hslToString(hsl),
      hslRaw: hsl,
      name,
    }
  }

  const h = baseHsl.h, s = baseHsl.s, l = baseHsl.l
  const out: PaletteColor[] = []

  switch (type) {
    case 'complementary': {
      out.push(make(h, s, l, 'Base'))
      out.push(make(h + 180, s, l, 'Complement'))
      // Tints/shades for richer palette
      out.push(make(h, s, Math.min(l + 18, 92), 'Light'))
      out.push(make(h, s, Math.max(l - 18, 8), 'Dark'))
      out.push(make(h + 180, s, Math.min(l + 18, 92), 'Complement light'))
      out.push(make(h + 180, s, Math.max(l - 18, 8), 'Complement dark'))
      return out.slice(0, count)
    }
    case 'analogous': {
      const span = 60
      const step = count > 1 ? span / (count - 1) : 0
      for (let i = 0; i < count; i++) {
        const offset = -span / 2 + step * i
        out.push(make(h + offset, s, l, `Analog ${i + 1}`))
      }
      return out
    }
    case 'triadic': {
      out.push(make(h, s, l, 'Base'))
      out.push(make(h + 120, s, l, 'Triad 1'))
      out.push(make(h + 240, s, l, 'Triad 2'))
      // supporting tints
      out.push(make(h, s, Math.min(l + 20, 92), 'Base light'))
      out.push(make(h + 120, s, Math.min(l + 20, 92), 'Triad 1 light'))
      out.push(make(h + 240, s, Math.min(l + 20, 92), 'Triad 2 light'))
      out.push(make(h, s, Math.max(l - 20, 8), 'Base dark'))
      return out.slice(0, count)
    }
    case 'tetradic': {
      out.push(make(h, s, l, 'Base'))
      out.push(make(h + 90, s, l, 'Quad 1'))
      out.push(make(h + 180, s, l, 'Quad 2'))
      out.push(make(h + 270, s, l, 'Quad 3'))
      out.push(make(h, s, Math.min(l + 18, 92), 'Base light'))
      out.push(make(h + 180, s, Math.min(l + 18, 92), 'Complement light'))
      out.push(make(h + 90, s, Math.max(l - 18, 8), 'Quad 1 dark'))
      return out.slice(0, count)
    }
    case 'monochromatic': {
      // Even spread of lightness
      const targetCount = Math.max(5, count)
      for (let i = 0; i < targetCount; i++) {
        const ratio = targetCount === 1 ? 0.5 : i / (targetCount - 1)
        const newL = Math.round(8 + ratio * 84)
        out.push(make(h, s, newL, `Tone ${i + 1}`))
      }
      return out.slice(0, count)
    }
    case 'shades': {
      // Shades = same hue, varying lightness (darker side)
      const targetCount = Math.max(5, count)
      for (let i = 0; i < targetCount; i++) {
        const ratio = targetCount === 1 ? 0.5 : i / (targetCount - 1)
        const newL = Math.round(Math.max(l, 95) - ratio * Math.max(l - 5, 70))
        out.push(make(h, s, newL, `Shade ${i + 1}`))
      }
      return out.slice(0, count)
    }
  }
}

function randomHex(): string {
  const r = Math.floor(Math.random() * 256)
  const g = Math.floor(Math.random() * 256)
  const b = Math.floor(Math.random() * 256)
  return rgbToHex({ r, g, b })
}

// ---------- Export helpers ----------

function exportCssVars(palette: PaletteColor[]): string {
  const lines = palette.map((c, i) => `  --color-${i + 1}: ${c.hex};`)
  return `:root {\n${lines.join('\n')}\n}`
}

function exportJson(palette: PaletteColor[]): string {
  return JSON.stringify(
    palette.map((c) => ({ name: c.name, hex: c.hex, rgb: c.rgb, hsl: c.hsl })),
    null,
    2
  )
}

function exportTailwind(palette: PaletteColor[]): string {
  const lines = palette.map((c, i) => `        ${i + 1}: '${c.hex}',`)
  return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        brand: {\n${lines.join('\n')}\n        }\n      }\n    }\n  }\n}`
}

// ---------- Saved palettes (localStorage) ----------

interface SavedPalette {
  id: string
  type: PaletteType
  base: string
  colors: string[]
  createdAt: number
}

const STORAGE_KEY = 'toolnest:saved-palettes'
const MAX_SAVED = 10

function loadSaved(): SavedPalette[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.slice(0, MAX_SAVED)
  } catch {
    return []
  }
}

function persistSaved(list: SavedPalette[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_SAVED)))
  } catch {
    // ignore
  }
}

// ---------- Component ----------

const PALETTE_TYPES: { value: PaletteType; label: string }[] = [
  { value: 'complementary', label: 'Complementary' },
  { value: 'analogous', label: 'Analogous' },
  { value: 'triadic', label: 'Triadic' },
  { value: 'tetradic', label: 'Tetradic' },
  { value: 'monochromatic', label: 'Monochromatic' },
  { value: 'shades', label: 'Shades' },
]

export default function ColorPaletteGenerator() {
  const [baseHex, setBaseHex] = React.useState<string>('#10B981')
  const [hexInput, setHexInput] = React.useState<string>('#10B981')
  const [paletteType, setPaletteType] = React.useState<PaletteType>('complementary')
  const [count, setCount] = React.useState<number>(6)
  const [palette, setPalette] = React.useState<PaletteColor[]>([])
  const [exportTab, setExportTab] = React.useState<'css' | 'json' | 'tailwind'>('css')
  const [saved, setSaved] = React.useState<SavedPalette[]>([])
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  React.useEffect(() => {
    setSaved(loadSaved())
  }, [])

  const generate = React.useCallback((hex: string, type: PaletteType, n: number) => {
    const next = buildPalette(hex, type, n)
    if (next.length === 0) {
      toast.error('Invalid color. Use a valid hex like #10B981.')
      return
    }
    setPalette(next)
  }, [])

  // Generate on first mount and whenever inputs change
  React.useEffect(() => {
    generate(baseHex, paletteType, count)
  }, [baseHex, paletteType, count, generate])

  const onHexInputChange = (val: string) => {
    setHexInput(val)
    const rgb = hexToRgb(val)
    if (rgb) {
      setBaseHex(rgbToHex(rgb))
    }
  }

  const onPickerChange = (val: string) => {
    const upper = val.toUpperCase()
    setHexInput(upper)
    setBaseHex(upper)
  }

  const randomize = () => {
    const next = randomHex()
    setBaseHex(next)
    setHexInput(next)
    toast.success('Random color applied')
  }

  const copyColor = (c: PaletteColor) => {
    navigator.clipboard
      .writeText(c.hex)
      .then(() => {
        setCopiedId(c.hex)
        toast.success(`${c.hex} copied`)
        setTimeout(() => setCopiedId((cur) => (cur === c.hex ? null : cur)), 1500)
      })
      .catch(() => toast.error('Failed to copy'))
  }

  const savePalette = () => {
    if (palette.length === 0) {
      toast.error('Generate a palette first')
      return
    }
    const entry: SavedPalette = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: paletteType,
      base: baseHex,
      colors: palette.map((c) => c.hex),
      createdAt: Date.now(),
    }
    const next = [entry, ...saved].slice(0, MAX_SAVED)
    setSaved(next)
    persistSaved(next)
    toast.success('Palette saved')
  }

  const removeSaved = (id: string) => {
    const next = saved.filter((s) => s.id !== id)
    setSaved(next)
    persistSaved(next)
  }

  const loadSavedPalette = (s: SavedPalette) => {
    setBaseHex(s.base)
    setHexInput(s.base)
    setPaletteType(s.type)
    setCount(s.colors.length)
    setPalette(s.colors.map((hex) => {
      const rgb = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 }
      const hsl = rgbToHsl(rgb)
      return {
        hex,
        rgb: rgbToString(rgb),
        hsl: hslToString(hsl),
        hslRaw: hsl,
        name: 'Loaded',
      }
    }))
    toast.success('Palette loaded')
  }

  const exportText =
    exportTab === 'css'
      ? exportCssVars(palette)
      : exportTab === 'json'
        ? exportJson(palette)
        : exportTailwind(palette)

  const downloadExport = () => {
    const ext = exportTab === 'json' ? 'json' : 'txt'
    const blob = new Blob([exportText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `palette.${ext}`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Palette exported')
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
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
                    onChange={(e) => onPickerChange(e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
                <Input
                  value={hexInput}
                  onChange={(e) => onHexInputChange(e.target.value)}
                  placeholder="#10B981"
                  spellCheck={false}
                  className="font-mono uppercase"
                />
              </div>
            </div>

            <div>
              <FieldLabel>Palette type</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {PALETTE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setPaletteType(t.value)}
                    className={cn(
                      'rounded-md border px-3 py-2 text-xs font-medium transition-colors text-left',
                      paletteType === t.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-accent'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Colors: {count}</FieldLabel>
              <Slider
                min={5}
                max={7}
                step={1}
                value={[count]}
                onValueChange={(v) => setCount(v[0] ?? 6)}
              />
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>5</span>
                <span>6</span>
                <span>7</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={randomize} variant="outline" className="gap-1.5 flex-1">
                <RefreshCw className="h-4 w-4" />
                Random
              </Button>
              <Button onClick={savePalette} variant="outline" className="gap-1.5 flex-1">
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          </div>

          {/* Palette output */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                Generated palette
              </h3>
              <Badge variant="secondary" className="capitalize">
                {PALETTE_TYPES.find((t) => t.value === paletteType)?.label} · {palette.length} colors
              </Badge>
            </div>

            {/* Big swatches row */}
            <div className="flex h-32 w-full overflow-hidden rounded-lg border border-border">
              {palette.map((c, i) => (
                <button
                  key={`${c.hex}-${i}`}
                  type="button"
                  onClick={() => copyColor(c)}
                  className="group relative flex-1 transition-all hover:flex-[1.5]"
                  style={{ backgroundColor: c.hex }}
                  title={`Click to copy ${c.hex}`}
                  aria-label={`Color ${c.hex}`}
                >
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/30 py-1.5 text-[10px] font-mono text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {copiedId === c.hex ? (
                      <>
                        <Check className="h-3 w-3 mr-1" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" /> {c.hex}
                      </>
                    )}
                  </span>
                </button>
              ))}
            </div>

            {/* Color cards grid */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-72 overflow-y-auto pr-1">
              {palette.map((c, i) => (
                <button
                  key={`card-${c.hex}-${i}`}
                  type="button"
                  onClick={() => copyColor(c)}
                  className="flex items-center gap-3 rounded-md border border-border p-3 text-left transition-colors hover:bg-accent"
                >
                  <div
                    className="h-10 w-10 shrink-0 rounded-md border border-border"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-sm font-semibold">{c.hex}</div>
                    <div className="font-mono text-[11px] text-muted-foreground truncate">{c.rgb}</div>
                    <div className="font-mono text-[11px] text-muted-foreground truncate">{c.hsl}</div>
                  </div>
                  {copiedId === c.hex ? (
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
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Export palette
          </h3>
          <DownloadButton onClick={downloadExport} label="Download" />
        </div>
        <Tabs value={exportTab} onValueChange={(v) => setExportTab(v as typeof exportTab)}>
          <TabsList className="mb-3">
            <TabsTrigger value="css">CSS Variables</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="tailwind">Tailwind</TabsTrigger>
          </TabsList>
          <TabsContent value="css">
            <pre className="max-h-72 overflow-auto rounded-md border border-border bg-muted/40 p-4 text-xs font-mono">
              {exportCssVars(palette)}
            </pre>
          </TabsContent>
          <TabsContent value="json">
            <pre className="max-h-72 overflow-auto rounded-md border border-border bg-muted/40 p-4 text-xs font-mono">
              {exportJson(palette)}
            </pre>
          </TabsContent>
          <TabsContent value="tailwind">
            <pre className="max-h-72 overflow-auto rounded-md border border-border bg-muted/40 p-4 text-xs font-mono">
              {exportTailwind(palette)}
            </pre>
          </TabsContent>
        </Tabs>
      </ToolCardWrapper>

      {/* Saved palettes */}
      <ToolCardWrapper>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Save className="h-4 w-4 text-primary" />
            Saved palettes
          </h3>
          {saved.length > 0 && (
            <span className="text-xs text-muted-foreground">{saved.length} / 10</span>
          )}
        </div>
        {saved.length === 0 ? (
          <EmptyState message="No saved palettes yet. Generate one and click Save to keep it for later." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {saved.map((s) => (
              <div
                key={s.id}
                className="rounded-md border border-border p-3 space-y-2"
              >
                <div className="flex h-10 w-full overflow-hidden rounded-md border border-border">
                  {s.colors.map((hex, i) => (
                    <div key={i} className="flex-1" style={{ backgroundColor: hex }} />
                  ))}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{s.base}</div>
                    <div className="text-[10px] text-muted-foreground capitalize">
                      {s.type} · {s.colors.length} colors
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => loadSavedPalette(s)}
                    >
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeSaved(s.id)}
                      aria-label="Delete saved palette"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ToolCardWrapper>

      <Separator />
      <p className="text-xs text-muted-foreground text-center">
        All color math runs in your browser using HSL color theory. Nothing is uploaded.
      </p>
    </div>
  )
}
