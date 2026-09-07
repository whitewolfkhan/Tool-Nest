'use client'

import * as React from 'react'
import {
  Contrast,
  ArrowLeftRight,
  Check,
  X,
  Sparkles,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  ToolCardWrapper,
  FieldLabel,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

function relLum({ r, g, b }: { r: number; g: number; b: number }): number {
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrastRatio(fg: string, bg: string): { ratio: number; error?: string } {
  const f = hexToRgb(fg)
  const b = hexToRgb(bg)
  if (!f || !b) return { ratio: 0, error: 'Invalid hex color' }
  const lf = relLum(f)
  const lb = relLum(b)
  const lighter = Math.max(lf, lb)
  const darker = Math.min(lf, lb)
  return { ratio: (lighter + 0.05) / (darker + 0.05) }
}

interface WcagResult {
  label: string
  desc: string
  pass: boolean
  threshold: number
}

function evaluateWcag(ratio: number): WcagResult[] {
  return [
    { label: 'AA Normal', desc: '≥ 4.5:1 for body text', threshold: 4.5, pass: ratio >= 4.5 },
    { label: 'AA Large', desc: '≥ 3:1 for ≥18pt or 14pt bold', threshold: 3, pass: ratio >= 3 },
    { label: 'AAA Normal', desc: '≥ 7:1 for body text', threshold: 7, pass: ratio >= 7 },
    { label: 'AAA Large', desc: '≥ 4.5:1 for large text', threshold: 4.5, pass: ratio >= 4.5 },
  ].map((r) => ({ ...r, pass: ratio >= r.threshold }))
}

/** Generate suggestions for adjusting a color toward better contrast. */
function suggestColors(fg: string, bg: string, target: number): string[] {
  const f = hexToRgb(fg)
  const b = hexToRgb(bg)
  if (!f || !b) return []
  const lf = relLum(f)
  const lb = relLum(b)
  const fgLighter = lf > lb
  const suggestions: string[] = []
  const targetLum = fgLighter
    ? (1.05 * lb - 0.05 * (target - 1)) / target + 0.05 * (target - 1) / target
    : 0
  // Simple iterative adjustment: vary the foreground luminance up or down in 10 steps.
  const step = fgLighter ? 1 : -1
  for (let delta = 0; delta <= 255; delta += 8) {
    const nr = Math.max(0, Math.min(255, f.r + step * delta))
    const ng = Math.max(0, Math.min(255, f.g + step * delta))
    const nb = Math.max(0, Math.min(255, f.b + step * delta))
    const newHex = `#${[nr, ng, nb].map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`
    const r = contrastRatio(newHex, bg)
    if (r.ratio >= target && !suggestions.includes(newHex)) {
      suggestions.push(newHex)
      if (suggestions.length >= 5) break
    }
  }
  // Silence unused-var warning while keeping the formula reference.
  void targetLum
  return suggestions
}

const SAMPLE_TEXTS = [
  'The quick brown fox jumps over the lazy dog.',
  'Pack my box with five dozen liquor jugs.',
  'ABC abc 1234567890',
]

export default function ColorContrastChecker() {
  const [fg, setFg] = React.useState('#10B981')
  const [bg, setBg] = React.useState('#0F172A')
  const [sampleIdx, setSampleIdx] = React.useState(0)
  const [fontSize, setFontSize] = React.useState(18)

  const { ratio, error } = React.useMemo(() => contrastRatio(fg, bg), [fg, bg])
  const wcag = error ? [] : evaluateWcag(ratio)
  const passesAA = wcag[0]?.pass ?? false
  const suggestions = !error && !passesAA ? suggestColors(fg, bg, 4.5) : []

  function swap() {
    setFg(bg)
    setBg(fg)
    toast.success('Colors swapped')
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Color pickers */}
          <div className="space-y-4">
            <ColorRow
              label="Foreground (text)"
              hex={fg}
              onHexChange={setFg}
            />
            <ColorRow
              label="Background"
              hex={bg}
              onHexChange={setBg}
            />

            <Button onClick={swap} variant="outline" size="sm" className="gap-1.5 w-full">
              <ArrowLeftRight className="h-4 w-4" /> Swap colors
            </Button>

            {error && (
              <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}
          </div>

          {/* Contrast ratio */}
          <div className="space-y-3">
            <div className="rounded-lg border border-border/60 bg-card/50 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Contrast className="h-3.5 w-3.5" /> Contrast ratio
              </div>
              <div className="text-4xl font-bold tabular-nums">
                {ratio.toFixed(2)}<span className="text-2xl text-muted-foreground">:1</span>
              </div>
              <Badge
                className={`mt-2 ${passesAA ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-500/15'}`}
              >
                {passesAA ? 'Passes AA' : 'Fails AA'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {wcag.map((r) => (
                <div
                  key={r.label}
                  className={`flex items-start gap-2 rounded-md border p-2.5 ${
                    r.pass
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : 'border-rose-500/40 bg-rose-500/5'
                  }`}
                >
                  {r.pass
                    ? <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    : <X className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-xs font-medium">{r.label}</p>
                    <p className="text-[10px] text-muted-foreground">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ToolCardWrapper>

      {/* Live preview */}
      <ToolCardWrapper>
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <FieldLabel className="mb-0 flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" /> Live preview
          </FieldLabel>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSampleIdx((sampleIdx + 1) % SAMPLE_TEXTS.length)}>
              Next sample
            </Button>
            <span className="text-xs text-muted-foreground">Size: <span className="font-mono text-primary">{fontSize}px</span></span>
          </div>
        </div>

        <div
          className="rounded-lg border border-border p-6 sm:p-8 min-h-[160px] flex flex-col justify-center"
          style={{ backgroundColor: bg }}
        >
          <p
            className="font-medium leading-snug"
            style={{ color: fg, fontSize: `${fontSize}px` }}
          >
            {SAMPLE_TEXTS[sampleIdx]}
          </p>
          <p
            className="mt-3 text-muted-foreground"
            style={{ color: fg, fontSize: `${Math.max(10, fontSize - 6)}px`, opacity: 0.8 }}
          >
            Secondary text — smaller size ({Math.max(10, fontSize - 6)}px)
          </p>
        </div>

        <div className="mt-3">
          <Slider value={[fontSize]} min={12} max={32} step={1} onValueChange={(v) => setFontSize(v[0])} />
        </div>
      </ToolCardWrapper>

      {/* Suggestions */}
      {!error && !passesAA && suggestions.length > 0 && (
        <ToolCardWrapper>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold">Suggested foreground colors (pass AA ≥ 4.5:1)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {suggestions.map((s) => {
              const r = contrastRatio(s, bg)
              return (
                <button
                  key={s}
                  onClick={() => {
                    setFg(s)
                    toast.success(`Applied ${s}`)
                  }}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/60 hover:bg-accent transition-colors text-left"
                >
                  <div className="h-10 w-10 rounded-md shrink-0" style={{ backgroundColor: s }} />
                  <div>
                    <p className="font-mono text-xs">{s}</p>
                    <p className="text-[10px] text-muted-foreground">{r.ratio.toFixed(2)}:1 ratio</p>
                  </div>
                </button>
              )
            })}
          </div>
        </ToolCardWrapper>
      )}

      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">WCAG reference</h3>
        </div>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li><strong>AA (Level 2):</strong> ≥ 4.5:1 for normal text, ≥ 3:1 for large text (≥18pt regular or ≥14pt bold).</li>
          <li><strong>AAA (Level 3):</strong> ≥ 7:1 for normal text, ≥ 4.5:1 for large text.</li>
          <li>Ratio is computed from the <em>relative luminance</em> of each color per the WCAG 2.x formula: <code className="font-mono">(L1 + 0.05) / (L2 + 0.05)</code> where L1 ≥ L2.</li>
          <li>Non-text elements (icons, borders) need ≥ 3:1 against adjacent colors.</li>
        </ul>
      </ToolCardWrapper>
    </div>
  )
}

function ColorRow({
  label,
  hex,
  onHexChange,
}: {
  label: string
  hex: string
  onHexChange: (v: string) => void
}) {
  const rgb = hexToRgb(hex)
  return (
    <div className="rounded-lg border border-border/60 p-3">
      <FieldLabel className="flex items-center justify-between">
        <span>{label}</span>
        {rgb && (
          <span className="font-mono text-xs text-muted-foreground">
            rgb({rgb.r}, {rgb.g}, {rgb.b})
          </span>
        )}
      </FieldLabel>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#000000'}
          onChange={(e) => onHexChange(e.target.value.toUpperCase())}
          className="h-9 w-12 rounded cursor-pointer border border-border bg-transparent"
        />
        <Input
          value={hex}
          onChange={(e) => onHexChange(e.target.value)}
          className="font-mono text-sm flex-1 uppercase"
          placeholder="#10B981"
        />
      </div>
    </div>
  )
}
