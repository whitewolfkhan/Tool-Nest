'use client'

import * as React from 'react'
import {
  Upload,
  Download,
  Trash2,
  ChevronUp,
  ChevronDown,
  Images,
  Grid2x2,
  Grid3x3,
  RectangleHorizontal,
  RectangleVertical,
  LayoutTemplate,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  ToolCardWrapper,
  FieldLabel,
  EmptyState,
  DownloadButton,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type LayoutId = '2x2' | '3x3' | 'horizontal' | 'vertical' | '1+2'

const LAYOUTS: { id: LayoutId; name: string; min: number; max: number; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: '2x2', name: '2 × 2 grid', min: 4, max: 4, icon: Grid2x2 },
  { id: '3x3', name: '3 × 3 grid', min: 9, max: 9, icon: Grid3x3 },
  { id: 'horizontal', name: 'Horizontal strip', min: 2, max: 8, icon: RectangleHorizontal },
  { id: 'vertical', name: 'Vertical strip', min: 2, max: 8, icon: RectangleVertical },
  { id: '1+2', name: '1 big + 2 small', min: 3, max: 3, icon: LayoutTemplate },
]

interface CollageImage {
  id: string
  src: string
  img: HTMLImageElement
  name: string
}

const uid = () => Math.random().toString(36).slice(2, 9)

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  gap: number,
  bgColor: string
) {
  // Fill cell background first
  ctx.fillStyle = bgColor
  ctx.fillRect(dx, dy, dw, dh)
  // Cover-fit the image into the cell minus gap
  const cw = Math.max(1, dw - gap * 2)
  const ch = Math.max(1, dh - gap * 2)
  const cx = dx + gap
  const cy = dy + gap
  const sw = img.naturalWidth || img.width
  const sh = img.naturalHeight || img.height
  if (sw > 0 && sh > 0) {
    const ratio = Math.max(cw / sw, ch / sh)
    const w = sw * ratio
    const h = sh * ratio
    const x = cx + (cw - w) / 2
    const y = cy + (ch - h) / 2
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.save()
    // Clip to the cell (minus gap) so the image doesn't overflow
    ctx.beginPath()
    ctx.rect(cx, cy, cw, ch)
    ctx.clip()
    ctx.drawImage(img, x, y, w, h)
    ctx.restore()
  }
}

