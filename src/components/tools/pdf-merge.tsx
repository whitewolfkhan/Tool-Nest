'use client'

import * as React from 'react'
import { PDFDocument } from 'pdf-lib'
import {
  Upload,
  FileText,
  Trash2,
  ArrowUp,
  ArrowDown,
  Download,
  Loader2,
  Plus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper, FieldLabel, EmptyState } from '@/components/tool-page-shell'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PdfFile {
  id: string
  file: File
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

let counter = 0
function uid() {
  counter += 1
  return `f-${Date.now()}-${counter}`
}

export default function PdfMerge() {
  const [files, setFiles] = React.useState<PdfFile[]>([])
  const [busy, setBusy] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const addFiles = (list: FileList | File[]) => {
    const arr = Array.from(list).filter((f) => f.type === 'application/pdf')
    if (arr.length === 0) {
      toast.error('Please select PDF files only')
      return
    }
    const mapped = arr.map((file) => ({ id: uid(), file }))
    setFiles((prev) => [...prev, ...mapped])
    toast.success(`Added ${arr.length} file${arr.length > 1 ? 's' : ''}`)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  const move = (index: number, dir: -1 | 1) => {
    setFiles((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const remove = (id: string) =>
    setFiles((prev) => prev.filter((f) => f.id !== id))

  const clearAll = () => setFiles([])

  const merge = async () => {
    if (files.length < 2) {
      toast.error('Please add at least 2 PDFs to merge')
      return
    }
    setBusy(true)
    try {
      const merged = await PDFDocument.create()
      for (const item of files) {
        const bytes = await item.file.arrayBuffer()
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true })
        const pages = await merged.copyPages(src, src.getPageIndices())
        pages.forEach((p) => merged.addPage(p))
      }
      const out = await merged.save()
      const blob = new Blob([out], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'merged.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success(`Merged ${files.length} PDFs successfully`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to merge PDFs. One of the files may be corrupted or encrypted.')
    } finally {
      setBusy(false)
    }
  }

  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0)

  return (
    <ToolCardWrapper>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload zone + file list */}
        <div className="space-y-4">
          <FieldLabel>PDF files (in merge order)</FieldLabel>
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
            <p className="text-sm font-medium">Drop PDFs here or click to upload</p>
            <p className="text-xs text-muted-foreground">You can add multiple PDF files</p>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
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
              {files.length} file{files.length !== 1 ? 's' : ''} · {formatSize(totalSize)}
            </p>
            {files.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1.5 text-muted-foreground">
                <Trash2 className="h-4 w-4" /> Clear all
              </Button>
            )}
          </div>

          {files.length === 0 ? (
            <EmptyState message="No files added yet. Upload at least two PDFs to merge." />
          ) : (
            <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {files.map((item, idx) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-rose-500/10">
                    <FileText className="h-5 w-5 text-rose-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(item.file.size)}</p>
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
                      disabled={idx === files.length - 1 || busy}
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

        {/* Action panel */}
        <div className="space-y-4">
          <FieldLabel>Output</FieldLabel>
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Files to merge</span>
              <span className="font-semibold">{files.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total size</span>
              <span className="font-semibold">{formatSize(totalSize)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Output filename</span>
              <span className="font-semibold">merged.pdf</span>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <Plus className="mt-0.5 h-4 w-4 shrink-0" />
              Pages from each PDF will be appended in the order shown. Use the
              up/down arrows to rearrange before merging.
            </p>
          </div>

          <Button
            onClick={merge}
            disabled={busy || files.length < 2}
            className="w-full gap-2"
            size="lg"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {busy ? 'Merging...' : 'Merge & Download'}
          </Button>
          {files.length < 2 && (
            <p className="text-center text-xs text-muted-foreground">
              Add at least 2 PDFs to enable merging
            </p>
          )}
        </div>
      </div>
    </ToolCardWrapper>
  )
}
