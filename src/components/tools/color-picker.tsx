'use client'

import * as React from 'react'
import { Upload, X, ImageIcon, Pipette, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper, FieldLabel, EmptyState } from '@/components/tool-page-shell'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PickedColor {
  hex: string
  r: number
  g: number
  b: number
  h: number
  s: number
  l: number
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
  )
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60
        break
      case g:
        h = ((b - r) / d + 2) * 60
        break
      default:
        h = ((r - g) / d + 4) * 60
    }
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)]
}

export default function ColorPicker() {
  const [file, setFile] = React.useState<File | null>(null)
  const [imageUrl, setImageUrl] = React.useState<string>('')
  const [origW, setOrigW] = React.useState(0)
  const [origH, setOrigH] = React.useState(0)
  const [palette, setPalette] = React.useState<PickedColor[]>([])
  const [hoverColor, setHoverColor] = React.useState<PickedColor | null>(null)
  const [copied, setCopied] = React.useState<string | null>(null)
  const [dragActive, setDragActive] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const imgRef = React.useRef<HTMLImageElement | null>(null)
  const sampleCanvasRef = React.useRef<HTMLCanvasElement | null>(null)

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    setFile(f)
    setPalette([])
    setHoverColor(null)
    const url = URL.createObjectURL(f)
    setImageUrl(url)
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setOrigW(img.naturalWidth)
      setOrigH(img.naturalHeight)
      drawCanvas()
    }
    img.onerror = () => toast.error('Failed to load image')
    img.src = url
  }

  const drawCanvas = () => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !origW || !origH) return
    const maxW = 600
    const scale = Math.min(1, maxW / origW)
    const dw = origW * scale
    const dh = origH * scale
    canvas.width = dw
    canvas.height = dh
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, 0, 0, dw, dh)
  }

  React.useEffect(() => {
    drawCanvas()
  }, [origW, origH])

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
    setHoverColor(null)
    setOrigW(0)
    setOrigH(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  const samplePixel = (e: React.MouseEvent<HTMLCanvasElement>): PickedColor | null => {
    const canvas = canvasRef.current!
    const img = imgRef.current!
    if (!canvas || !img) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    if (!sampleCanvasRef.current) {
      sampleCanvasRef.current = document.createElement('canvas')
    }
    const sample = sampleCanvasRef.current
    sample.width = img.naturalWidth
    sample.height = img.naturalHeight
    const ctx = sample.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(img, 0, 0)
    // Scale sample coordinates back to original image space
    const origScaleX = img.naturalWidth / canvas.width
    const origScaleY = img.naturalHeight / canvas.height
    const px = Math.floor(x * origScaleX)
    const py = Math.floor(y * origScaleY)
    if (px < 0 || py < 0 || px >= img.naturalWidth || py >= img.naturalHeight) return null
    const data = ctx.getImageData(px, py, 1, 1).data
    const [r, g, b] = [data[0], data[1], data[2]]
    const hex = rgbToHex(r, g, b)
    const [h, s, l] = rgbToHsl(r, g, b)
    return { hex, r, g, b, h, s, l }
  }

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = samplePixel(e)
    setHoverColor(c)
  }

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = samplePixel(e)
    if (!c) return
    setPalette((prev) => {
      if (prev.some((p) => p.hex === c.hex)) return prev
      return [c, ...prev].slice(0, 24)
    })
    toast.success(`Picked ${c.hex}`)
  }

  const copy = async (color: PickedColor) => {
    try {
      await navigator.clipboard.writeText(color.hex)
      setCopied(color.hex)
      setTimeout(() => setCopied(null), 1500)
      toast.success(`Copied ${color.hex}`)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const clearPalette = () => {
    setPalette([])
    setHoverColor(null)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolCardWrapper>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Upload & Pick</h2>
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
              <div className="overflow-auto rounded-lg border border-border bg-muted/30 p-2 flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  onMouseMove={onMouseMove}
                  onMouseLeave={() => setHoverColor(null)}
                  onClick={onClick}
                  className="max-w-full h-auto cursor-crosshair"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Move your cursor over the image to preview colors, click to add to palette.
              </p>
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
            <h2 className="text-base font-semibold">Picked Colors</h2>
            {palette.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearPalette} className="gap-1.5">
                <Trash2 className="h-4 w-4" /> Clear
              </Button>
            )}
          </div>

          {hoverColor && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-md border border-border shrink-0"
                style={{ backgroundColor: hoverColor.hex }}
              />
              <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">HEX</p>
                  <p className="font-mono font-medium">{hoverColor.hex}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">RGB</p>
                  <p className="font-mono font-medium">
                    {hoverColor.r},{hoverColor.g},{hoverColor.b}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">HSL</p>
                  <p className="font-mono font-medium">
                    {hoverColor.h},{hoverColor.s}%,{hoverColor.l}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {palette.length === 0 ? (
            <EmptyState message="Click on the image to pick colors" />
          ) : (
            <ScrollArea className="max-h-96 pr-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {palette.map((c, i) => (
                  <button
                    key={`${c.hex}-${i}`}
                    onClick={() => copy(c)}
                    className={cn(
                      'group flex flex-col overflow-hidden rounded-md border border-border hover:border-primary/60 transition-all text-left',
                    )}
                    type="button"
                  >
                    <div
                      className="h-14 w-full flex items-center justify-center"
                      style={{ backgroundColor: c.hex }}
                    >
                      {copied === c.hex && (
                        <span className="rounded-full bg-black/60 text-white px-2 py-0.5 text-[10px] font-medium flex items-center gap-1">
                          <Check className="h-3 w-3" /> Copied
                        </span>
                      )}
                    </div>
                    <div className="px-2 py-1.5 bg-background">
                      <p className="text-xs font-mono font-medium truncate">{c.hex}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {c.r},{c.g},{c.b}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          {palette.length > 0 && (
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Pipette className="h-3.5 w-3.5" /> {palette.length} color{palette.length !== 1 ? 's' : ''} picked
              </span>
              <Badge variant="outline">Click to copy</Badge>
            </div>
          )}
        </div>
      </ToolCardWrapper>
    </div>
  )
}
