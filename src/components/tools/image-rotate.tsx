'use client'

import * as React from 'react'
import { Upload, X, ImageIcon, RotateCw, RotateCcw, FlipHorizontal, FlipVertical, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper, FieldLabel, DownloadButton, EmptyState } from '@/components/tool-page-shell'
import { toast } from 'sonner'

type Transform = {
  rotate: number // 0, 90, 180, 270
  flipH: boolean
  flipV: boolean
}

const identity: Transform = { rotate: 0, flipH: false, flipV: false }

export default function ImageRotate() {
  const [file, setFile] = React.useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = React.useState<string>('')
  const [previewUrl, setPreviewUrl] = React.useState<string>('')
  const [origW, setOrigW] = React.useState(0)
  const [origH, setOrigH] = React.useState(0)
  const [transform, setTransform] = React.useState<Transform>(identity)
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
    const url = URL.createObjectURL(f)
    setOriginalUrl(url)
    setPreviewUrl('')
    setTransform(identity)
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setOrigW(img.naturalWidth)
      setOrigH(img.naturalHeight)
      applyTransform(img, identity)
    }
    img.onerror = () => toast.error('Failed to load image')
    img.src = url
  }

  const applyTransform = React.useCallback((img: HTMLImageElement, t: Transform) => {
    setIsProcessing(true)
    const canvas = document.createElement('canvas')
    const isQuarter = t.rotate === 90 || t.rotate === 270
    canvas.width = isQuarter ? img.naturalHeight : img.naturalWidth
    canvas.height = isQuarter ? img.naturalWidth : img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setIsProcessing(false)
      return
    }
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((t.rotate * Math.PI) / 180)
    ctx.scale(t.flipH ? -1 : 1, t.flipV ? -1 : 1)
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
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
  }, [file])

  React.useEffect(() => {
    if (imgRef.current) applyTransform(imgRef.current, transform)
  }, [transform])

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

  const reset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setOriginalUrl('')
    setPreviewUrl('')
    setOrigW(0)
    setOrigH(0)
    setTransform(identity)
    if (inputRef.current) inputRef.current.value = ''
  }

  const rotateBy = (deg: number) => {
    setTransform((t) => ({ ...t, rotate: (t.rotate + deg + 360) % 360 }))
  }

  const toggleFlip = (axis: 'h' | 'v') => {
    setTransform((t) => ({ ...t, [axis === 'h' ? 'flipH' : 'flipV']: !t[axis === 'h' ? 'flipH' : 'flipV'] }))
  }

  const resetTransform = () => setTransform(identity)

  const download = () => {
    if (!previewUrl) return
    const a = document.createElement('a')
    a.href = previewUrl
    const ext = file?.type === 'image/png' ? 'png' : 'jpg'
    a.download = `rotated-${Date.now()}.${ext}`
    a.click()
    toast.success('Image downloaded')
  }

  const isQuarter = transform.rotate === 90 || transform.rotate === 270
  const outW = isQuarter ? origH : origW
  const outH = isQuarter ? origW : origH

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
                <Badge variant="outline">
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
          <h2 className="text-base font-semibold">Transform Controls</h2>
          <div>
            <FieldLabel>Rotate</FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={() => rotateBy(-90)} disabled={!file} className="gap-1.5">
                <RotateCcw className="h-4 w-4" /> -90°
              </Button>
              <Button variant="outline" onClick={() => rotateBy(180)} disabled={!file} className="gap-1.5">
                <RotateCw className="h-4 w-4" /> 180°
              </Button>
              <Button variant="outline" onClick={() => rotateBy(90)} disabled={!file} className="gap-1.5">
                <RotateCw className="h-4 w-4" /> +90°
              </Button>
            </div>
          </div>

          <div>
            <FieldLabel>Flip</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={transform.flipH ? 'default' : 'outline'}
                onClick={() => toggleFlip('h')}
                disabled={!file}
                className="gap-1.5"
              >
                <FlipHorizontal className="h-4 w-4" /> Horizontal
              </Button>
              <Button
                variant={transform.flipV ? 'default' : 'outline'}
                onClick={() => toggleFlip('v')}
                disabled={!file}
                className="gap-1.5"
              >
                <FlipVertical className="h-4 w-4" /> Vertical
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 bg-muted/30">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Rotation:</span>
              <Badge variant="secondary">{transform.rotate}°</Badge>
              <span className="text-muted-foreground">Size:</span>
              <Badge variant="outline">{outW}×{outH}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={resetTransform} disabled={!file}>
              <RefreshCw className="h-4 w-4" /> Reset
            </Button>
          </div>

          {previewUrl ? (
            <div className="space-y-3">
              <FieldLabel>Preview</FieldLabel>
              <div className="relative rounded-lg border border-border overflow-hidden bg-muted/30">
                <img src={previewUrl} alt="Transformed" className="w-full h-auto max-h-72 object-contain" />
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
            <EmptyState message="Transformed preview will appear here" />
          )}
        </div>
      </ToolCardWrapper>
    </div>
  )
}
