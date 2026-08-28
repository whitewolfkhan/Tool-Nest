'use client'

import * as React from 'react'
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'
import {
  Upload,
  FileText,
  Download,
  Loader2,
  X,
  Stamp,
  Image as ImageIcon,
  Type,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Separator } from '@/components/ui/separator'
import { ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Scope = 'all' | 'specific'
type Position =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

const POSITIONS: { value: Position; label: string }[] = [
  { value: 'top-left', label: '↖' },
  { value: 'top-center', label: '↑' },
  { value: 'top-right', label: '↗' },
  { value: 'middle-left', label: '←' },
  { value: 'center', label: '●' },
  { value: 'middle-right', label: '→' },
  { value: 'bottom-left', label: '↙' },
  { value: 'bottom-center', label: '↓' },
  { value: 'bottom-right', label: '↘' },
]

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.replace('#', '')
  const r = parseInt(m.substring(0, 2), 16) / 255
  const g = parseInt(m.substring(2, 4), 16) / 255
  const b = parseInt(m.substring(4, 6), 16) / 255
  return { r, g, b }
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

function parsePages(input: string, max: number): number[] {
  const groups = input.split(',').map((g) => g.trim()).filter(Boolean)
  const result: number[] = []
  for (const g of groups) {
    const mm = g.match(/^(\d+)\s*-\s*(\d+)$/)
    if (mm) {
      const s = parseInt(mm[1], 10)
      const e = parseInt(mm[2], 10)
      if (s < 1 || e > max || s > e) throw new Error(`Range "${g}" invalid. Valid: 1-${max}`)
      for (let i = s; i <= e; i++) result.push(i - 1)
    } else {
      const n = parseInt(g, 10)
      if (isNaN(n) || n < 1 || n > max) throw new Error(`Page "${g}" invalid. Valid: 1-${max}`)
      result.push(n - 1)
    }
  }
  return Array.from(new Set(result))
}

function computePosition(
  position: Position,
  pageWidth: number,
  pageHeight: number,
  textWidth: number,
  fontSize: number,
  margin: number
): { x: number; y: number } {
  let x: number
  let y: number
  switch (position) {
    case 'top-left':
      x = margin
      y = pageHeight - margin - fontSize
      break
    case 'top-center':
      x = (pageWidth - textWidth) / 2
      y = pageHeight - margin - fontSize
      break
    case 'top-right':
      x = pageWidth - textWidth - margin
      y = pageHeight - margin - fontSize
      break
    case 'middle-left':
      x = margin
      y = pageHeight / 2
      break
    case 'center':
      x = (pageWidth - textWidth) / 2
      y = pageHeight / 2
      break
    case 'middle-right':
      x = pageWidth - textWidth - margin
      y = pageHeight / 2
      break
    case 'bottom-left':
      x = margin
      y = margin
      break
    case 'bottom-center':
      x = (pageWidth - textWidth) / 2
      y = margin
      break
    case 'bottom-right':
      x = pageWidth - textWidth - margin
      y = margin
      break
  }
  return { x, y }
}

export default function PdfWatermark() {
  const [file, setFile] = React.useState<File | null>(null)
  const [pageCount, setPageCount] = React.useState(0)
  const [type, setType] = React.useState<'text' | 'image'>('text')
  const [text, setText] = React.useState('CONFIDENTIAL')
  const [fontSize, setFontSize] = React.useState(48)
  const [color, setColor] = React.useState('#dc2626')
  const [opacity, setOpacity] = React.useState(30)
  const [rotation, setRotation] = React.useState(45)
  const [position, setPosition] = React.useState<Position>('center')
  const [logoFile, setLogoFile] = React.useState<File | null>(null)
  const [logoScale, setLogoScale] = React.useState(30)
  const [scope, setScope] = React.useState<Scope>('all')
  const [pagesInput, setPagesInput] = React.useState('1-3, 5')
  const [busy, setBusy] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const logoInputRef = React.useRef<HTMLInputElement>(null)

  const loadFile = async (f: File) => {
    if (f.type !== 'application/pdf') {
      toast.error('Please select a PDF file')
      return
    }
    try {
      const buf = await f.arrayBuffer()
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true })
      setFile(f)
      setPageCount(doc.getPageCount())
    } catch (err) {
      console.error(err)
      toast.error('Failed to read PDF.')
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) loadFile(f)
  }

  const reset = () => {
    setFile(null)
    setPageCount(0)
  }

  const apply = async () => {
    if (!file) return
    if (type === 'text' && !text.trim()) {
      toast.error('Please enter watermark text')
      return
    }
    if (type === 'image' && !logoFile) {
      toast.error('Please upload a logo image')
      return
    }
    setBusy(true)
    try {
      const buf = await file.arrayBuffer()
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true })
      const font = await doc.embedFont(StandardFonts.HelveticaBold)

      let logo: { embed: () => Promise<any>; width: number; height: number } | null = null
      if (type === 'image' && logoFile) {
        const lb = await logoFile.arrayBuffer()
        const ext = logoFile.name.toLowerCase().split('.').pop() || ''
        if (ext === 'jpg' || ext === 'jpeg' || logoFile.type === 'image/jpeg') {
          const img = await doc.embedJpg(lb)
          logo = { embed: async () => img, width: img.width, height: img.height }
        } else if (ext === 'png' || logoFile.type === 'image/png') {
          const img = await doc.embedPng(lb)
          logo = { embed: async () => img, width: img.width, height: img.height }
        } else {
          throw new Error('Logo must be a PNG or JPEG image')
        }
      }

      const pages = doc.getPages()
      let targetIdx: number[]
      if (scope === 'all') {
        targetIdx = pages.map((_, i) => i)
      } else {
        targetIdx = parsePages(pagesInput, pages.length)
      }
      if (targetIdx.length === 0) {
        toast.error('No pages selected')
        setBusy(false)
        return
      }

      const { r, g, b } = hexToRgb(color)
      const op = opacity / 100
      const margin = 20

      for (const idx of targetIdx) {
        const page = pages[idx]
        const { width: pw, height: ph } = page.getSize()

        if (type === 'text') {
          const tw = font.widthOfTextAtSize(text, fontSize)
          const { x, y } = computePosition(position, pw, ph, tw, fontSize, margin)
          page.drawText(text, {
            x,
            y,
            size: fontSize,
            font,
            color: rgb(r, g, b),
            opacity: op,
            rotate: degrees(rotation),
          })
        } else if (logo) {
          const embedded = await logo.embed()
          const scale = logoScale / 100
          const w = embedded.width * scale
          const h = embedded.height * scale
          let x: number, y: number
          const m = 20
          switch (position) {
            case 'top-left': x = m; y = ph - h - m; break
            case 'top-center': x = (pw - w) / 2; y = ph - h - m; break
            case 'top-right': x = pw - w - m; y = ph - h - m; break
            case 'middle-left': x = m; y = (ph - h) / 2; break
            case 'center': x = (pw - w) / 2; y = (ph - h) / 2; break
            case 'middle-right': x = pw - w - m; y = (ph - h) / 2; break
            case 'bottom-left': x = m; y = m; break
            case 'bottom-center': x = (pw - w) / 2; y = m; break
            case 'bottom-right': x = pw - w - m; y = m; break
          }
          page.drawImage(embedded, {
            x,
            y,
            width: w,
            height: h,
            opacity: op,
            rotate: degrees(rotation),
          })
        }
      }

      const bytes = await doc.save()
      download(
        new Blob([bytes as BlobPart], { type: 'application/pdf' }),
        file.name.replace(/\.pdf$/i, '') + '_watermarked.pdf',
      )
      toast.success(`Watermarked ${targetIdx.length} page${targetIdx.length > 1 ? 's' : ''}`)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to add watermark')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolCardWrapper>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <FieldLabel>Source PDF</FieldLabel>
          {!file ? (
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
                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-12 text-center transition-colors',
                dragging
                  ? 'border-emerald-500 bg-emerald-500/5'
                  : 'border-border hover:border-emerald-500/60 hover:bg-accent/40'
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <Upload className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm font-medium">Drop a PDF here or click to upload</p>
              <p className="text-xs text-muted-foreground">Single PDF file</p>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) loadFile(f)
                  e.target.value = ''
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-rose-500/10">
                <FileText className="h-5 w-5 text-rose-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{pageCount} pages</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={reset}
                disabled={busy}
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {file && (
            <div>
              <FieldLabel>Apply to</FieldLabel>
              <ToggleGroup
                type="single"
                value={scope}
                onValueChange={(v) => v && setScope(v as Scope)}
                variant="outline"
                className="grid w-full grid-cols-2"
              >
                <ToggleGroupItem value="all">All pages</ToggleGroupItem>
                <ToggleGroupItem value="specific">Specific pages</ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}

          {file && scope === 'specific' && (
            <div>
              <FieldLabel>Page numbers</FieldLabel>
              <Input
                value={pagesInput}
                onChange={(e) => setPagesInput(e.target.value)}
                placeholder={`e.g. 1-3, 5 (1-${pageCount})`}
                disabled={busy}
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <FieldLabel>Watermark</FieldLabel>
          <Tabs value={type} onValueChange={(v) => setType(v as 'text' | 'image')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text" className="gap-1.5">
                <Type className="h-4 w-4" /> Text
              </TabsTrigger>
              <TabsTrigger value="image" className="gap-1.5">
                <ImageIcon className="h-4 w-4" /> Image
              </TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="mt-3 space-y-4">
              <div>
                <FieldLabel>Text</FieldLabel>
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="CONFIDENTIAL"
                  disabled={busy}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-sm font-medium">Font size</Label>
                  <Badge variant="secondary">{fontSize}px</Badge>
                </div>
                <Slider
                  min={8}
                  max={120}
                  value={[fontSize]}
                  onValueChange={(v) => setFontSize(v[0])}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-sm font-medium">Opacity</Label>
                  <Badge variant="secondary">{opacity}%</Badge>
                </div>
                <Slider
                  min={5}
                  max={100}
                  value={[opacity]}
                  onValueChange={(v) => setOpacity(v[0])}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-sm font-medium">Rotation</Label>
                  <Badge variant="secondary">{rotation}°</Badge>
                </div>
                <Slider
                  min={0}
                  max={360}
                  value={[rotation]}
                  onValueChange={(v) => setRotation(v[0])}
                />
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium w-16">Color</Label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-12 rounded-md border border-border bg-background p-1"
                />
                <span className="text-sm text-muted-foreground">{color}</span>
              </div>
            </TabsContent>

            <TabsContent value="image" className="mt-3 space-y-4">
              <div
                role="button"
                tabIndex={0}
                onClick={() => logoInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') logoInputRef.current?.click()
                }}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-8 text-center hover:border-emerald-500/60 hover:bg-accent/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                  <ImageIcon className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-sm font-medium">
                  {logoFile ? logoFile.name : 'Upload logo (PNG or JPEG)'}
                </p>
                {logoFile && (
                  <p className="text-xs text-muted-foreground">
                    {Math.round(logoFile.size / 1024)} KB
                  </p>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      setLogoFile(f)
                      toast.success(`Logo "${f.name}" loaded`)
                    }
                    e.target.value = ''
                  }}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-sm font-medium">Logo scale</Label>
                  <Badge variant="secondary">{logoScale}%</Badge>
                </div>
                <Slider
                  min={5}
                  max={100}
                  value={[logoScale]}
                  onValueChange={(v) => setLogoScale(v[0])}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-sm font-medium">Opacity</Label>
                  <Badge variant="secondary">{opacity}%</Badge>
                </div>
                <Slider
                  min={5}
                  max={100}
                  value={[opacity]}
                  onValueChange={(v) => setOpacity(v[0])}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-sm font-medium">Rotation</Label>
                  <Badge variant="secondary">{rotation}°</Badge>
                </div>
                <Slider
                  min={0}
                  max={360}
                  value={[rotation]}
                  onValueChange={(v) => setRotation(v[0])}
                />
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          <div>
            <FieldLabel>Position</FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              {POSITIONS.map((p) => (
                <Button
                  key={p.value}
                  variant={position === p.value ? 'default' : 'outline'}
                  onClick={() => setPosition(p.value)}
                  className="h-10 text-lg"
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={apply}
            disabled={busy || !file}
            className="w-full gap-2"
            size="lg"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Stamp className="h-4 w-4" />
            )}
            {busy ? 'Watermarking...' : 'Apply & Download'}
          </Button>
        </div>
      </div>
    </ToolCardWrapper>
  )
}
