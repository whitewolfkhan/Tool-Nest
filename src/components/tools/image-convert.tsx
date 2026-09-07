'use client'

import * as React from 'react'
import { Upload, X, ImageIcon, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(k)))
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`
}

type Format = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/bmp'

const FORMAT_OPTIONS: { value: Format; label: string; ext: string; lossy: boolean }[] = [
  { value: 'image/jpeg', label: 'JPG', ext: 'jpg', lossy: true },
  { value: 'image/png', label: 'PNG', ext: 'png', lossy: false },
  { value: 'image/webp', label: 'WebP', ext: 'webp', lossy: true },
  { value: 'image/bmp', label: 'BMP', ext: 'bmp', lossy: false },
]

export default function ImageConvert() {
  const [file, setFile] = React.useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = React.useState<string>('')
  const [previewUrl, setPreviewUrl] = React.useState<string>('')
  const [originalSize, setOriginalSize] = React.useState(0)
  const [newSize, setNewSize] = React.useState(0)
  const [format, setFormat] = React.useState<Format>('image/webp')
  const [quality, setQuality] = React.useState(85)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [dragActive, setDragActive] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const imgRef = React.useRef<HTMLImageElement | null>(null)

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
      doConvert(img, format, quality)
    }
    img.onerror = () => toast.error('Failed to load image')
    img.src = url
  }

  const doConvert = React.useCallback((img: HTMLImageElement, fmt: Format, q: number) => {
    setIsProcessing(true)
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setIsProcessing(false)
      return
    }
    if (fmt === 'image/jpeg' || fmt === 'image/bmp') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    ctx.drawImage(img, 0, 0)
    // For BMP, canvas.toBlob does not support image/bmp directly in all browsers
    // Fall back to PNG → BMP not supported, use PNG extension
    const outType = fmt === 'image/bmp' ? 'image/png' : fmt
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
      outType,
      q / 100
    )
  }, [])

  React.useEffect(() => {
    if (imgRef.current) doConvert(imgRef.current, format, quality)
  }, [format, quality])

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

  const download = () => {
    if (!previewUrl) return
    const a = document.createElement('a')
    a.href = previewUrl
    const opt = FORMAT_OPTIONS.find((o) => o.value === format)!
    const ext = format === 'image/bmp' ? 'bmp' : opt.ext
    a.download = `converted-${Date.now()}.${ext}`
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

  const opt = FORMAT_OPTIONS.find((o) => o.value === format)!

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
                <span className="flex items-center gap-1.5 truncate">
                  <ImageIcon className="h-3.5 w-3.5" /> {file.name}
                </span>
                <Badge variant="outline" className="uppercase">
                  {file.type.split('/')[1]}
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
          <h2 className="text-base font-semibold">Conversion Settings</h2>
          <div>
            <FieldLabel>Output format</FieldLabel>
            <Select value={format} onValueChange={(v) => setFormat(v as Format)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label} {o.lossy ? '(lossy)' : '(lossless)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {opt.lossy && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-sm font-medium">Quality</Label>
                <span className="text-sm font-medium">{quality}%</span>
              </div>
              <Slider
                min={10}
                max={100}
                step={1}
                value={[quality]}
                onValueChange={(v) => setQuality(v[0])}
                className="w-full"
              />
            </div>
          )}

          {format === 'image/bmp' && (
            <p className="text-xs text-muted-foreground">
              Note: BMP output uses lossless PNG internally in browsers that lack native BMP encoding.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3 bg-muted/30">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Original</p>
              <p className="text-sm font-semibold">{formatBytes(originalSize)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Converted</p>
              <p className="text-sm font-semibold">{formatBytes(newSize)}</p>
            </div>
          </div>

          {previewUrl ? (
            <div className="space-y-3">
              <FieldLabel>Preview</FieldLabel>
              <div className="relative rounded-lg border border-border overflow-hidden bg-muted/30">
                <img src={previewUrl} alt="Converted" className="w-full h-auto max-h-72 object-contain" />
              </div>
              <div className="flex items-center justify-between gap-2">
                {isProcessing && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Processing...
                  </span>
                )}
                <DownloadButton onClick={download} className="ml-auto" label={`Download ${opt.label}`} />
              </div>
            </div>
          ) : (
            <EmptyState message="Converted preview will appear here" />
          )}
        </div>
      </ToolCardWrapper>
    </div>
  )
}
