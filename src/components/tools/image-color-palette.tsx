'use client'

import * as React from 'react'
import { Upload, X, ImageIcon, Palette, RefreshCw, Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper, FieldLabel, EmptyState } from '@/components/tool-page-shell'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PaletteColor {
  hex: string
  r: number
  g: number
  b: number
  count: number
  percentage: number
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0'))
      .join('')
  )
}

export default function ImageColorPalette() {
  const [file, setFile] = React.useState<File | null>(null)
  const [imageUrl, setImageUrl] = React.useState<string>('')
  const [palette, setPalette] = React.useState<PaletteColor[]>([])
  const [count, setCount] = React.useState(6)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [copied, setCopied] = React.useState<string | null>(null)
  const [dragActive, setDragActive] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const imgRef = React.useRef<HTMLImageElement | null>(null)

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    setFile(f)
    setPalette([])
    const url = URL.createObjectURL(f)
    setImageUrl(url)
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      extractPalette(img, count)
    }
    img.onerror = () => toast.error('Failed to load image')
    img.src = url
  }

  const extractPalette = React.useCallback((img: HTMLImageElement, n: number) => {
    setIsProcessing(true)
    // Downscale to max 200px for performance
    const maxDim = 200
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      setIsProcessing(false)
      return
    }
    ctx.drawImage(img, 0, 0, w, h)
    const data = ctx.getImageData(0, 0, w, h).data
    // Quantize to 4 bits per channel (16 levels per channel → 4096 buckets)
    const buckets = new Map<number, { r: number; g: number; b: number; count: number }>()
    let total = 0
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3]
      if (alpha < 125) continue // skip transparent
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      // 4-bit quantization: take top 4 bits, shift into a single key
      const qr = r >> 4
      const qg = g >> 4
      const qb = b >> 4
      const key = (qr << 8) | (qg << 4) | qb
      const existing = buckets.get(key)
      if (existing) {
        existing.r += r
        existing.g += g
        existing.b += b
        existing.count++
      } else {
        buckets.set(key, { r, g, b, count: 1 })
      }
      total++
    }
    if (total === 0) {
      setIsProcessing(false)
      return
    }
    // Sort by count desc
    const sorted = Array.from(buckets.values()).sort((a, b) => b.count - a.count)
    // Take top N buckets, compute average RGB
    const top = sorted.slice(0, n)
    const result: PaletteColor[] = top.map((b) => {
      const avgR = Math.round(b.r / b.count)
      const avgG = Math.round(b.g / b.count)
      const avgB = Math.round(b.b / b.count)
      return {
        hex: rgbToHex(avgR, avgG, avgB),
        r: avgR,
        g: avgG,
        b: avgB,
        count: b.count,
        percentage: (b.count / total) * 100,
      }
    })
    setPalette(result)
    setIsProcessing(false)
  }, [])

  React.useEffect(() => {
    if (imgRef.current) extractPalette(imgRef.current, count)
  }, [count])

  React.useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const reset = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setFile(null)
    setImageUrl('')
    setPalette([])
    if (inputRef.current) inputRef.current.value = ''
  }

  const copy = async (color: PaletteColor) => {
    try {
      await navigator.clipboard.writeText(color.hex)
      setCopied(color.hex)
      setTimeout(() => setCopied(null), 1500)
      toast.success(`Copied ${color.hex}`)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const copyAll = async () => {
    const text = palette.map((c) => c.hex).join(', ')
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied all colors')
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolCardWrapper>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Upload Image</h2>
            {file && (
              <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
                <X className="h-4 w-4" /> Clear
              </Button>
            )}
          </div>
          {!file ? (
            <div
              onDrop={onDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onClick={() => inputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-12 px-4 cursor-pointer transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent/50'
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Drag & drop image here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse · JPG, PNG, WebP</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-lg border border-border overflow-hidden bg-muted/30">
                <img src={imageUrl} alt="Source" className="w-full h-auto max-h-72 object-contain" />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex min-w-0 items-center gap-1.5 truncate">
                  <ImageIcon className="h-3.5 w-3.5" /> {file.name}
                </span>
                {isProcessing && (
                  <span className="flex shrink-0 items-center gap-1.5">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Analyzing...
                  </span>
                )}
              </div>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
        </div>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Palette className="h-4 w-4" /> Color Palette
            </h2>
            {palette.length > 0 && (
              <Button variant="ghost" size="sm" onClick={copyAll} className="gap-1.5">
                <Copy className="h-4 w-4" /> Copy all
              </Button>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-sm font-medium">Number of colors</Label>
              <span className="text-sm font-medium">{count}</span>
            </div>
            <Slider
              min={3}
              max={10}
              step={1}
              value={[count]}
              onValueChange={(v) => setCount(v[0])}
              disabled={!file}
              className="w-full"
            />
          </div>

          {palette.length === 0 ? (
            <EmptyState message="Upload an image to extract dominant colors" />
          ) : (
            <div className="space-y-3">
              {/* Combined gradient bar */}
              <div className="flex h-6 w-full overflow-hidden rounded-md border border-border">
                {palette.map((c, i) => (
                  <div
                    key={i}
                    style={{ backgroundColor: c.hex, flex: c.count }}
                    title={`${c.hex} — ${c.percentage.toFixed(1)}%`}
                  />
                ))}
              </div>

              <div className="space-y-2">
                {palette.map((c, i) => (
                  <button
                    key={`${c.hex}-${i}`}
                    onClick={() => copy(c)}
                    className={cn(
                      'group flex items-center gap-3 w-full rounded-md border border-border hover:border-primary/60 hover:bg-accent/40 p-2 transition-all text-left',
                    )}
                    type="button"
                  >
                    <div
                      className="h-10 w-10 rounded-md border border-border shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: c.hex }}
                    >
                      {copied === c.hex && (
                        <Check className="h-4 w-4 text-white drop-shadow" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono font-medium">{c.hex.toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        rgb({c.r}, {c.g}, {c.b})
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {c.percentage.toFixed(1)}%
                    </Badge>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Click any color to copy its HEX value. Colors are sorted by frequency.
              </p>
            </div>
          )}
        </div>
      </ToolCardWrapper>
    </div>
  )
}