export default function ImageCollageMaker() {
  const [images, setImages] = React.useState<CollageImage[]>([])
  const [layout, setLayout] = React.useState<LayoutId>('2x2')
  const [gap, setGap] = React.useState(8)
  const [bgColor, setBgColor] = React.useState('#FFFFFF')
  const [canvasSize, setCanvasSize] = React.useState(1080)
  const [previewUrl, setPreviewUrl] = React.useState('')
  const fileRef = React.useRef<HTMLInputElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [dragOver, setDragOver] = React.useState(false)

  const currentLayout = LAYOUTS.find((l) => l.id === layout)!

  const handleFiles = (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (arr.length === 0) {
      toast.error('Please select image files')
      return
    }
    let added = 0
    arr.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        const src = reader.result as string
        const img = new Image()
        img.onload = () => {
          setImages((prev) => {
            const next = [...prev, { id: uid(), src, img, name: file.name }]
            return next
          })
        }
        img.onerror = () => toast.error(`Failed to load ${file.name}`)
        img.src = src
      }
      reader.onerror = () => toast.error(`Failed to read ${file.name}`)
      reader.readAsDataURL(file)
      added++
    })
    if (added > 0) toast.success(`Added ${added} image${added > 1 ? 's' : ''}`)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
  }

  const moveImage = (index: number, dir: -1 | 1) => {
    const newIndex = index + dir
    if (newIndex < 0 || newIndex >= images.length) return
    const next = [...images]
    ;[next[index], next[newIndex]] = [next[newIndex]!, next[index]!]
    setImages(next)
  }

  const removeImage = (id: string) => {
    setImages(images.filter((i) => i.id !== id))
  }

  // Render the collage whenever inputs change
  React.useEffect(() => {
    if (images.length === 0) {
      setPreviewUrl('')
      return
    }
    const c = canvasRef.current
    if (!c) return
    const size = canvasSize
    c.width = size
    c.height = size
    const ctx = c.getContext('2d')!
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, size, size)

    const imgs = images.slice(0, currentLayout.max)

    if (layout === '2x2') {
      const cell = size / 2
      const pos = [
        [0, 0], [cell, 0], [0, cell], [cell, cell],
      ]
      imgs.slice(0, 4).forEach((im, i) => {
        const [x, y] = pos[i]!
        drawCover(ctx, im.img, x, y, cell, cell, gap / 2, bgColor)
      })
    } else if (layout === '3x3') {
      const cell = size / 3
      imgs.slice(0, 9).forEach((im, i) => {
        const x = (i % 3) * cell
        const y = Math.floor(i / 3) * cell
        drawCover(ctx, im.img, x, y, cell, cell, gap / 2, bgColor)
      })
    } else if (layout === 'horizontal') {
      const n = Math.min(imgs.length, 8)
      const cellW = size / n
      imgs.slice(0, n).forEach((im, i) => {
        drawCover(ctx, im.img, i * cellW, 0, cellW, size, gap / 2, bgColor)
      })
    } else if (layout === 'vertical') {
      const n = Math.min(imgs.length, 8)
      const cellH = size / n
      imgs.slice(0, n).forEach((im, i) => {
        drawCover(ctx, im.img, 0, i * cellH, size, cellH, gap / 2, bgColor)
      })
    } else if (layout === '1+2') {
      // One big on left, two stacked on right
      const bigW = size * 0.6
      const smallW = size - bigW
      const smallH = size / 2
      const im0 = imgs[0]
      const im1 = imgs[1]
      const im2 = imgs[2]
      if (im0) drawCover(ctx, im0.img, 0, 0, bigW, size, gap / 2, bgColor)
      if (im1) drawCover(ctx, im1.img, bigW, 0, smallW, smallH, gap / 2, bgColor)
      if (im2) drawCover(ctx, im2.img, bigW, smallH, smallW, smallH, gap / 2, bgColor)
    }

    setPreviewUrl(c.toDataURL('image/png'))
  }, [images, layout, gap, bgColor, canvasSize, currentLayout.max])

  const downloadPng = () => {
    if (!previewUrl) {
      toast.error('Nothing to download yet')
      return
    }
    const a = document.createElement('a')
    a.href = previewUrl
    a.download = 'collage.png'
    a.click()
    toast.success('Collage downloaded')
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <FieldLabel>Add images</FieldLabel>
              <div
                onClick={() => fileRef.current?.click()}
                onDrop={onDrop}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/60 hover:bg-accent'
                }`}
              >
                <Upload className="h-6 w-6 text-muted-foreground mb-1.5" />
                <p className="text-xs font-medium">Click or drop images</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">PNG / JPG / WebP</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onInputChange}
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <FieldLabel>Layout</FieldLabel>
              <div className="grid grid-cols-1 gap-1.5">
                {LAYOUTS.map((l) => {
                  const Icon = l.icon
                  const active = layout === l.id
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLayout(l.id)}
                      className={cn(
                        'flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors text-left',
                        active
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-accent'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1 truncate">{l.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {l.min === l.max ? `${l.min}` : `${l.min}-${l.max}`}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <FieldLabel>Gap: {gap}px</FieldLabel>
              <Slider
                min={0}
                max={40}
                step={1}
                value={[gap]}
                onValueChange={(v) => setGap(v[0] ?? 0)}
              />
            </div>

            <div>
              <FieldLabel>Canvas size: {canvasSize}px</FieldLabel>
              <Slider
                min={480}
                max={2160}
                step={120}
                value={[canvasSize]}
                onValueChange={(v) => setCanvasSize(v[0] ?? 1080)}
              />
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>480</span>
                <span>1080</span>
                <span>2160</span>
              </div>
            </div>

            <div>
              <FieldLabel>Background</FieldLabel>
              <div className="flex items-center gap-2">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-border">
                  <div className="absolute inset-0" style={{ backgroundColor: bgColor }} />
                  <input
                    type="color"
                    aria-label="Background color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="font-mono text-xs bg-transparent border-0 outline-none w-24"
                  spellCheck={false}
                />
              </div>
            </div>

            <DownloadButton onClick={downloadPng} disabled={!previewUrl} label="Download PNG" />
          </div>

          {/* Preview + thumbnails */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Images className="h-4 w-4 text-primary" />
                Preview
              </h3>
              <Badge variant="secondary">
                {images.length} image{images.length === 1 ? '' : 's'} · {currentLayout.name}
              </Badge>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Collage preview"
                  className="mx-auto max-h-80 object-contain rounded"
                />
              ) : (
                <EmptyState message="Add at least one image to see the collage preview." />
              )}
            </div>

            {/* Image list with reorder controls */}
            {images.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                  Images (reorder with arrows)
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
                  {images.map((im, i) => (
                    <div
                      key={im.id}
                      className="relative group rounded-md border border-border overflow-hidden"
                    >
                      <img src={im.src} alt={im.name} className="aspect-square w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-[10px] text-white truncate">
                        {i + 1}. {im.name}
                      </div>
                      <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => moveImage(i, -1)}
                          className="rounded bg-white/90 hover:bg-white p-0.5 disabled:opacity-30"
                          disabled={i === 0}
                          aria-label="Move up"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => moveImage(i, 1)}
                          className="rounded bg-white/90 hover:bg-white p-0.5 disabled:opacity-30"
                          disabled={i === images.length - 1}
                          aria-label="Move down"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeImage(im.id)}
                        className="absolute top-1 left-1 rounded bg-white/90 hover:bg-rose-500 hover:text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove image"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </ToolCardWrapper>

      <canvas ref={canvasRef} className="hidden" />

      <p className="text-xs text-muted-foreground text-center">
        All image processing happens locally in your browser using Canvas — your images are never uploaded.
      </p>
    </div>
  )
}
