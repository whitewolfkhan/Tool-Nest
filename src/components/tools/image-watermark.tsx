'use client'

import * as React from 'react'
import { Upload, X, ImageIcon, Type, Image as ImageLucide, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper, FieldLabel, DownloadButton, EmptyState } from '@/components/tool-page-shell'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Position =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

const POSITIONS: { value: Position; label: string }[] = [
  { value: 'top-left', label: '↖' },
  { value: 'top-center', label: '↑' },
  { value: 'top-right', label: '↗' },
  { value: 'middle-left', label: '←' },
  { value: 'middle-center', label: '•' },
  { value: 'middle-right', label: '→' },
  { value: 'bottom-left', label: '↙' },
  { value: 'bottom-center', label: '↓' },
  { value: 'bottom-right', label: '↘' },
]

type WatermarkMode = 'text' | 'logo'

export default function ImageWatermark() {
  const [file, setFile] = React.useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = React.useState<string>('')
  const [previewUrl, setPreviewUrl] = React.useState<string>('')
  const [origW, setOrigW] = React.useState(0)
  const [origH, setOrigH] = React.useState(0)
  const [mode, setMode] = React.useState<WatermarkMode>('text')
  const [text, setText] = React.useState('© Your Brand')
  const [logoFile, setLogoFile] = React.useState<File | null>(null)
  const [logoUrl, setLogoUrl] = React.useState<string>('')
  const [position, setPosition] = React.useState<Position>('bottom-right')
  const [opacity, setOpacity] = React.useState(70)
  const [fontSize, setFontSize] = React.useState(48)
  const [color, setColor] = React.useState('#ffffff')
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [dragActive, setDragActive] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const logoInputRef = React.useRef<HTMLInputElement>(null)
  const imgRef = React.useRef<HTMLImageElement | null>(null)
  const logoImgRef = React.useRef<HTMLImageElement | null>(null)

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    setFile(f)
    const url = URL.createObjectURL(f)
    setOriginalUrl(url)
    setPreviewUrl('')
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setOrigW(img.naturalWidth)
      setOrigH(img.naturalHeight)
      applyWatermark()
    }
    img.onerror = () => toast.error('Failed to load image')
    img.src = url
  }

  const handleLogoFile = (f: File) => {
    if (!f.type.startsWith('image/')) {
      toast.error('Please upload a logo image (PNG recommended for transparency)')
      return
    }
    setLogoFile(f)
    const url = URL.createObjectURL(f)
    if (logoUrl) URL.revokeObjectURL(logoUrl)
    setLogoUrl(url)
    const img = new Image()
    img.onload = () => {
      logoImgRef.current = img
      applyWatermark()
    }
    img.src = url
  }

  const applyWatermark = () => {
    const img = imgRef.current
    if (!img) return
    if (mode === 'logo' && !logoImgRef.current) return
    setIsProcessing(true)
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setIsProcessing(false)
      return
    }
    ctx.drawImage(img, 0, 0)

    const padding = Math.round(Math.max(canvas.width, canvas.height) * 0.02)
    ctx.globalAlpha = opacity / 100

    if (mode === 'text' && text) {
      // Scale font size relative to image width if not set explicitly
      const fs = Math.max(12, fontSize)
      ctx.font = `bold ${fs}px sans-serif`
      ctx.textBaseline = 'top'
      const metrics = ctx.measureText(text)
      const tw = metrics.width
      const th = fs * 1.2
      const { x, y } = computePosition(position, tw, th, canvas.width, canvas.height, padding)
      // Draw subtle shadow for visibility
      ctx.shadowColor = 'rgba(0,0,0,0.6)'
      ctx.shadowBlur = Math.max(2, fs / 16)
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 1
      ctx.fillStyle = color
      ctx.fillText(text, x, y)
    } else if (mode === 'logo' && logoImgRef.current) {
      const logo = logoImgRef.current
      const maxW = canvas.width * 0.3
      const scale = Math.min(1, maxW / logo.naturalWidth)
      const lw = logo.naturalWidth * scale
      const lh = logo.naturalHeight * scale
      const { x, y } = computePosition(position, lw, lh, canvas.width, canvas.height, padding)
      ctx.drawImage(logo, x, y, lw, lh)
    }

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev)
            return URL.createObjectURL(blob)
          })
        }
        setIsProcessing(false)
      },
      file?.type === 'image/png' ? 'image/png' : 'image/jpeg',
      0.92
    )
  }

  React.useEffect(() => {
    if (imgRef.current) applyWatermark()
  }, [mode, text, logoUrl, position, opacity, fontSize, color])

  React.useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      if (logoUrl) URL.revokeObjectURL(logoUrl)
    }
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const reset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setOriginalUrl('')
    setPreviewUrl('')
    setOrigW(0)
    setOrigH(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  const download = () => {
    if (!previewUrl) return
    const a = document.createElement('a')
    a.href = previewUrl
    const ext = file?.type === 'image/png' ? 'png' : 'jpg'
    a.download = `watermarked-${Date.now()}.${ext}`
    a.click()
    toast.success('Image downloaded')
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
                <img src={originalUrl} alt="Original" className="w-full h-auto max-h-72 object-contain" />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex min-w-0 items-center gap-1.5 truncate">
                  <ImageIcon className="h-3.5 w-3.5" /> {file.name}
                </span>
                <Badge variant="outline" className="shrink-0">
                  {origW}×{origH}
                </Badge>
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
          <h2 className="text-base font-semibold">Watermark Settings</h2>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={mode === 'text' ? 'default' : 'outline'}
              onClick={() => setMode('text')}
              className="gap-1.5"
            >
              <Type className="h-4 w-4" /> Text
            </Button>
            <Button
              variant={mode === 'logo' ? 'default' : 'outline'}
              onClick={() => setMode('logo')}
              className="gap-1.5"
            >
              <ImageLucide className="h-4 w-4" /> Logo
            </Button>
          </div>

          {mode === 'text' ? (
            <div className="space-y-3">
              <div>
                <FieldLabel>Watermark text</FieldLabel>
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="© Your Brand"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Font size</FieldLabel>
                  <div className="flex items-center gap-2 h-9">
                    <Slider
                      min={12}
                      max={200}
                      step={1}
                      value={[fontSize]}
                      onValueChange={(v) => setFontSize(v[0])}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-10 text-right">{fontSize}</span>
                  </div>
                </div>
                <div>
                  <FieldLabel>Text color</FieldLabel>
                  <div className="flex items-center gap-2 h-9">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-9 w-12 rounded border border-border bg-background cursor-pointer"
                    />
                    <span className="text-sm font-mono uppercase">{color}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <FieldLabel>Logo image (PNG with transparency recommended)</FieldLabel>
              <div
                onClick={() => logoInputRef.current?.click()}
                className="flex items-center gap-3 rounded-lg border-2 border-dashed border-border py-4 px-4 cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-12 w-12 object-contain" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div className="text-sm">
                  <p className="font-medium">{logoFile ? logoFile.name : 'Upload logo'}</p>
                  <p className="text-xs text-muted-foreground">Click to browse</p>
                </div>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleLogoFile(f)
                }}
              />
            </div>
          )}

          <div>
            <FieldLabel>Position</FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              {POSITIONS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPosition(p.value)}
                  className={cn(
                    'flex h-10 items-center justify-center rounded-md border text-lg transition-colors',
                    position === p.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-accent/50'
                  )}
                  aria-label={p.value}
                  type="button"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-sm font-medium">Opacity</Label>
              <span className="text-sm font-medium">{opacity}%</span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[opacity]}
              onValueChange={(v) => setOpacity(v[0])}
              className="w-full"
            />
          </div>

          {previewUrl ? (
            <div className="space-y-3">
              <FieldLabel>Preview</FieldLabel>
              <div className="relative rounded-lg border border-border overflow-hidden bg-muted/30">
                <img src={previewUrl} alt="Watermarked" className="w-full h-auto max-h-72 object-contain" />
              </div>
              <div className="flex items-center justify-between gap-2">
                {isProcessing && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Processing...
                  </span>
                )}
                <DownloadButton onClick={download} className="ml-auto" label="Download" />
              </div>
            </div>
          ) : (
            <EmptyState message="Watermarked preview will appear here" />
          )}
        </div>
      </ToolCardWrapper>
    </div>
  )
}

function computePosition(
  pos: Position,
  w: number,
  h: number,
  cw: number,
  ch: number,
  padding: number
): { x: number; y: number } {
  const [v, hAlign] = pos.split('-')
  let x = padding
  let y = padding
  if (hAlign === 'center') x = (cw - w) / 2
  if (hAlign === 'right') x = cw - w - padding
  if (v === 'middle') y = (ch - h) / 2
  if (v === 'bottom') y = ch - h - padding
  return { x, y }
}
