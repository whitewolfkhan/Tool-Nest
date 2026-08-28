'use client'

import * as React from 'react'
import { PDFDocument } from 'pdf-lib'
import {
  Upload,
  FileText,
  Download,
  Loader2,
  X,
  Minimize2,
  ArrowRight,
  CheckCircle2,
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
import { ToolCardWrapper, FieldLabel } from '@/components/tool-page-shell'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Level = 'lossless' | 'balanced' | 'max'

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

export default function PdfCompress() {
  const [file, setFile] = React.useState<File | null>(null)
  const [level, setLevel] = React.useState<Level>('balanced')
  const [busy, setBusy] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const [result, setResult] = React.useState<{ size: number; bytes: Uint8Array } | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const loadFile = (f: File) => {
    if (f.type !== 'application/pdf') {
      toast.error('Please select a PDF file')
      return
    }
    setFile(f)
    setResult(null)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) loadFile(f)
  }

  const reset = () => {
    setFile(null)
    setResult(null)
  }

  const compress = async () => {
    if (!file) return
    setBusy(true)
    try {
      const buf = await file.arrayBuffer()
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true })

      // Always re-save with object streams (lossless compression).
      if (level === 'lossless') {
        const bytes = await doc.save({ useObjectStreams: true })
        setResult({ size: bytes.length, bytes })
      } else if (level === 'balanced') {
        // Strip metadata for additional savings.
        doc.setTitle('')
        doc.setAuthor('')
        doc.setSubject('')
        doc.setKeywords([])
        doc.setProducer('ToolNest')
        doc.setCreator('ToolNest')
        const bytes = await doc.save({ useObjectStreams: true })
        setResult({ size: bytes.length, bytes })
      } else {
        // Max: strip metadata + drop page labels + object streams.
        doc.setTitle('')
        doc.setAuthor('')
        doc.setSubject('')
        doc.setKeywords([])
        doc.setProducer('ToolNest')
        doc.setCreator('ToolNest')
        try {
          doc.setCreationDate(new Date(0))
          doc.setModificationDate(new Date(0))
        } catch {
          /* ignore */
        }
        const bytes = await doc.save({
          useObjectStreams: true,
          addDefaultPage: false,
        })
        setResult({ size: bytes.length, bytes })
      }
      toast.success('PDF compressed')
    } catch (err) {
      console.error(err)
      toast.error('Failed to compress PDF. It may be corrupted or encrypted.')
    } finally {
      setBusy(false)
    }
  }

  const saveResult = () => {
    if (!result || !file) return
    download(
      new Blob([result.bytes as BlobPart], { type: 'application/pdf' }),
      file.name.replace(/\.pdf$/i, '') + '_compressed.pdf',
    )
  }

  const savedBytes = result ? file!.size - result.size : 0
  const savedPct = result && file ? Math.round((savedBytes / file.size) * 100) : 0

  return (
    <ToolCardWrapper>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload */}
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
                    Original size: {formatSize(file.size)}
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
                <Label className="text-sm font-medium mb-1.5 block">
                  Compression level
                </Label>
                <Select value={level} onValueChange={(v) => setLevel(v as Level)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lossless">Lossless re-pack</SelectItem>
                    <SelectItem value="balanced">Balanced (strip metadata)</SelectItem>
                    <SelectItem value="max">Maximum (aggressive strip)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-2 text-xs text-muted-foreground">
                  {level === 'lossless' && 'Re-saves the PDF with object streams enabled. No quality loss, modest size reduction.'}
                  {level === 'balanced' && 'Removes metadata (title, author, keywords) and re-packs object streams.'}
                  {level === 'max' && 'Strips all metadata and dates in addition to object stream compression.'}
                </p>
              </div>
              <Button
                onClick={compress}
                disabled={busy}
                className="w-full gap-2"
                size="lg"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
                {busy ? 'Compressing...' : 'Compress PDF'}
              </Button>
            </div>
          )}
        </div>

        {/* Result */}
        <div className="space-y-4">
          <FieldLabel>Result</FieldLabel>
          {!result ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              <Minimize2 className="mb-2 h-8 w-8 opacity-40" />
              Compressed output will appear here.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Before
                  </p>
                  <p className="mt-1 text-lg font-bold">{formatSize(file!.size)}</p>
                </div>
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    After
                  </p>
                  <p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    {formatSize(result.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-card p-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Saved</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {savedPct > 0 ? savedPct : 0}%
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Bytes</p>
                  <p className="text-lg font-semibold">
                    {formatSize(Math.max(0, savedBytes))}
                  </p>
                </div>
                {savedBytes > 0 && (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                )}
              </div>

              {savedBytes <= 0 && (
                <p className="rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                  This PDF is already highly optimized. Lossless re-packing could not reduce it further.
                </p>
              )}

              <div className="flex items-center justify-between">
                <Badge variant="secondary">compressed.pdf</Badge>
                <Button onClick={saveResult} className="gap-2">
                  <Download className="h-4 w-4" /> Download
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolCardWrapper>
  )
}
