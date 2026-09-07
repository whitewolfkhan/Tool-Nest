'use client'

import * as React from 'react'
import { PDFDocument } from 'pdf-lib'
import {
  Upload,
  FileText,
  Download,
  Loader2,
  X,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Separator } from '@/components/ui/separator'
import { ToolCardWrapper, FieldLabel, EmptyState } from '@/components/tool-page-shell'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Mode = 'select' | 'list'

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

export default function PdfDeletePages() {
  const [file, setFile] = React.useState<File | null>(null)
  const [pageCount, setPageCount] = React.useState(0)
  const [selected, setSelected] = React.useState<Set<number>>(new Set())
  const [mode, setMode] = React.useState<Mode>('select')
  const [listInput, setListInput] = React.useState('1, 3, 5-7')
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
      setSelected(new Set())
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
    setSelected(new Set())
  }

  const togglePage = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(Array.from({ length: pageCount }, (_, i) => i)))
  const clearAll = () => setSelected(new Set())

  const parsePages = (input: string, max: number): number[] => {
    const groups = input.split(',').map((g) => g.trim()).filter(Boolean)
    const result: number[] = []
    for (const g of groups) {
      const m = g.match(/^(\d+)\s*-\s*(\d+)$/)
      if (m) {
        const start = parseInt(m[1], 10)
        const end = parseInt(m[2], 10)
        if (start < 1 || end > max || start > end) {
          throw new Error(`Range "${g}" invalid. Valid: 1-${max}`)
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

  const effectiveSelected = React.useMemo(() => {
    if (mode === 'list') {
      try {
        return new Set(parsePages(listInput, pageCount))
      } catch {
        return new Set<number>()
      }
    }
    return selected
  }, [mode, listInput, pageCount, selected])

  const deletePages = async () => {
    if (!file) return
    const toDelete = effectiveSelected
    if (toDelete.size === 0) {
      toast.error('No pages selected for deletion')
      return
    }
    if (toDelete.size >= pageCount) {
      toast.error('Cannot delete all pages')
      return
    }
    setBusy(true)
    try {
      const buf = await file.arrayBuffer()
      const src = await PDFDocument.load(buf, { ignoreEncryption: true })
      const out = await PDFDocument.create()
      const keepIndices = Array.from({ length: pageCount }, (_, i) => i).filter(
        (i) => !toDelete.has(i)
      )
      const copied = await out.copyPages(src, keepIndices)
      copied.forEach((p) => out.addPage(p))
      const bytes = await out.save()
      download(
        new Blob([bytes as BlobPart], { type: 'application/pdf' }),
        file.name.replace(/\.pdf$/i, '') + '_trimmed.pdf',
      )
      toast.success(
        `Removed ${toDelete.size} page${toDelete.size > 1 ? 's' : ''} · ${keepIndices.length} remaining`
      )
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to delete pages')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ToolCardWrapper>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
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
            <>
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
                <Label className="text-sm font-medium mb-1.5 block">Selection mode</Label>
                <ToggleGroup
                  type="single"
                  value={mode}
                  onValueChange={(v) => v && setMode(v as Mode)}
                  variant="outline"
                  className="grid w-full grid-cols-2"
                >
                  <ToggleGroupItem value="select">Checkboxes</ToggleGroupItem>
                  <ToggleGroupItem value="list">Page list</ToggleGroupItem>
                </ToggleGroup>
              </div>

              {mode === 'list' ? (
                <div>
                  <FieldLabel>Pages to delete</FieldLabel>
                  <Input
                    value={listInput}
                    onChange={(e) => setListInput(e.target.value)}
                    placeholder={`e.g. 1, 3, 5-7 (1-${pageCount})`}
                    disabled={busy}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Use commas and ranges. Pages are 1-indexed.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Click pages to mark for deletion</p>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={selectAll} disabled={busy}>
                        Select all
                      </Button>
                      <Button variant="ghost" size="sm" onClick={clearAll} disabled={busy}>
                        Clear
                      </Button>
                    </div>
                  </div>
                  {pageCount === 0 ? (
                    <EmptyState message="No pages to display." />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto p-1 rounded-lg border border-border bg-muted/20">
                      {Array.from({ length: pageCount }, (_, i) => {
                        const isSel = selected.has(i)
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => togglePage(i)}
                            disabled={busy}
                            className={cn(
                              'relative flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-lg border-2 p-2 transition-colors',
                              isSel
                                ? 'border-destructive bg-destructive/5'
                                : 'border-border bg-card hover:border-destructive/50'
                            )}
                          >
                            <Checkbox
                              checked={isSel}
                              className="absolute right-2 top-2 pointer-events-none"
                              tabIndex={-1}
                            />
                            <div className="flex aspect-[3/4] w-full max-w-[90px] items-center justify-center rounded-md bg-gradient-to-br from-rose-500/10 to-orange-500/10">
                              <FileText className="h-7 w-7 text-rose-600/70" />
                            </div>
                            <span className="text-xs font-medium">Page {i + 1}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-4">
          <FieldLabel>Summary</FieldLabel>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Original pages</span>
              <span className="font-semibold">{pageCount}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">To delete</span>
              <Badge variant="destructive">{effectiveSelected.size}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Remaining</span>
              <Badge variant="secondary">{pageCount - effectiveSelected.size}</Badge>
            </div>
          </div>

          <Button
            onClick={deletePages}
            disabled={busy || effectiveSelected.size === 0 || effectiveSelected.size >= pageCount}
            className="w-full gap-2"
            size="lg"
            variant="destructive"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {busy ? 'Processing...' : 'Delete Pages & Download'}
          </Button>
          {effectiveSelected.size >= pageCount && pageCount > 0 && (
            <p className="text-center text-xs text-amber-600">
              You cannot delete every page.
            </p>
          )}
        </div>
      </div>
    </ToolCardWrapper>
  )
}
