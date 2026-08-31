'use client'

import * as React from 'react'
import {
  Square,
  Link2,
  Unlink,
  Copy,
  RotateCcw,
  Sparkles,
  Palette,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ToolCardWrapper,
  FieldLabel,
  CopyButton,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

type Unit = 'px' | '%' | 'em'

interface Corners {
  tl: number
  tr: number
  br: number
  bl: number
}

const PRESETS: { name: string; corners: Corners; unit: Unit; bg: string }[] = [
  { name: 'Square', corners: { tl: 0, tr: 0, br: 0, bl: 0 }, unit: 'px', bg: '#10B981' },
  { name: 'Circle', corners: { tl: 50, tr: 50, br: 50, bl: 50 }, unit: '%', bg: '#F59E0B' },
  { name: 'Pill', corners: { tl: 50, tr: 50, br: 50, bl: 50 }, unit: '%', bg: '#8B5CF6' },
  { name: 'Squircle', corners: { tl: 30, tr: 30, br: 30, bl: 30 }, unit: '%', bg: '#06B6D4' },
  { name: 'Blob', corners: { tl: 80, tr: 30, br: 70, bl: 20 }, unit: '%', bg: '#EC4899' },
  { name: 'Leaf', corners: { tl: 100, tr: 0, br: 100, bl: 0 }, unit: 'px', bg: '#84CC16' },
  { name: 'Wave', corners: { tl: 100, tr: 50, br: 100, bl: 50 }, unit: 'px', bg: '#14B8A6' },
  { name: 'Card', corners: { tl: 24, tr: 24, br: 0, bl: 0 }, unit: 'px', bg: '#F97316' },
]

const CORNER_LABELS: { key: keyof Corners; name: string }[] = [
  { key: 'tl', name: 'Top-left' },
  { key: 'tr', name: 'Top-right' },
  { key: 'br', name: 'Bottom-right' },
  { key: 'bl', name: 'Bottom-left' },
]

export default function BorderRadiusGenerator() {
  const [corners, setCorners] = React.useState<Corners>({ tl: 16, tr: 16, br: 16, bl: 16 })
  const [linked, setLinked] = React.useState(true)
  const [unit, setUnit] = React.useState<Unit>('px')
  const [bg, setBg] = React.useState('#10B981')
  const [showBg, setShowBg] = React.useState(true)

  function setCorner(key: keyof Corners, value: number) {
    if (linked) {
      setCorners({ tl: value, tr: value, br: value, bl: value })
    } else {
      setCorners((prev) => ({ ...prev, [key]: value }))
    }
  }

  function applyPreset(p: typeof PRESETS[number]) {
    setCorners({ ...p.corners })
    setUnit(p.unit)
    setBg(p.bg)
    setLinked(false)
    toast.success(`Loaded preset: ${p.name}`)
  }

  function reset() {
    setCorners({ tl: 16, tr: 16, br: 16, bl: 16 })
    setLinked(true)
    setUnit('px')
    toast.info('Reset')
  }

  const radiusStr = `${corners.tl}${unit} ${corners.tr}${unit} ${corners.br}${unit} ${corners.bl}${unit}`
  const css = `.element {\n  border-radius: ${radiusStr};\n}`

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Controls */}
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <FieldLabel className="mb-0">Unit</FieldLabel>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-md border border-border/60 px-3 py-1.5">
                  <span className="text-xs">Link corners</span>
                  <Switch checked={linked} onCheckedChange={setLinked} />
                  {linked ? <Link2 className="h-3.5 w-3.5 text-primary" /> : <Unlink className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="px">px</SelectItem>
                    <SelectItem value="%">%</SelectItem>
                    <SelectItem value="em">em</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={reset}>
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </Button>
              </div>
            </div>

            {/* 4 sliders in a 2x2 layout with the preview box */}
            <div className="grid grid-cols-2 gap-4">
              {CORNER_LABELS.map(({ key, name }) => (
                <div key={key} className="rounded-lg border border-border/60 p-3">
                  <FieldLabel>{name}: <span className="font-mono text-primary">{corners[key]}{unit}</span></FieldLabel>
                  <Slider value={[corners[key]]} min={0} max={unit === '%' ? 100 : 200} step={1} onValueChange={(v) => setCorner(key, v[0])} />
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border/60 p-3">
              <FieldLabel className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Palette className="h-4 w-4" /> Box color
                </span>
                <span className="font-mono text-xs text-muted-foreground">{bg}</span>
              </FieldLabel>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={bg}
                  onChange={(e) => setBg(e.target.value)}
                  className="h-9 w-12 rounded cursor-pointer border border-border bg-transparent"
                />
                <Input value={bg} onChange={(e) => setBg(e.target.value)} className="font-mono text-sm flex-1" />
              </div>
              <label className="flex items-center gap-2 mt-2 text-xs cursor-pointer select-none">
                <Switch checked={showBg} onCheckedChange={setShowBg} />
                Show box background (off = outline only)
              </label>
            </div>
          </div>

          {/* Live preview */}
          <div className="space-y-3">
            <FieldLabel>Live preview</FieldLabel>
            <div className="rounded-lg border border-border bg-card/30 p-4 min-h-[320px] flex items-center justify-center bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#ffffff_0%_50%)] bg-[length:24px_24px]">
              <div
                className="h-48 w-48 transition-all duration-200"
                style={{
                  backgroundColor: showBg ? bg : 'transparent',
                  border: showBg ? 'none' : `3px solid ${bg}`,
                  borderRadius: radiusStr,
                }}
              />
            </div>

            <div className="rounded-lg border border-border bg-zinc-950 p-4 relative">
              <div className="absolute right-2 top-2">
                <CopyButton text={css} label="Copy" />
              </div>
              <pre className="text-xs leading-5 font-mono text-emerald-200 overflow-x-auto">
                {css}
              </pre>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary" className="font-mono">tl: {corners.tl}{unit}</Badge>
              <Badge variant="secondary" className="font-mono">tr: {corners.tr}{unit}</Badge>
              <Badge variant="secondary" className="font-mono">br: {corners.br}{unit}</Badge>
              <Badge variant="secondary" className="font-mono">bl: {corners.bl}{unit}</Badge>
            </div>
          </div>
        </div>
      </ToolCardWrapper>

      {/* Presets */}
      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Preset shapes</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              className="group flex flex-col items-center gap-2 rounded-lg border border-border p-3 hover:border-primary/60 hover:bg-accent transition-colors"
            >
              <div
                className="h-14 w-14 transition-all"
                style={{
                  backgroundColor: p.bg,
                  borderRadius: `${p.corners.tl}${p.unit} ${p.corners.tr}${p.unit} ${p.corners.br}${p.unit} ${p.corners.bl}${p.unit}`,
                }}
              />
              <span className="text-xs font-medium">{p.name}</span>
            </button>
          ))}
        </div>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-3">
          <Square className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">CSS reference</h3>
        </div>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>
            <code className="font-mono">border-radius</code> shorthand follows clockwise order:{' '}
            <span className="font-medium text-foreground">top-left → top-right → bottom-right → bottom-left</span>.
          </li>
          <li>Percentages are relative to the corresponding dimension (50% creates a circle/ellipse).</li>
          <li>For elliptical corners, use the slash syntax: <code className="font-mono">border-radius: 50% / 25%</code>.</li>
          <li>Pair with <code className="font-mono">overflow: hidden</code> to clip child content.</li>
        </ul>
      </ToolCardWrapper>
    </div>
  )
}
