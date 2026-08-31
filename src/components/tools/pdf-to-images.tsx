'use client'

import * as React from 'react'
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Sparkles,
  Image as ImageIcon,
  Loader2,
  Layers,
  FileImage,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
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
import JSZip from 'jszip'

interface RenderedPage {
  pageNumber: number
  width: number
  height: number
  dataUrl: string
  blob: Blob
}

export default function PdfToImages() {
  const [pdfFile, setPdfFile] = React.useState<File | null>(null)
  const [pages, setPages] = React.useState<RenderedPage[]>([])
  const [pageCount, setPageCount] = React.useState(0)
  const [format, setFormat] = React.useState<'png' | 'jpeg'>('png')
  const [quality, setQuality] = React.useState(0.92)
  const [scale, setScale] = React.useState(1.5)
  const [rendering, setRendering] = React.useState(false)
  const [pdfInfo, setPdfInfo] = React.useState<{ title?: string; author?: string; subject?: string; creator?: string } | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  // Dynamically load pdfjs-dist on the client only (so the worker can be set up cleanly).
  const pdfjsRef = React.useRef<typeof import('pdfjs-dist') | null>(null)
  const loadPdfjs = React.useCallback(async () => {
    if (pdfjsRef.current) return pdfjsRef.current
    const mod = await import('pdfjs-dist')
    mod.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
    pdfjsRef.current = mod
    return mod
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please select a PDF file')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large (max 50 MB)')
      return
    }
    setPdfFile(file)
    setPages([])
    setPageCount(0)
    setPdfInfo(null)
    toast.success(`Loaded ${file.name}`)
    // Auto-render on upload.
    setTimeout(() => renderPdf(file), 50)
    e.target.value = ''
  }

  async function renderPdf(file: File) {
    setRendering(true)
    try {
      const pdfjs = await loadPdfjs()
      const buffer = await file.arrayBuffer()
      const loadingTask = pdfjs.getDocument({ data: buffer })
      const pdf = await loadingTask.promise
      setPageCount(pdf.numPages)
      // Metadata
      try {
        const meta = await pdf.getMetadata()
        const info = (meta?.info ?? {}) as Record<string, unknown>
        setPdfInfo({
          title: typeof info.Title === 'string' ? info.Title : undefined,
          author: typeof info.Author === 'string' ? info.Author : undefined,
          subject: typeof info.Subject === 'string' ? info.Subject : undefined,
          creator: typeof info.Creator === 'string' ? info.Creator : undefined,
        })
      } catch {
        setPdfInfo(null)
      }

      const out: RenderedPage[] = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas 2D not supported')
        // White background for JPEG (since JPEG doesn't support transparency).
        if (format === 'jpeg') {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
        await page.render({ canvasContext: ctx, canvas, viewport }).promise
        const mime = format === 'png' ? 'image/png' : 'image/jpeg'
        const dataUrl = canvas.toDataURL(mime, quality)
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), mime, quality)
        })
        out.push({ pageNumber: i, width: canvas.width, height: canvas.height, dataUrl, blob })
        // Live-update as pages render.
        setPages([...out])
      }
      await pdf.destroy()
      toast.success(`Rendered ${out.length} page${out.length !== 1 ? 's' : ''}`)
    } catch (err) {
      toast.error(`PDF rendering failed: ${(err as Error).message}`)
    } finally {
      setRendering(false)
    }
  }

  function downloadAll() {
    if (pages.length === 0) {
      toast.info('Nothing to download')
      return
    }
    const zip = new JSZip()
    const stem = (pdfFile?.name ?? 'document').replace(/\.pdf$/i, '')
    pages.forEach((p) => {
      const ext = format === 'png' ? 'png' : 'jpg'
      zip.file(`${stem}-page-${String(p.pageNumber).padStart(3, '0')}.${ext}`, p.blob)
    })
    zip
      .generateAsync({ type: 'blob' })
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${stem}-images.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 1500)
        toast.success(`Downloaded ${pages.length} images as ZIP`)
      })
      .catch(() => toast.error('ZIP creation failed'))
  }

  function downloadOne(page: RenderedPage) {
    const url = URL.createObjectURL(page.blob)
    const a = document.createElement('a')
    a.href = url
    const stem = (pdfFile?.name ?? 'document').replace(/\.pdf$/i, '')
    const ext = format === 'png' ? 'png' : 'jpg'
    a.download = `${stem}-page-${String(page.pageNumber).padStart(3, '0')}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function rerender() {
    if (!pdfFile) return
    setPages([])
    renderPdf(pdfFile)
  }

  function clearAll() {
    setPdfFile(null)
    setPages([])
    setPageCount(0)
    setPdfInfo(null)
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        {/* Upload */}
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <FieldLabel className="mb-0 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            PDF file
          </FieldLabel>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" /> Upload PDF
            </Button>
            <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={handleUpload} />
            {pdfFile && (
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={clearAll}>
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>
        </div>

        {pdfFile && (
          <div className="rounded-lg border border-border/60 bg-card/50 p-4 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <FileImage className="h-8 w-8 text-rose-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{pdfFile.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{(pdfFile.size / 1024).toFixed(1)} KB{pageCount > 0 ? ` · ${pageCount} page${pageCount !== 1 ? 's' : ''}` : ''}</p>
              </div>
              {pages.length > 0 && (
                <Button size="sm" className="gap-1.5" onClick={downloadAll}>
                  <Download className="h-4 w-4" /> Download all as ZIP
                </Button>
              )}
            </div>
            {pdfInfo && (pdfInfo.title || pdfInfo.author || pdfInfo.creator) && (
              <div className="mt-3 pt-3 border-t border-border/60 grid gap-2 sm:grid-cols-2 text-xs">
                {pdfInfo.title && <Meta label="Title" value={pdfInfo.title} />}
                {pdfInfo.author && <Meta label="Author" value={pdfInfo.author} />}
                {pdfInfo.creator && <Meta label="Creator" value={pdfInfo.creator} />}
                {pdfInfo.subject && <Meta label="Subject" value={pdfInfo.subject} />}
              </div>
            )}
          </div>
        )}

        {/* Render options */}
        {pdfFile && (
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div>
              <FieldLabel>Format</FieldLabel>
              <Select value={format} onValueChange={(v) => setFormat(v as 'png' | 'jpeg')}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG (lossless)</SelectItem>
                  <SelectItem value="jpeg">JPEG (smaller)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel>Scale: <span className="font-mono text-primary">{scale.toFixed(2)}×</span></FieldLabel>
              <Slider value={[scale * 100]} min={50} max={300} step={10} onValueChange={(v) => setScale(v[0] / 100)} />
              <p className="text-[10px] text-muted-foreground mt-1">Higher = sharper, larger files</p>
            </div>
            <div>
              <FieldLabel>JPEG quality: <span className="font-mono text-primary">{Math.round(quality * 100)}%</span></FieldLabel>
              <Slider value={[Math.round(quality * 100)]} min={50} max={100} step={1} onValueChange={(v) => setQuality(v[0] / 100)} disabled={format !== 'jpeg'} />
              <Button variant="ghost" size="sm" className="mt-1 h-7 gap-1.5" onClick={rerender} disabled={rendering}>
                <Sparkles className="h-3 w-3" /> Re-render with new settings
              </Button>
            </div>
          </div>
        )}

        {!pdfFile ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="cursor-pointer rounded-lg border-2 border-dashed border-border hover:border-primary/60 transition-colors p-10 text-center"
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Drop or click to upload a PDF</p>
            <p className="text-xs text-muted-foreground mt-1">Up to 50 MB · processed locally in your browser</p>
          </div>
        ) : rendering && pages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Rendering PDF pages…</p>
          </div>
        ) : pages.length === 0 ? (
          <EmptyState message="Click Re-render with new settings to generate images." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {pages.map((p) => (
              <div key={p.pageNumber} className="rounded-lg border border-border overflow-hidden group">
                <div className="relative aspect-[3/4] bg-muted/30 flex items-center justify-center">
                  <img src={p.dataUrl} alt={`Page ${p.pageNumber}`} className="max-w-full max-h-full object-contain" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => downloadOne(p)}>
                      <Download className="h-3.5 w-3.5" /> Download
                    </Button>
                  </div>
                </div>
                <div className="p-2 flex items-center justify-between text-xs">
                  <span className="font-medium">Page {p.pageNumber}</span>
                  <span className="text-muted-foreground font-mono">{p.width}×{p.height}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {rendering && pages.length > 0 && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Rendering page {pages.length + 1} of {pageCount}…
          </div>
        )}
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">How it works</h3>
        </div>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>PDF parsing and rendering happens entirely in your browser using the open-source <code className="font-mono">pdfjs-dist</code> library (Mozilla PDF.js).</li>
          <li>A Web Worker (<code className="font-mono">/pdf.worker.min.mjs</code>) parses the PDF off the main thread to keep the UI responsive.</li>
          <li>Each page is drawn to a <code className="font-mono">&lt;canvas&gt;</code> at the chosen scale and exported as PNG (lossless) or JPEG (smaller).</li>
          <li>The scale slider controls the rendering resolution: 1.5× is good for screen, 3× for print.</li>
          <li>For JPEG, a white background is drawn first because JPEG doesn't support transparency.</li>
          <li>Click <span className="font-medium text-foreground">Download all as ZIP</span> to package every page into a single archive.</li>
        </ul>
      </ToolCardWrapper>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  )
}
