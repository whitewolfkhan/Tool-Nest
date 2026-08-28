'use client'

import * as React from 'react'
import { PDFDocument } from 'pdf-lib'
import {
  Upload,
  Download,
  Loader2,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  Image as ImageIcon,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { ToolCardWrapper, FieldLabel, EmptyState } from '@/components/tool-page-shell'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type PageSize = 'a4' | 'letter' | 'fit'
type Orientation = 'portrait' | 'landscape'

// Sizes in PDF points (1pt = 1/72 inch)
const PAGE_SIZES: Record<Exclude<PageSize, 'fit'>, { w: number; h: number }> = {
  a4: { w: 595.28, h: 841.89 },
  letter: { w: 612, h: 792 },
}

interface ImageItem {
  id: string
  file: File
  preview: string
}

let counter = 0
function uid() {
  counter += 1
  return `img-${Date.now()}-${counter}`
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

async function getImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`))
    img.src = URL.createObjectURL(file)
  })
}

export default function ImageToPdf() {
  const [items, setItems] = React.useState<ImageItem[]>([])
  const [pageSize, setPageSize] = React.useState<PageSize>('a4')
  const [orientation, setOrientation] = React.useState<Orientation>('portrait')
  const [margin, setMargin] = React.useState(20)
  const [busy, setBusy] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const addFiles = (list: FileList | File[]) => {
    const arr = Array.from(list).filter((f) => f.type.startsWith('image/'))
    if (arr.length === 0) {
      toast.error('Please select image files')
      return
    }
    const mapped = arr.map((file) => ({
      id: uid(),
      file,
      preview: URL.createObjectURL(file),
    }))
    setItems((prev) => [...prev, ...mapped])
    toast.success(`Added ${arr.length} image${arr.length > 1 ? 's' : ''}`)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  React.useEffect(() => {
    return () => {
      items.forEach((it) => URL.revokeObjectURL(it.preview))
    }
  }, [])

  const move = (index: number, dir: -1 | 1) => {
    setItems((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const remove = (id: string) =>
    setItems((prev) => {
      const target = prev.find((p) => p.id === id)
      if (target) URL.revokeObjectURL(target.preview)
      return prev.filter((p) => p.id !== id)
    })

  const clearAll = () => {
    items.forEach((it) => URL.revokeObjectURL(it.preview))
    setItems([])
  }

  const convert = async () => {
    if (items.length === 0) {
      toast.error('Please add at least one image')
      return
    }
    setBusy(true)
    try {
      const doc = await PDFDocument.create()

      for (const item of items) {
        const buf = await item.file.arrayBuffer()
        const ext = item.file.name.toLowerCase().split('.').pop() || ''
        const isJpg =
          ext === 'jpg' || ext === 'jpeg' || item.file.type === 'image/jpeg'
        const isPng = ext === 'png' || item.file.type === 'image/png'
        if (!isJpg && !isPng) {
          // Re-encode non-PNG/JPEG via canvas as JPEG.
          const dims = await getImageSize(item.file)
          const canvas = document.createElement('canvas')
          canvas.width = dims.width
          canvas.height = dims.height
          const ctx = canvas.getContext('2d')
          if (!ctx) throw new Error('Canvas not available')
          const img = await new Promise<HTMLImageElement>((res, rej) => {
            const i = new Image()
            i.onload = () => res(i)
            i.onerror = () => rej(new Error('Failed to load image'))
            i.src = URL.createObjectURL(item.file)
          })
          ctx.drawImage(img, 0, 0)
          URL.revokeObjectURL(img.src)
          const blob = await new Promise<Blob>((res, rej) =>
            canvas.toBlob(
              (b) => (b ? res(b) : rej(new Error('Failed to convert image'))),
              'image/jpeg',
              0.92
            )
          )
          const reBuf = await blob.arrayBuffer()
          const embedded = await doc.embedJpg(reBuf)
          addImagePage(doc, embedded, embedded.width, embedded.height)
          continue
        }

        const embedded = isJpg
          ? await doc.embedJpg(buf)
          : await doc.embedPng(buf)
        addImagePage(doc, embedded, embedded.width, embedded.height)
      }

      const bytes = await doc.save()
      download(
        new Blob([bytes as BlobPart], { type: 'application/pdf' }),
        'images.pdf',
      )
      toast.success(`Created PDF with ${items.length} page${items.length > 1 ? 's' : ''}`)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to convert images')
    } finally {
      setBusy(false)
    }
  }

  const addImagePage = (
    doc: PDFDocument,
    img: { width: number; height: number; scale: (s: number) => any } & any,
    imgW: number,
    imgH: number
  ) => {
    let pageW: number
    let pageH: number
    if (pageSize === 'fit') {
      pageW = imgW + margin * 2
      pageH = imgH + margin * 2
    } else {
      const base = PAGE_SIZES[pageSize]
      if (orientation === 'portrait') {
        pageW = base.w
        pageH = base.h
      } else {
        pageW = base.h
        pageH = base.w
      }
    }

    const page = doc.addPage([pageW, pageH])

    // Fit image inside the page (minus margins) preserving aspect ratio.
    const availW = pageW - margin * 2
    const availH = pageH - margin * 2
    const scale = Math.min(availW / imgW, availH / imgH, 1)
    const drawW = imgW * scale
    const drawH = imgH * scale
    const x = (pageW - drawW) / 2
    const y = (pageH - drawH) / 2

    page.drawImage(img, {
      x,
      y,
      width: drawW,
      height: drawH,
    })
  }

  const totalSize = items.reduce((s, i) => s + i.file.size, 0)

  return (
    <ToolCardWrapper>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload + list */}
        <div className="space-y-4">
          <FieldLabel>Images (in page order)</FieldLabel>
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
            }}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
              dragging
                ? 'border-emerald-500 bg-emerald-500/5'
                : 'border-border hover:border-emerald-500/60 hover:bg-accent/40'
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <Upload className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium">Drop images here or click to upload</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP, GIF, BMP</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) addFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {items.length} image{items.length !== 1 ? 's' : ''} ·{' '}
              {formatSize(totalSize)}
            </p>
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="gap-1.5 text-muted-foreground"
              >
                <Trash2 className="h-4 w-4" /> Clear all
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <EmptyState message="No images added yet. Upload at least one image to begin." />
          ) : (
            <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    <img
                      src={item.preview}
                      alt={item.file.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(item.file.size)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    #{idx + 1}
                  </Badge>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0 || busy}
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => move(idx, 1)}
                      disabled={idx === items.length - 1 || busy}
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => remove(item.id)}
                      disabled={busy}
                      aria-label="Remove"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Options */}
        <div className="space-y-4">
          <FieldLabel>Page setup</FieldLabel>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Page size</Label>
            <Select value={pageSize} onValueChange={(v) => setPageSize(v as PageSize)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                <SelectItem value="letter">Letter (8.5 × 11 in)</SelectItem>
                <SelectItem value="fit">Fit to image</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {pageSize !== 'fit' && (
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Orientation</Label>
              <ToggleGroup
                type="single"
                value={orientation}
                onValueChange={(v) => v && setOrientation(v as Orientation)}
                variant="outline"
                className="grid w-full grid-cols-2"
              >
                <ToggleGroupItem value="portrait">Portrait</ToggleGroupItem>
                <ToggleGroupItem value="landscape">Landscape</ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-sm font-medium">Page margin</Label>
              <Badge variant="secondary">{margin}px</Badge>
            </div>
            <Slider
              min={0}
              max={80}
              value={[margin]}
              onValueChange={(v) => setMargin(v[0])}
              disabled={pageSize === 'fit'}
            />
            {pageSize === 'fit' && (
              <p className="mt-1 text-xs text-muted-foreground">
                Margins are not applied in “Fit to image” mode.
              </p>
            )}
          </div>

          <Separator />

          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Images</span>
              <span className="font-semibold">{items.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total size</span>
              <span className="font-semibold">{formatSize(totalSize)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Output pages</span>
              <span className="font-semibold">{items.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Output filename</span>
              <span className="font-semibold">images.pdf</span>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <Plus className="mt-0.5 h-4 w-4 shrink-0" />
              Non-PNG/JPEG images are re-encoded as JPEG before being embedded
              to ensure broad PDF reader compatibility.
            </p>
          </div>

          <Button
            onClick={convert}
            disabled={busy || items.length === 0}
            className="w-full gap-2"
            size="lg"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {busy ? 'Converting...' : 'Convert to PDF'}
          </Button>
          {items.length === 0 && (
            <p className="text-center text-xs text-muted-foreground">
              Add at least one image to enable conversion
            </p>
          )}
          {items.length > 0 && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ImageIcon className="h-3 w-3" />
              {items.length} image{items.length !== 1 ? 's' : ''} ready
            </div>
          )}
        </div>
      </div>
    </ToolCardWrapper>
  )
}
