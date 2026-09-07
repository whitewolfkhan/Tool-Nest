'use client'

import * as React from 'react'
import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'
import {
  Upload,
  FileText,
  Download,
  Loader2,
  Scissors,
  X,
  FileArchive,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ToolCardWrapper,
  FieldLabel,
  EmptyState,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Mode = 'each' | 'ranges' | 'extract'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function parseRanges(input: string, max: number): number[][] {
  const groups = input
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean)
  const result: number[][] = []
  for (const g of groups) {
    const rangeMatch = g.match(/^(\d+)\s*-\s*(\d+)$/)
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10)
      const end = parseInt(rangeMatch[2], 10)
      if (start < 1 || end > max || start > end) {
        throw new Error(`Invalid range "${g}". Valid: 1-${max}`)
      }
      const arr: number[] = []
      for (let i = start; i <= end; i++) arr.push(i - 1)
      result.push(arr)
    } else {
      const n = parseInt(g, 10)
      if (isNaN(n) || n < 1 || n > max) {
        throw new Error(`Invalid page "${g}". Valid: 1-${max}`)
      }
      result.push([n - 1])
    }
  }
  return result
}

function parsePages(input: string, max: number): number[] {
  const groups = parseRanges(input, max)
  return Array.from(new Set(groups.flat())).sort((a, b) => a - b)
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

export default function PdfSplit() {
  const [file, setFile] = React.useState<File | null>(null)
  const [pageCount, setPageCount] = React.useState(0)
  const [mode, setMode] = React.useState<Mode>('each')
  const [ranges, setRanges] = React.useState('1-3, 5, 7-9')
  const [extract, setExtract] = React.useState('1, 3, 5')
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
      toast.error('Failed to read PDF. It may be corrupted or encrypted.')
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

  const handleSplit = async () => {
    if (!file) return
    setBusy(true)
    try {
      const buf = await file.arrayBuffer()
      const src = await PDFDocument.load(buf, { ignoreEncryption: true })

      let groups: number[][]
      if (mode === 'each') {
        groups = src.getPageIndices().map((i) => [i])
      } else if (mode === 'ranges') {
        groups = parseRanges(ranges, pageCount)
      } else {
        groups = parsePages(extract, pageCount).map((i) => [i])
      }

      if (groups.length === 0) {
        toast.error('No pages selected')
        setBusy(false)
        return
      }

      const outputs: { name: string; bytes: Uint8Array }[] = []
      for (let gi = 0; gi < groups.length; gi++) {
        const indices = groups[gi]
        const out = await PDFDocument.create()
        const copied = await out.copyPages(src, indices)
        copied.forEach((p) => out.addPage(p))
        const bytes = await out.save()
        const first = indices[0] + 1
        const last = indices[indices.length - 1] + 1
        const label =
          indices.length === 1 ? `page-${first}` : `pages-${first}-${last}`
        outputs.push({ name: `${file.name.replace(/\.pdf$/i, '')}_${label}.pdf`, bytes })
      }

      if (outputs.length === 1) {
        download(
          new Blob([outputs[0].bytes as BlobPart], { type: 'application/pdf' }),
          outputs[0].name,
        )
      } else {
        const zip = new JSZip()
        outputs.forEach((o) => zip.file(o.name, o.bytes))
        const zipBytes = await zip.generateAsync({ type: 'blob' })
        download(zipBytes, `${file.name.replace(/\.pdf$/i, '')}_split.zip`)
      }
      toast.success(`Created ${outputs.length} file${outputs.length > 1 ? 's' : ''}`)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to split PDF')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolCardWrapper>
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
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <FieldLabel>Source PDF</FieldLabel>
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
              <FieldLabel>Split mode</FieldLabel>
              <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="each">Each page as separate file</SelectItem>
                  <SelectItem value="ranges">By page ranges</SelectItem>
                  <SelectItem value="extract">Extract specific pages</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === 'ranges' && (
              <div>
                <FieldLabel>Page ranges</FieldLabel>
                <Input
                  value={ranges}
                  onChange={(e) => setRanges(e.target.value)}
                  placeholder="e.g. 1-3, 5, 7-9"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Use commas to separate. Each range becomes one output file.
                </p>
              </div>
            )}

            {mode === 'extract' && (
              <div>
                <FieldLabel>Pages to extract</FieldLabel>
                <Input
                  value={extract}
                  onChange={(e) => setExtract(e.target.value)}
                  placeholder="e.g. 1, 3, 5-7"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Selected pages will be combined into a single PDF.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <FieldLabel>Output preview</FieldLabel>
            <Tabs defaultValue="info">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Summary</TabsTrigger>
                <TabsTrigger value="help">Help</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="mt-3 space-y-3">
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Mode</span>
                    <Badge variant="secondary">
                      {mode === 'each'
                        ? 'Each page'
                        : mode === 'ranges'
                          ? 'Ranges'
                          : 'Extract'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Source pages</span>
                    <span className="font-semibold">{pageCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Output</span>
                    <span className="flex items-center gap-1 font-semibold">
                      {mode === 'extract' ? (
                        <>
                          <FileText className="h-4 w-4" /> 1 PDF
                        </>
                      ) : (
                        <>
                          <FileArchive className="h-4 w-4" /> ZIP archive
                        </>
                      )}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={handleSplit}
                  disabled={busy}
                  className="w-full gap-2"
                  size="lg"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Scissors className="h-4 w-4" />
                  )}
                  {busy ? 'Splitting...' : 'Split & Download'}
                </Button>
              </TabsContent>
              <TabsContent value="help" className="mt-3">
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground space-y-2">
                  <p>
                    <strong className="text-foreground">Each page:</strong> Every
                    page becomes its own PDF, zipped together for download.
                  </p>
                  <p>
                    <strong className="text-foreground">Ranges:</strong> Define
                    groups like <code className="rounded bg-muted px-1">1-3, 5, 7-9</code>.
                    Each group becomes one PDF, zipped together.
                  </p>
                  <p>
                    <strong className="text-foreground">Extract:</strong> Pick
                    specific pages like <code className="rounded bg-muted px-1">1, 3, 5-7</code> —
                    they are combined into a single PDF.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
      {file && pageCount === 0 && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Could not read this PDF.
        </p>
      )}
    </ToolCardWrapper>
  )
}
