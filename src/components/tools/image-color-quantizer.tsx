'use client'

import * as React from 'react'
import {
  Image as ImageIcon,
  Upload,
  Download,
  Trash2,
  Palette,
  Layers,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  ToolCardWrapper,
  FieldLabel,
  EmptyState,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

interface RGB { r: number; g: number; b: number }

function rgbToHex({ r, g, b }: RGB): string {
  const to = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase()
}

/** Popularity quantization: build histogram, take top N distinct colors. */
function quantize(imageData: ImageData, n: number): { palette: RGB[]; output: ImageData } {
  const { data, width, height } = imageData
  // 4-bit per channel histogram (16 buckets = 4096 total bins) for speed.
  const bucket = new Map<number, { count: number; r: number; g: number; b: number }>()
  const total = data.length / 4
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 16) continue // skip transparent
    // 5 bits per channel for finer palette; total 32768 bins (still fine).
    const r5 = data[i] >> 3
    const g5 = data[i + 1] >> 3
    const b5 = data[i + 2] >> 3
    const key = (r5 << 10) | (g5 << 5) | b5
    const cur = bucket.get(key)
    if (cur) {
      cur.count++
      cur.r += data[i]
      cur.g += data[i + 1]
      cur.b += data[i + 2]
    } else {
      bucket.set(key, { count: 1, r: data[i], g: data[i + 1], b: data[i + 2] })
    }
  }
  // Sort by count descending
  const sorted = [...bucket.values()].sort((a, b) => b.count - a.count)
  const topN = sorted.slice(0, n).map((b) => ({
    r: Math.round(b.r / b.count),
    g: Math.round(b.g / b.count),
    b: Math.round(b.b / b.count),
  }))

  // Build palette lookup: for each pixel, find nearest palette color (naive nearest neighbor)
  const out = new ImageData(width, height)
  const lut = new Map<number, RGB>()
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a < 16) {
      out.data[i] = data[i]
      out.data[i + 1] = data[i + 1]
      out.data[i + 2] = data[i + 2]
      out.data[i + 3] = a
      continue
    }
    const r5 = data[i] >> 3
    const g5 = data[i + 1] >> 3
    const b5 = data[i + 2] >> 3
    const key = (r5 << 10) | (g5 << 5) | b5
    let target = lut.get(key)
    if (!target) {
      // nearest neighbor
      let best = topN[0]
      let bestDist = Infinity
      for (const p of topN) {
        const dr = data[i] - p.r
        const dg = data[i + 1] - p.g
        const db = data[i + 2] - p.b
        const d = dr * dr + dg * dg + db * db
        if (d < bestDist) {
          bestDist = d
          best = p
        }
      }
      target = best
      lut.set(key, target)
    }
    out.data[i] = target.r
    out.data[i + 1] = target.g
    out.data[i + 2] = target.b
    out.data[i + 3] = 255
  }
  return { palette: topN, output: out }
}

