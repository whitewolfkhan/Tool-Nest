'use client'

import * as React from 'react'
import { Upload, X, ImageIcon, RefreshCw, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper, FieldLabel, DownloadButton, EmptyState } from '@/components/tool-page-shell'
import { toast } from 'sonner'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(k)))
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`
}

const PRESETS = [
  { label: '25%', scale: 0.25 },
  { label: '50%', scale: 0.5 },
  { label: '75%', scale: 0.75 },
  { label: '100%', scale: 1 },
]

export default function ImageResize() {
  const [file, setFile] = React.useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = React.useState<string>('')
  const [previewUrl, setPreviewUrl] = React.useState<string>('')
  const [originalSize, setOriginalSize] = React.useState(0)
  const [newSize, setNewSize] = React.useState(0)
  const [origW, setOrigW] = React.useState(0)
  const [origH, setOrigH] = React.useState(0)
  const [width, setWidth] = React.useState(0)
  const [height, setHeight] = React.useState(0)
  const [keepAspect, setKeepAspect] = React.useState(true)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [dragActive, setDragActive] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const imgRef = React.useRef<HTMLImageElement | null>(null)
  const aspectRef = React.useRef(1)

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    setFile(f)
    setOriginalSize(f.size)
    const url = URL.createObjectURL(f)
    setOriginalUrl(url)
    setPreviewUrl('')
    setNewSize(0)
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setOrigW(img.naturalWidth)
      setOrigH(img.naturalHeight)
      setWidth(img.naturalWidth)
      setHeight(img.naturalHeight)
      aspectRef.current = img.naturalWidth / img.naturalHeight
      doResize(img, img.naturalWidth, img.naturalHeight)
    }
    img.onerror = () => toast.error('Failed to load image')
    img.src = url
  }

  const doResize = React.useCallback((img: HTMLImageElement, w: number, h: number) => {
    if (w <= 0 || h <= 0) return
    setIsProcessing(true)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w)
    canvas.height = Math.round(h)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setIsProcessing(false)
      return
    }
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setNewSize(blob.size)
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
  }, [file])

  React.useEffect(() => {
    if (imgRef.current) doResize(imgRef.current, width, height)
  }, [width, height])

  React.useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const onWidth = (v: number) => {
    if (keepAspect && v > 0) {
      setWidth(v)
      setHeight(Math.round(v / aspectRef.current))
    } else {
      setWidth(v)
    }
  }
  const onHeight = (v: number) => {
    if (keepAspect && v > 0) {
      setHeight(v)
      setWidth(Math.round(v * aspectRef.current))
    } else {
      setHeight(v)
    }
  }

  const applyScale = (scale: number) => {
    setWidth(Math.round(origW * scale))
    setHeight(Math.round(origH * scale))
  }

  const download = () => {
    if (!previewUrl) return
    const a = document.createElement('a')
    a.href = previewUrl
    const ext = file?.type === 'image/png' ? 'png' : 'jpg'
    a.download = `resized-${width}x${height}-${Date.now()}.${ext}`
    a.click()
    toast.success('Image downloaded')
  }

  const reset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setOriginalUrl('')
    setPreviewUrl('')
    setNewSize(0)
    setOriginalSize(0)
    if (inputRef.current) inputRef.current.value = ''
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
                <span className="shrink-0">
                  {origW}×{origH} · {formatBytes(originalSize)}
                </span>
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
          <h2 className="text-base font-semibold">Resize Settings</h2>
          <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="aspect" className="text-sm cursor-pointer">
                Maintain aspect ratio
              </Label>
            </div>
            <Switch id="aspect" checked={keepAspect} onCheckedChange={setKeepAspect} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Width (px)</FieldLabel>
              <Input
                type="number"
                min={1}
                value={width || ''}
                onChange={(e) => onWidth(Number(e.target.value))}
              />
            </div>
            <div>
              <FieldLabel>Height (px)</FieldLabel>
              <Input
                type="number"
                min={1}
                value={height || ''}
                onChange={(e) => onHeight(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <FieldLabel>Quick scale</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p.label}
                  variant="outline"
                  size="sm"
                  onClick={() => applyScale(p.scale)}
                  disabled={!file}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3 bg-muted/30 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Original</p>
              <p className="font-medium">
                {origW}×{origH}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">New</p>
              <p className="font-medium">
                {width}×{height} · {formatBytes(newSize)}
              </p>
            </div>
          </div>

          {previewUrl ? (
            <div className="space-y-3">
              <FieldLabel>Preview</FieldLabel>
              <div className="relative rounded-lg border border-border overflow-hidden bg-muted/30">
                <img src={previewUrl} alt="Resized" className="w-full h-auto max-h-72 object-contain" />
              </div>
              <div className="flex items-center justify-between gap-2">
                {isProcessing && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Processing...
                  </span>
                )}
                <Badge variant="secondary" className="ml-auto">
                  {width}×{height}
                </Badge>
                <DownloadButton onClick={download} label="Download" />
              </div>
            </div>
          ) : (
            <EmptyState message="Resized preview will appear here" />
          )}
        </div>
      </ToolCardWrapper>
    </div>
  )
}
