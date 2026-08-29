'use client'

import * as React from 'react'
import { PDFDocument, degrees } from 'pdf-lib'
import {
  Upload,
  FileText,
  Download,
  Loader2,
  X,
  RotateCw,
  RotateCcw,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Separator } from '@/components/ui/separator'
import { ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Scope = 'all' | 'specific'

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

export default function PdfRotate() {
  const [file, setFile] = React.useState<File | null>(null)
  const [pageCount, setPageCount] = React.useState(0)
  const [rotation, setRotation] = React.useState(90)
  const [scope, setScope] = React.useState<Scope>('all')
  const [pagesInput, setPagesInput] = React.useState('1-3, 5')
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

  const parsePages = (input: string, max: number): number[] => {
    const groups = input.split(',').map((g) => g.trim()).filter(Boolean)
    const result: number[] = []
    for (const g of groups) {
      const m = g.match(/^(\d+)\s*-\s*(\d+)$/)
      if (m) {
        const start = parseInt(m[1], 10)
        const end = parseInt(m[2], 10)
        if (start < 1 || end > max || start > end) {
          throw new Error(`Range "${g}" invalid. Valid pages: 1-${max}`)
        }
        for (let i = start; i <= end; i++) result.push(i - 1)
      } else {
        const n = parseInt(g, 10)
        if (isNaN(n) || n < 1 || n > max) {
          throw new Error(`Page "${g}" invalid. Valid: 1-${max}`)
        }
        result.push(n - 1)
      }
    }
    return Array.from(new Set(result))
  }

  const rotate = async () => {
    if (!file) return
    setBusy(true)
    try {
      const buf = await file.arrayBuffer()
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true })
      const pages = doc.getPages()

      let targets: number[]
      if (scope === 'all') {
        targets = pages.map((_, i) => i)
      } else {
        targets = parsePages(pagesInput, pages.length)
      }

      if (targets.length === 0) {
        toast.error('No pages selected')
        setBusy(false)
        return
      }

      targets.forEach((idx) => {
        const page = pages[idx]
        const current = page.getRotation().angle
        page.setRotation(degrees((current + rotation) % 360))
      })

      const bytes = await doc.save()
      download(
        new Blob([bytes as BlobPart], { type: 'application/pdf' }),
        file.name.replace(/\.pdf$/i, '') + '_rotated.pdf',
      )
      toast.success(`Rotated ${targets.length} page${targets.length > 1 ? 's' : ''} by ${rotation}°`)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to rotate PDF')
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
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-rose-500/10">
                  <FileText className="h-5 w-5 text-rose-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {pageCount} pages · {formatSize(file.size)}
                  </p>
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

              <div>
                <Label className="text-sm font-medium mb-1.5 block">Rotation</Label>
                <ToggleGroup
                  type="single"
                  value={String(rotation)}
                  onValueChange={(v) => v && setRotation(parseInt(v, 10))}
                  variant="outline"
                  className="grid w-full grid-cols-3"
                >
                  <ToggleGroupItem value="90" className="gap-1.5">
                    <RotateCw className="h-4 w-4" /> 90°
                  </ToggleGroupItem>
                  <ToggleGroupItem value="180" className="gap-1.5">
                    <RefreshCw className="h-4 w-4" /> 180°
                  </ToggleGroupItem>
                  <ToggleGroupItem value="270" className="gap-1.5">
                    <RotateCcw className="h-4 w-4" /> 270°
                  </ToggleGroupItem>
                </ToggleGroup>
                <p className="mt-1 text-xs text-muted-foreground">
                  Rotation is applied on top of the current page rotation.
                </p>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium mb-1.5 block">Apply to</Label>
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

              {scope === 'specific' && (
                <div>
                  <FieldLabel>Page numbers</FieldLabel>
                  <Input
                    value={pagesInput}
                    onChange={(e) => setPagesInput(e.target.value)}
                    placeholder={`e.g. 1-3, 5 (1-${pageCount})`}
                    disabled={busy}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Use commas and ranges. Pages are 1-indexed.
                  </p>
                </div>
              )}

              <Button
                onClick={rotate}
                disabled={busy}
                className="w-full gap-2"
                size="lg"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCw className="h-4 w-4" />
                )}
                {busy ? 'Rotating...' : 'Rotate & Download'}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <FieldLabel>Summary</FieldLabel>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">File</span>
              <span className="truncate ml-2 max-w-[60%] font-semibold text-right">
                {file?.name ?? '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pages</span>
              <span className="font-semibold">{pageCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rotation</span>
              <Badge variant="secondary">{rotation}° clockwise</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Scope</span>
              <Badge variant="secondary">
                {scope === 'all' ? 'All pages' : 'Specific pages'}
              </Badge>
            </div>
          </div>
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <RotateCw className="mt-0.5 h-4 w-4 shrink-0" />
              Rotation permanently modifies the PDF — no preview is needed, the
              download will be correctly oriented when opened in any PDF reader.
            </p>
          </div>
        </div>
      </div>
    </ToolCardWrapper>
  )
}
