'use client'

import * as React from 'react'
import {
  Copy,
  Check,
  Plus,
  Sparkles,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  ToolCardWrapper,
  FieldLabel,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

type GradientType = 'linear' | 'radial' | 'conic'

interface ColorStop {
  id: string
  color: string
  pos: number // 0-100
}

interface Preset {
  name: string
  type: GradientType
  stops: { color: string; pos: number }[]
  angle?: number
  cx?: number
  cy?: number
}

const PRESETS: Preset[] = [
  { name: 'Emerald Glow', type: 'linear', stops: [{ color: '#10B981', pos: 0 }, { color: '#14B8A6', pos: 100 }], angle: 135 },
  { name: 'Sunset', type: 'linear', stops: [{ color: '#F59E0B', pos: 0 }, { color: '#EF4444', pos: 100 }], angle: 45 },
  { name: 'Lime Punch', type: 'linear', stops: [{ color: '#84CC16', pos: 0 }, { color: '#22C55E', pos: 100 }], angle: 90 },
  { name: 'Rose Quartz', type: 'linear', stops: [{ color: '#F43F5E', pos: 0 }, { color: '#FB7185', pos: 100 }], angle: 120 },
  { name: 'Violet Dream', type: 'linear', stops: [{ color: '#8B5CF6', pos: 0 }, { color: '#EC4899', pos: 100 }], angle: 90 },
  { name: 'Cyan Sky', type: 'linear', stops: [{ color: '#06B6D4', pos: 0 }, { color: '#0EA5E9', pos: 100 }], angle: 180 },
  { name: 'Mango Tango', type: 'conic', stops: [{ color: '#F59E0B', pos: 0 }, { color: '#EF4444', pos: 50 }, { color: '#F59E0B', pos: 100 }], cx: 50, cy: 50 },
  { name: 'Forest Radial', type: 'radial', stops: [{ color: '#10B981', pos: 0 }, { color: '#064E3B', pos: 100 }], cx: 50, cy: 50 },
  { name: 'Twilight', type: 'linear', stops: [{ color: '#8B5CF6', pos: 0 }, { color: '#06B6D4', pos: 100 }], angle: 135 },
  { name: 'Coral Bloom', type: 'radial', stops: [{ color: '#FB7185', pos: 0 }, { color: '#7C2D12', pos: 100 }], cx: 50, cy: 50 },
]

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function buildCss(
  type: GradientType,
  stops: ColorStop[],
  angle: number,
  cx: number,
  cy: number,
  usePercent: boolean
): string {
  const sorted = [...stops].sort((a, b) => a.pos - b.pos)
  const stopsStr = sorted.map((s) => `${s.color} ${s.pos}%`).join(', ')
  if (type === 'linear') {
    return `linear-gradient(${angle}deg, ${stopsStr})`
  }
  if (type === 'radial') {
    return `radial-gradient(circle at ${cx}% ${cy}%, ${stopsStr})`
  }
  // conic
  const fromAngle = usePercent ? 0 : 0
  return `conic-gradient(from ${fromAngle}deg at ${cx}% ${cy}%, ${stopsStr})`
}

export default function CssGradientGenerator() {
  const [type, setType] = React.useState<GradientType>('linear')
  const [stops, setStops] = React.useState<ColorStop[]>([
    { id: uid(), color: '#10B981', pos: 0 },
    { id: uid(), color: '#F59E0B', pos: 100 },
  ])
  const [angle, setAngle] = React.useState(135)
  const [cx, setCx] = React.useState(50)
  const [cy, setCy] = React.useState(50)
  const [copied, setCopied] = React.useState(false)

  const css = React.useMemo(
    () => buildCss(type, stops, angle, cx, cy, false),
    [type, stops, angle, cx, cy]
  )

  const addStop = () => {
    if (stops.length >= 5) {
      toast.error('Maximum 5 color stops')
      return
    }
    const lastPos = stops[stops.length - 1]?.pos ?? 50
    const newPos = Math.min(100, Math.round(lastPos + 25))
    setStops([...stops, { id: uid(), color: '#FFFFFF', pos: newPos }])
  }
  const removeStop = (id: string) => {
    if (stops.length <= 2) {
      toast.error('Need at least 2 color stops')
      return
    }
    setStops(stops.filter((s) => s.id !== id))
  }
  const updateStop = (id: string, patch: Partial<ColorStop>) => {
    setStops(stops.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }
  const reset = () => {
    setType('linear')
    setStops([
      { id: uid(), color: '#10B981', pos: 0 },
      { id: uid(), color: '#F59E0B', pos: 100 },
    ])
    setAngle(135)
    setCx(50)
    setCy(50)
    toast.success('Reset to default')
  }
  const applyPreset = (p: Preset) => {
    setType(p.type)
    setStops(p.stops.map((s) => ({ id: uid(), ...s })))
    if (p.angle !== undefined) setAngle(p.angle)
    if (p.cx !== undefined) setCx(p.cx)
    if (p.cy !== undefined) setCy(p.cy)
    toast.success(`Loaded "${p.name}" preset`)
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(`background: ${css};`)
      setCopied(true)
      toast.success('CSS copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const angleStyle = { transform: `rotate(${angle}deg)` }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Controls */}
          <div className="space-y-5">
            <div>
              <FieldLabel>Gradient type</FieldLabel>
              <Tabs value={type} onValueChange={(v) => setType(v as GradientType)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="linear">Linear</TabsTrigger>
                  <TabsTrigger value="radial">Radial</TabsTrigger>
                  <TabsTrigger value="conic">Conic</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Color stops */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <FieldLabel className="mb-0">Color stops</FieldLabel>
                <Button size="sm" variant="outline" onClick={addStop} className="gap-1 h-7">
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {stops.map((s) => (
                  <div key={s.id} className="rounded-md border border-border p-2.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-border">
                        <div className="absolute inset-0" style={{ backgroundColor: s.color }} />
                        <input
                          type="color"
                          aria-label={`Color for stop ${s.pos}%`}
                          value={s.color}
                          onChange={(e) => updateStop(s.id, { color: e.target.value })}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                      </div>
                      <input
                        type="text"
                        value={s.color.toUpperCase()}
                        onChange={(e) => updateStop(s.id, { color: e.target.value })}
                        className="font-mono text-xs bg-transparent border-0 outline-none w-20 focus:outline-none"
                        spellCheck={false}
                      />
                      <span className="text-xs text-muted-foreground ml-auto">{s.pos}%</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeStop(s.id)}
                        aria-label="Remove stop"
                      >
                        ×
                      </Button>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[s.pos]}
                      onValueChange={(v) => updateStop(s.id, { pos: v[0] ?? 0 })}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Type-specific controls */}
            {type === 'linear' && (
              <div>
                <FieldLabel>Angle: {angle}°</FieldLabel>
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 rounded-full border-2 border-border flex items-center justify-center">
                    <div
                      className="h-1 w-5 bg-primary rounded-full origin-center"
                      style={angleStyle}
                    />
                  </div>
                  <Slider
                    min={0}
                    max={360}
                    step={1}
                    value={[angle]}
                    onValueChange={(v) => setAngle(v[0] ?? 0)}
                    className="flex-1"
                  />
                </div>
              </div>
            )}

            {(type === 'radial' || type === 'conic') && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Center X: {cx}%</FieldLabel>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[cx]}
                    onValueChange={(v) => setCx(v[0] ?? 50)}
                  />
                </div>
                <div>
                  <FieldLabel>Center Y: {cy}%</FieldLabel>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    value={[cy]}
                    onValueChange={(v) => setCy(v[0] ?? 50)}
                  />
                </div>
              </div>
            )}

            <Button onClick={reset} variant="ghost" size="sm" className="gap-1.5 w-full">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to default
            </Button>
          </div>

          {/* Preview + code */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                Live preview
              </h3>
              <Badge variant="secondary" className="capitalize">{type}</Badge>
            </div>
            <div
              className="h-56 w-full rounded-lg border border-border"
              style={{ background: css }}
            />
            <div className="rounded-md border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Generated CSS</span>
                <Button size="sm" variant="outline" onClick={onCopy} className="gap-1.5 h-7">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <pre className="font-mono text-xs whitespace-pre-wrap break-all">{`background: ${css};`}</pre>
            </div>
          </div>
        </div>
      </ToolCardWrapper>

      {/* Presets */}
      <ToolCardWrapper>
        <h3 className="text-sm font-semibold mb-3">Preset gradients</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {PRESETS.map((p) => {
            const cssP = buildCss(p.type, p.stops.map((s) => ({ id: uid(), ...s })), p.angle ?? 135, p.cx ?? 50, p.cy ?? 50, false)
            return (
              <button
                key={p.name}
                onClick={() => applyPreset(p)}
                className="group space-y-1.5"
                title={p.name}
              >
                <div
                  className="h-20 w-full rounded-md border border-border transition-transform group-hover:scale-[1.02]"
                  style={{ background: cssP }}
                />
                <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate">
                  {p.name}
                </p>
              </button>
            )
          })}
        </div>
      </ToolCardWrapper>

      <p className="text-xs text-muted-foreground text-center">
        All gradient math runs in your browser. Click any swatch in the preview to copy the CSS.
      </p>
    </div>
  )
}
