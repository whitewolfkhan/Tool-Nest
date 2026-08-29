'use client'

import * as React from 'react'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import {
  Upload,
  FileText,
  Download,
  Loader2,
  X,
  Hash,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Vert = 'top' | 'bottom'
type Horz = 'left' | 'center' | 'right'
type Format = 'plain' | 'ofN' | 'page' | 'dash'

const FORMATS: { value: Format; label: string; example: (n: number, total: number) => string }[] = [
  { value: 'plain', label: 'Plain', example: (n) => String(n) },
  { value: 'ofN', label: 'Page X of N', example: (n, total) => `${n} of ${total}` },
  { value: 'page', label: 'Page X', example: (n) => `Page ${n}` },
  { value: 'dash', label: '- X -', example: (n) => `- ${n} -` },
]

function formatNumber(fmt: Format, n: number, total: number): string {
  const f = FORMATS.find((x) => x.value === fmt)!
  return f.example(n, total)
}

function hexToRgb(hex: string) {
  const m = hex.replace('#', '')
  return {
    r: parseInt(m.substring(0, 2), 16) / 255,
    g: parseInt(m.substring(2, 4), 16) / 255,
    b: parseInt(m.substring(4, 6), 16) / 255,
  }
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

export default function PdfPageNumbers() {
  const [file, setFile] = React.useState<File | null>(null)
  const [pageCount, setPageCount] = React.useState(0)
  const [vert, setVert] = React.useState<Vert>('bottom')
  const [horz, setHorz] = React.useState<Horz>('center')
  const [start, setStart] = React.useState(1)
  const [fontSize, setFontSize] = React.useState(12)
  const [format, setFormat] = React.useState<Format>('plain')
  const [color, setColor] = React.useState('#111111')
  const [margin, setMargin] = React.useState(30)
  const [busy, setBusy] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

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
    if (pageCount === 0) {
      toast.error('This PDF has no pages')
      return
    }
    setBusy(true)
    try {
      const buf = await file.arrayBuffer()
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true })
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const { r, g, b } = hexToRgb(color)
      const pages = doc.getPages()
      const total = pages.length

      pages.forEach((page, idx) => {
        const number = start + idx
        const text = formatNumber(format, number, total)
        const tw = font.widthOfTextAtSize(text, fontSize)
        const { width: pw, height: ph } = page.getSize()

        let x: number
        switch (horz) {
          case 'left':
            x = margin
            break
          case 'right':
            x = pw - tw - margin
            break
          case 'center':
          default:
            x = (pw - tw) / 2
            break
        }

        let y: number
        if (vert === 'top') {
          y = ph - margin - fontSize
        } else {
          y = margin
        }

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(r, g, b),
        })
      })

      const bytes = await doc.save()
      download(
        new Blob([bytes as BlobPart], { type: 'application/pdf' }),
        file.name.replace(/\.pdf$/i, '') + '_numbered.pdf',
      )
      toast.success(`Added page numbers to ${total} page${total > 1 ? 's' : ''}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to add page numbers')
    } finally {
      setBusy(false)
    }
  }

  const preview = formatNumber(format, start, Math.max(pageCount, start))

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
            <div className="space-y-3">
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
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Pages</span>
                  <span className="font-semibold">{pageCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Numbering</span>
                  <span className="font-semibold">{start} → {start + Math.max(pageCount - 1, 0)}</span>
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
                  <Hash className="h-4 w-4" />
                )}
                {busy ? 'Processing...' : 'Add Numbers & Download'}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <FieldLabel>Options</FieldLabel>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Vertical position</Label>
            <ToggleGroup
              type="single"
              value={vert}
              onValueChange={(v) => v && setVert(v as Vert)}
              variant="outline"
              className="grid w-full grid-cols-2"
            >
              <ToggleGroupItem value="top">Top</ToggleGroupItem>
              <ToggleGroupItem value="bottom">Bottom</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Horizontal position</Label>
            <ToggleGroup
              type="single"
              value={horz}
              onValueChange={(v) => v && setHorz(v as Horz)}
              variant="outline"
              className="grid w-full grid-cols-3"
            >
              <ToggleGroupItem value="left">Left</ToggleGroupItem>
              <ToggleGroupItem value="center">Center</ToggleGroupItem>
              <ToggleGroupItem value="right">Right</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div>
            <FieldLabel>Format</FieldLabel>
            <Select value={format} onValueChange={(v) => setFormat(v as Format)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plain">Plain number — 1</SelectItem>
                <SelectItem value="ofN">Page X of N — 1 of 5</SelectItem>
                <SelectItem value="page">Page X — Page 1</SelectItem>
                <SelectItem value="dash">Dash — - 1 -</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Starting number</FieldLabel>
              <Input
                type="number"
                min={0}
                value={start}
                onChange={(e) => setStart(Math.max(0, parseInt(e.target.value) || 0))}
                disabled={busy}
              />
            </div>
            <div>
              <FieldLabel>Font color</FieldLabel>
              <div className="flex items-center gap-2 h-9">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-12 rounded-md border border-border bg-background p-1"
                />
                <span className="text-sm text-muted-foreground">{color}</span>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-sm font-medium">Font size</Label>
              <Badge variant="secondary">{fontSize}px</Badge>
            </div>
            <Slider
              min={6}
              max={36}
              value={[fontSize]}
              onValueChange={(v) => setFontSize(v[0])}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-sm font-medium">Margin</Label>
              <Badge variant="secondary">{margin}px</Badge>
            </div>
            <Slider
              min={10}
              max={80}
              value={[margin]}
              onValueChange={(v) => setMargin(v[0])}
            />
          </div>

          <Separator />
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center">
            <p className="text-xs uppercase text-muted-foreground mb-1">Preview</p>
            <p className="font-mono text-lg font-semibold">{preview}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {vert} {horz} · {fontSize}px
            </p>
          </div>
        </div>
      </div>
    </ToolCardWrapper>
  )
}
