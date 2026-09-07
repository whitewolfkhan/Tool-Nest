'use client'

import * as React from 'react'
import { Upload, X, ImageIcon, Crop, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper, FieldLabel, DownloadButton, EmptyState } from '@/components/tool-page-shell'
import { toast } from 'sonner'

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

const ASPECT_PRESETS = [
  { label: 'Free', value: 0 },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '3:2', value: 3 / 2 },
  { label: '2:3', value: 2 / 3 },
]

export default function ImageCrop() {
  const [file, setFile] = React.useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = React.useState<string>('')
  const [previewUrl, setPreviewUrl] = React.useState<string>('')
  const [origW, setOrigW] = React.useState(0)
  const [origH, setOrigH] = React.useState(0)
  const [rect, setRect] = React.useState<Rect>({ x: 0, y: 0, w: 0, h: 0 })
  const [aspect, setAspect] = React.useState(0)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [dragActive, setDragActive] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const imgRef = React.useRef<HTMLImageElement | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const dragRef = React.useRef<'move' | 'resize-br' | 'resize-tl' | 'resize-tr' | 'resize-bl' | null>(null)
  const dragStartRef = React.useRef<{ mx: number; my: number; rx: number; ry: number; rw: number; rh: number }>({
    mx: 0,
    my: 0,
    rx: 0,
    ry: 0,
    rw: 0,
    rh: 0,
  })

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
      // Default crop region: centered 60% of image
      const w = Math.round(img.naturalWidth * 0.6)
      const h = Math.round(img.naturalHeight * 0.6)
      setRect({
        x: Math.round((img.naturalWidth - w) / 2),
        y: Math.round((img.naturalHeight - h) / 2),
        w,
        h,
      })
      drawCanvas()
    }
    img.onerror = () => toast.error('Failed to load image')
    img.src = url
  }

  React.useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [])

  // Draw image + crop overlay on the visible canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !origW || !origH) return
    // Fit image into display area (max 500px wide)
    const maxW = 500
    const scale = Math.min(1, maxW / origW)
    const dw = origW * scale
    const dh = origH * scale
    canvas.width = dw
    canvas.height = dh
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, 0, 0, dw, dh)
    // Dark overlay outside crop region
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, dw, dh)
    // Clear crop region
    const sx = rect.x * scale
    const sy = rect.y * scale
    const sw = rect.w * scale
    const sh = rect.h * scale
    ctx.clearRect(sx, sy, sw, sh)
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, sx, sy, sw, sh)
    // Crop border
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 2
    ctx.strokeRect(sx, sy, sw, sh)
    // Corner handles (drawn in image-space scale)
    const handleSize = 8
    ctx.fillStyle = '#10b981'
    const corners = [
      [sx, sy],
      [sx + sw, sy],
      [sx, sy + sh],
      [sx + sw, sy + sh],
    ]
    corners.forEach(([cx, cy]) => {
      ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize)
    })
  }

  React.useEffect(() => {
    drawCanvas()
  }, [rect, origW, origH])

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
    setRect({ x: 0, y: 0, w: 0, h: 0 })
    if (inputRef.current) inputRef.current.value = ''
  }

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rectB = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rectB.width
    const scaleY = canvas.height / rectB.height
    return {
      x: (e.clientX - rectB.left) * scaleX,
      y: (e.clientY - rectB.top) * scaleY,
      scale: scaleX,
    }
  }

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const img = imgRef.current!
    const scale = canvas.width / img.naturalWidth
    const { x: mx, y: my } = getCanvasPos(e)
    const sx = rect.x * scale
    const sy = rect.y * scale
    const sw = rect.w * scale
    const sh = rect.h * scale
    const tolerance = 10
    const onCorner =
      Math.abs(mx - sx) < tolerance && Math.abs(my - sy) < tolerance
        ? 'resize-tl'
        : Math.abs(mx - (sx + sw)) < tolerance && Math.abs(my - (sy + sh)) < tolerance
          ? 'resize-br'
          : Math.abs(mx - (sx + sw)) < tolerance && Math.abs(my - sy) < tolerance
            ? 'resize-tr'
            : Math.abs(mx - sx) < tolerance && Math.abs(my - (sy + sh)) < tolerance
              ? 'resize-bl'
              : null
    if (onCorner) {
      dragRef.current = onCorner
    } else if (mx >= sx && mx <= sx + sw && my >= sy && my <= sy + sh) {
      dragRef.current = 'move'
    } else {
      return
    }
    dragStartRef.current = {
      mx,
      my,
      rx: rect.x,
      ry: rect.y,
      rw: rect.w,
      rh: rect.h,
    }
    canvas.style.cursor = dragRef.current === 'move' ? 'move' : 'nwse-resize'
  }

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) {
      // Update cursor on hover for handle detection
      const canvas = canvasRef.current!
      const img = imgRef.current!
      const scale = canvas.width / img.naturalWidth
      const { x: mx, y: my } = getCanvasPos(e)
      const sx = rect.x * scale
      const sy = rect.y * scale
      const sw = rect.w * scale
      const sh = rect.h * scale
      const tolerance = 10
      const onCorner =
        (Math.abs(mx - sx) < tolerance && Math.abs(my - sy) < tolerance) ||
        (Math.abs(mx - (sx + sw)) < tolerance && Math.abs(my - (sy + sh)) < tolerance) ||
        (Math.abs(mx - (sx + sw)) < tolerance && Math.abs(my - sy) < tolerance) ||
        (Math.abs(mx - sx) < tolerance && Math.abs(my - (sy + sh)) < tolerance)
      canvas.style.cursor = onCorner ? 'nwse-resize' : mx >= sx && mx <= sx + sw && my >= sy && my <= sy + sh ? 'move' : 'crosshair'
      return
    }
    const canvas = canvasRef.current!
    const img = imgRef.current!
    const scale = canvas.width / img.naturalWidth
    const { x: mx, y: my } = getCanvasPos(e)
    const start = dragStartRef.current
    const dx = (mx - start.mx) / scale
    const dy = (my - start.my) / scale
    let { x, y, w, h } = { x: start.rx, y: start.ry, w: start.rw, h: start.rh }
    if (dragRef.current === 'move') {
      x = Math.max(0, Math.min(origW - w, start.rx + dx))
      y = Math.max(0, Math.min(origH - h, start.ry + dy))
    } else if (dragRef.current === 'resize-br') {
      w = Math.max(20, Math.min(origW - start.rx, start.rw + dx))
      h = Math.max(20, Math.min(origH - start.ry, start.rh + dy))
      if (aspect > 0) h = w / aspect
    } else if (dragRef.current === 'resize-tr') {
      w = Math.max(20, Math.min(start.rx + start.rw, start.rw + dx))
      const newY = Math.max(0, start.ry + dy)
      h = Math.max(20, start.ry + start.rh - newY)
      x = start.rx + start.rw - w
      y = newY
      if (aspect > 0) {
        const nh = w / aspect
        y = start.ry + start.rh - nh
        h = nh
      }
    } else if (dragRef.current === 'resize-bl') {
      const newX = Math.max(0, start.rx + dx)
      w = Math.max(20, start.rx + start.rw - newX)
      h = Math.max(20, Math.min(origH - start.ry, start.rh + dy))
      x = newX
      if (aspect > 0) h = w / aspect
    } else if (dragRef.current === 'resize-tl') {
      const newX = Math.max(0, start.rx + dx)
      const newY = Math.max(0, start.ry + dy)
      w = Math.max(20, start.rx + start.rw - newX)
      h = Math.max(20, start.ry + start.rh - newY)
      x = newX
      y = newY
      if (aspect > 0) {
        const nw = h * aspect
        x = start.rx + start.rw - nw
        w = nw
      }
    }
    setRect({
      x: Math.round(x),
      y: Math.round(y),
      w: Math.round(w),
      h: Math.round(h),
    })
  }

  const onMouseUp = () => {
    dragRef.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = 'crosshair'
  }

  const applyAspect = (a: number) => {
    setAspect(a)
    if (a > 0) {
      // Adjust height to match aspect, centered
      const newH = rect.w / a
      const newY = Math.max(0, Math.min(origH - newH, rect.y + (rect.h - newH) / 2))
      setRect({ ...rect, h: Math.round(newH), y: Math.round(newY) })
    }
  }

  const setField = (key: keyof Rect, value: number) => {
    const v = Math.max(0, Math.round(value))
    const next = { ...rect, [key]: v }
    if (key === 'x') next.x = Math.min(origW - rect.w, v)
    if (key === 'y') next.y = Math.min(origH - rect.h, v)
    if (key === 'w') next.w = Math.min(origW - rect.x, v)
    if (key === 'h') next.h = Math.min(origH - rect.y, v)
    if (aspect > 0) {
      if (key === 'w') next.h = Math.round(next.w / aspect)
      if (key === 'h') next.w = Math.round(next.h * aspect)
    }
    setRect(next)
  }

  const doCrop = () => {
    if (!imgRef.current || rect.w <= 0 || rect.h <= 0) return
    setIsProcessing(true)
    const img = imgRef.current
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(rect.w)
    canvas.height = Math.round(rect.h)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setIsProcessing(false)
      return
    }
    ctx.drawImage(
      img,
      Math.round(rect.x),
      Math.round(rect.y),
      Math.round(rect.w),
      Math.round(rect.h),
      0,
      0,
      canvas.width,
      canvas.height
    )
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev)
            return URL.createObjectURL(blob)
          })
          toast.success('Image cropped successfully')
        }
        setIsProcessing(false)
      },
      file?.type === 'image/png' ? 'image/png' : 'image/jpeg',
      0.92
    )
  }

  const download = () => {
    if (!previewUrl) return
    const a = document.createElement('a')
    a.href = previewUrl
    const ext = file?.type === 'image/png' ? 'png' : 'jpg'
    a.download = `cropped-${Date.now()}.${ext}`
    a.click()
    toast.success('Image downloaded')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolCardWrapper>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Upload & Crop</h2>
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
              <div className="flex flex-wrap gap-1.5">
                {ASPECT_PRESETS.map((p) => (
                  <Button
                    key={p.label}
                    variant={aspect === p.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => applyAspect(p.value)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
              <div className="overflow-auto rounded-lg border border-border bg-muted/30 p-2 flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={onMouseUp}
                  className="max-w-full h-auto cursor-crosshair"
                />
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
          <h2 className="text-base font-semibold">Crop Dimensions</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>X (px)</FieldLabel>
              <Input
                type="number"
                min={0}
                value={rect.x || ''}
                onChange={(e) => setField('x', Number(e.target.value))}
              />
            </div>
            <div>
              <FieldLabel>Y (px)</FieldLabel>
              <Input
                type="number"
                min={0}
                value={rect.y || ''}
                onChange={(e) => setField('y', Number(e.target.value))}
              />
            </div>
            <div>
              <FieldLabel>Width (px)</FieldLabel>
              <Input
                type="number"
                min={1}
                value={rect.w || ''}
                onChange={(e) => setField('w', Number(e.target.value))}
              />
            </div>
            <div>
              <FieldLabel>Height (px)</FieldLabel>
              <Input
                type="number"
                min={1}
                value={rect.h || ''}
                onChange={(e) => setField('h', Number(e.target.value))}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Drag the green rectangle to move, or grab a corner to resize. Use presets to lock aspect ratio.
          </p>

          <div className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <Crop className="h-4 w-4 text-primary" />
              <Label className="text-sm">Selected region: {rect.w}×{rect.h}</Label>
            </div>
            {isProcessing && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          <Button onClick={doCrop} disabled={!file || rect.w <= 0} className="w-full">
            <Crop className="h-4 w-4" /> Apply Crop
          </Button>

          {previewUrl ? (
            <div className="space-y-3">
              <FieldLabel>Preview</FieldLabel>
              <div className="relative rounded-lg border border-border overflow-hidden bg-muted/30">
                <img src={previewUrl} alt="Cropped" className="w-full h-auto max-h-72 object-contain" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <DownloadButton onClick={download} label="Download" />
              </div>
            </div>
          ) : (
            <EmptyState message="Click 'Apply Crop' to generate the cropped image" />
          )}
        </div>
      </ToolCardWrapper>
    </div>
  )
}
