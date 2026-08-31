'use client'

import * as React from 'react'
import {
  Copy,
  Check,
  Plus,
  Trash2,
  Layers,
  RotateCcw,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  ToolCardWrapper,
  FieldLabel,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Shadow {
  id: string
  x: number
  y: number
  blur: number
  spread: number
  color: string
  opacity: number // 0-100
  inset: boolean
}

interface Preset {
  name: string
  shadows: Omit<Shadow, 'id'>[]
  boxColor: string
}

const uid = () => Math.random().toString(36).slice(2, 9)

const PRESETS: Preset[] = [
  {
    name: 'Subtle',
    boxColor: '#FFFFFF',
    shadows: [{ x: 0, y: 1, blur: 2, spread: 0, color: '#000000', opacity: 8, inset: false }],
  },
  {
    name: 'Medium',
    boxColor: '#FFFFFF',
    shadows: [{ x: 0, y: 4, blur: 6, spread: -1, color: '#000000', opacity: 20, inset: false }],
  },
  {
    name: 'Large',
    boxColor: '#FFFFFF',
    shadows: [{ x: 0, y: 20, blur: 25, spread: -5, color: '#000000', opacity: 25, inset: false }],
  },
  {
    name: 'Neon',
    boxColor: '#10B981',
    shadows: [
      { x: 0, y: 0, blur: 5, spread: 2, color: '#10B981', opacity: 70, inset: false },
      { x: 0, y: 0, blur: 20, spread: 5, color: '#10B981', opacity: 50, inset: false },
    ],
  },
  {
    name: 'Inset',
    boxColor: '#F3F4F6',
    shadows: [{ x: 0, y: 2, blur: 4, spread: 0, color: '#000000', opacity: 25, inset: true }],
  },
  {
    name: 'Layered',
    boxColor: '#FFFFFF',
    shadows: [
      { x: 0, y: 1, blur: 2, spread: 0, color: '#000000', opacity: 6, inset: false },
      { x: 0, y: 2, blur: 4, spread: 0, color: '#000000', opacity: 5, inset: false },
      { x: 0, y: 5, blur: 10, spread: 0, color: '#000000', opacity: 5, inset: false },
    ],
  },
]

function hexToRgba(hex: string, opacity: number): string {
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return hex
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${(opacity / 100).toFixed(2)})`
}

function buildShadow(s: Omit<Shadow, 'id'>): string {
  return `${s.inset ? 'inset ' : ''}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${hexToRgba(s.color, s.opacity)}`
}

function buildCss(shadows: Shadow[]): string {
  return shadows.map(buildShadow).join(', ')
}

export default function BoxShadowGenerator() {
  const [shadows, setShadows] = React.useState<Shadow[]>([
    { id: uid(), x: 0, y: 4, blur: 6, spread: -1, color: '#000000', opacity: 20, inset: false },
  ])
  const [activeId, setActiveId] = React.useState<string>(shadows[0]!.id)
  const [boxColor, setBoxColor] = React.useState('#FFFFFF')
  const [copied, setCopied] = React.useState(false)

  const active = shadows.find((s) => s.id === activeId) ?? shadows[0]!

  const updateActive = (patch: Partial<Shadow>) => {
    setShadows((prev) =>
      prev.map((s) => (s.id === activeId ? { ...s, ...patch } : s))
    )
  }

  const addShadow = () => {
    if (shadows.length >= 5) {
      toast.error('Maximum 5 shadow layers')
      return
    }
    const newS: Shadow = {
      id: uid(),
      x: 0,
      y: 4,
      blur: 6,
      spread: 0,
      color: '#000000',
      opacity: 20,
      inset: false,
    }
    setShadows([...shadows, newS])
    setActiveId(newS.id)
  }
  const removeShadow = (id: string) => {
    if (shadows.length <= 1) {
      toast.error('Need at least one shadow')
      return
    }
    const next = shadows.filter((s) => s.id !== id)
    setShadows(next)
    if (activeId === id) setActiveId(next[0]!.id)
  }

  const reset = () => {
    const s: Shadow = { id: uid(), x: 0, y: 4, blur: 6, spread: -1, color: '#000000', opacity: 20, inset: false }
    setShadows([s])
    setActiveId(s.id)
    setBoxColor('#FFFFFF')
    toast.success('Reset')
  }

  const applyPreset = (p: Preset) => {
    setShadows(p.shadows.map((s) => ({ ...s, id: uid() })))
    setActiveId('')
    setBoxColor(p.boxColor)
    setTimeout(() => {
      // set active to first after state update
      setActiveId(p.shadows[0] ? (p.shadows[0] as any).id ?? '' : '')
    }, 0)
    // We need to set active properly; use the new IDs:
    const newIds = p.shadows.map(() => uid())
    setShadows(p.shadows.map((s, i) => ({ ...s, id: newIds[i]! })))
    setActiveId(newIds[0]!)
    toast.success(`Loaded "${p.name}" preset`)
  }

  const onCopy = async () => {
    const css = buildCss(shadows)
    try {
      await navigator.clipboard.writeText(`box-shadow: ${css};`)
      setCopied(true)
      toast.success('CSS copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const css = buildCss(shadows)

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-primary" />
                Live preview
              </h3>
              <div className="flex items-center gap-2">
                <Label htmlFor="box-color-label" className="text-xs text-muted-foreground">
                  Box
                </Label>
                <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md border border-border">
                  <div className="absolute inset-0" style={{ backgroundColor: boxColor }} />
                  <input
                    id="box-color-label"
                    type="color"
                    aria-label="Box color"
                    value={boxColor}
                    onChange={(e) => setBoxColor(e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
              </div>
            </div>
            <div
              className="flex h-72 items-center justify-center rounded-lg border border-border bg-[conic-gradient(at_top_left,_var(--tw-colors-muted,_#f3f4f6)_0%,_#e5e7eb_25%,_#f3f4f6_50%,_#e5e7eb_75%,_#f3f4f6_100%)] dark:bg-zinc-900"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
              }}
            >
              <div
                className="h-32 w-32 rounded-md"
                style={{ backgroundColor: boxColor, boxShadow: css }}
              />
            </div>

            <div className="rounded-md border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Generated CSS</span>
                <Button size="sm" variant="outline" onClick={onCopy} className="gap-1.5 h-7">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <pre className="font-mono text-xs whitespace-pre-wrap break-all">{`box-shadow: ${css};`}</pre>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Layer list */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <FieldLabel className="mb-0">Shadow layers</FieldLabel>
                <Button size="sm" variant="outline" onClick={addShadow} className="gap-1 h-7">
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {shadows.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveId(s.id)}
                    className={cn(
                      'w-full flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs transition-colors',
                      activeId === s.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-accent'
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-3 w-3" />
                      Layer {i + 1}
                      {s.inset && <Badge variant="outline" className="text-[10px] py-0 px-1.5">inset</Badge>}
                    </span>
                    <span
                      className="h-3 w-3 rounded-full border border-border"
                      style={{ backgroundColor: s.color }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">
                  Editing layer {shadows.findIndex((s) => s.id === activeId) + 1}
                </Label>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeShadow(active.id)}
                  aria-label="Remove layer"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              <SliderRow label="Offset X" value={active.x} min={-50} max={50} suffix="px"
                onChange={(v) => updateActive({ x: v })} />
              <SliderRow label="Offset Y" value={active.y} min={-50} max={50} suffix="px"
                onChange={(v) => updateActive({ y: v })} />
              <SliderRow label="Blur" value={active.blur} min={0} max={100} suffix="px"
                onChange={(v) => updateActive({ blur: v })} />
              <SliderRow label="Spread" value={active.spread} min={-50} max={50} suffix="px"
                onChange={(v) => updateActive({ spread: v })} />
              <SliderRow label="Opacity" value={active.opacity} min={0} max={100} suffix="%"
                onChange={(v) => updateActive({ opacity: v })} />

              <div>
                <FieldLabel>Color</FieldLabel>
                <div className="flex items-center gap-2">
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-border">
                    <div className="absolute inset-0" style={{ backgroundColor: active.color }} />
                    <input
                      type="color"
                      aria-label="Shadow color"
                      value={active.color}
                      onChange={(e) => updateActive({ color: e.target.value })}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </div>
                  <input
                    type="text"
                    value={active.color.toUpperCase()}
                    onChange={(e) => updateActive({ color: e.target.value })}
                    className="font-mono text-xs bg-transparent border-0 outline-none w-24"
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="inset-toggle" className="text-xs">Inset</Label>
                <Switch
                  id="inset-toggle"
                  checked={active.inset}
                  onCheckedChange={(v) => updateActive({ inset: v })}
                />
              </div>
            </div>

            <Button onClick={reset} variant="ghost" size="sm" className="gap-1.5 w-full">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </div>
      </ToolCardWrapper>

      {/* Presets */}
      <ToolCardWrapper>
        <h3 className="text-sm font-semibold mb-3">Preset shadows</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              className="group space-y-1.5"
            >
              <div className="flex h-20 items-center justify-center rounded-md border border-border bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] [background-size:12px_12px] [background-position:0_0,0_6px,6px_-6px,-6px_0] dark:bg-zinc-900">
                <div
                  className="h-10 w-10 rounded"
                  style={{ backgroundColor: p.boxColor, boxShadow: p.shadows.map(buildShadow).join(', ') }}
                />
              </div>
              <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors text-center">
                {p.name}
              </p>
            </button>
          ))}
        </div>
      </ToolCardWrapper>
    </div>
  )
}

function SliderRow({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  suffix?: string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="font-mono text-xs">{value}{suffix}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? 0)}
      />
    </div>
  )
}