export default function ImageColorQuantizer() {
  const [original, setOriginal] = React.useState<{ img: HTMLImageElement; src: string } | null>(null)
  const [colorCount, setColorCount] = React.useState(8)
  const [palette, setPalette] = React.useState<RGB[]>([])
  const [afterUrl, setAfterUrl] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setOriginal({ img, src: url })
      toast.success(`Loaded ${file.name} (${img.width}×${img.height})`)
    }
    img.onerror = () => toast.error('Failed to load image')
    img.src = url
    e.target.value = ''
  }

  // Re-run quantization whenever inputs change
  React.useEffect(() => {
    if (!original) {
      setPalette([])
      setAfterUrl('')
      return
    }
    setBusy(true)
    // Defer to next tick so the busy state can render.
    const id = setTimeout(() => {
      try {
        const img = original.img
        const maxDim = 600
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
        const w = Math.max(1, Math.floor(img.width * scale))
        const h = Math.max(1, Math.floor(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) throw new Error('Canvas 2D not supported')
        ctx.drawImage(img, 0, 0, w, h)
        const imgData = ctx.getImageData(0, 0, w, h)
        const { palette: pal, output } = quantize(imgData, colorCount)
        setPalette(pal)
        const outCanvas = document.createElement('canvas')
        outCanvas.width = w
        outCanvas.height = h
        const outCtx = outCanvas.getContext('2d')
        if (!outCtx) throw new Error('Canvas 2D not supported')
        outCtx.putImageData(output, 0, 0)
        setAfterUrl(outCanvas.toDataURL('image/png'))
      } catch (err) {
        toast.error(`Quantize failed: ${(err as Error).message}`)
      } finally {
        setBusy(false)
      }
    }, 30)
    return () => clearTimeout(id)
  }, [original, colorCount])

  function download() {
    if (!afterUrl) {
      toast.info('Nothing to download')
      return
    }
    const a = document.createElement('a')
    a.href = afterUrl
    a.download = 'posterized.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('Downloaded posterized.png')
  }

  function copyPalette() {
    const text = palette.map((c, i) => `${(i + 1).toString().padStart(2, '0')} ${rgbToHex(c)}`).join('\n')
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success('Palette copied as HEX list'))
      .catch(() => toast.error('Copy failed'))
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <FieldLabel className="mb-0 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            Source image
          </FieldLabel>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" /> Upload
            </Button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            {original && (
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => { setOriginal(null); setAfterUrl(''); setPalette([]) }}>
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          {/* Before */}
          <div>
            <FieldLabel>Before</FieldLabel>
            <div className="aspect-video rounded-md border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
              {original ? (
                <img src={original.src} alt="original" className="max-w-full max-h-full object-contain" />
              ) : (
                <p className="text-xs text-muted-foreground p-6 text-center">Upload an image to begin</p>
              )}
            </div>
          </div>
          {/* After */}
          <div>
            <FieldLabel>After ({colorCount} colors)</FieldLabel>
            <div className="aspect-video rounded-md border border-border bg-muted/30 flex items-center justify-center overflow-hidden relative">
              {afterUrl ? (
                <img src={afterUrl} alt="posterized" className="max-w-full max-h-full object-contain" />
              ) : (
                <p className="text-xs text-muted-foreground p-6 text-center">{busy ? 'Processing…' : 'Result appears here'}</p>
              )}
              {busy && (
                <div className="absolute inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[2fr_1fr] items-end">
          <div>
            <FieldLabel>Color count: <span className="text-primary font-mono">{colorCount}</span></FieldLabel>
            <Slider value={[colorCount]} min={2} max={32} step={1} onValueChange={(v) => setColorCount(v[0])} />
          </div>
          <Button onClick={download} disabled={!afterUrl} className="gap-1.5">
            <Download className="h-4 w-4" /> Download PNG
          </Button>
        </div>
      </ToolCardWrapper>

      {/* Palette */}
      <ToolCardWrapper>
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            Palette ({palette.length} colors)
          </h3>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={copyPalette} disabled={palette.length === 0}>
            <Layers className="h-4 w-4" /> Copy as HEX list
          </Button>
        </div>
        {palette.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {palette.map((c, i) => {
              const hex = rgbToHex(c)
              return (
                <button
                  key={i}
                  onClick={() => {
                    navigator.clipboard.writeText(hex)
                    toast.success(`Copied ${hex}`)
                  }}
                  className="group flex flex-col items-stretch rounded-md border border-border overflow-hidden hover:border-primary/60 transition-colors"
                  title={`Click to copy ${hex}`}
                >
                  <div className="h-12 w-full" style={{ backgroundColor: hex }} />
                  <div className="px-2 py-1.5">
                    <p className="text-[10px] text-muted-foreground tabular-nums">#{(i + 1).toString().padStart(2, '0')}</p>
                    <p className="font-mono text-xs">{hex}</p>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <EmptyState message="Upload an image and the palette will appear here." />
        )}
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">How it works</h3>
        </div>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>The image is loaded onto a canvas and its pixels are read into an RGB array.</li>
          <li>A <strong>5-bit per channel color histogram</strong> is built (32 768 bins). Each bin accumulates color counts and sums of R/G/B values.</li>
          <li>The top <span className="font-mono text-primary">N</span> bins by popularity become the new palette. Each bin's representative color is the average color of all pixels in that bin.</li>
          <li>Every original pixel is then re-mapped to its <strong>nearest palette color</strong> (Euclidean RGB distance) using a per-bucket LUT for speed.</li>
          <li>Transparent pixels are preserved as-is.</li>
          <li>For higher quality (e.g. photographic images), consider using a median-cut or k-means algorithm — this simple approach is fast and produces poster-like results.</li>
        </ul>
      </ToolCardWrapper>

      {/* Hidden canvas (not strictly needed; kept for API parity) */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
