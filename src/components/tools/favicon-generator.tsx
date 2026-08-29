'use client'

import * as React from 'react'
import {
  Globe,
  Upload,
  X,
  Download,
  FileArchive,
  FileImage,
  Bold,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper, FieldLabel, EmptyState } from '@/components/tool-page-shell'
import { toast } from 'sonner'
import JSZip from 'jszip'

type Mode = 'text' | 'image'

const SIZES = [16, 32, 48, 180, 512] as const
type SizeNum = (typeof SIZES)[number]

interface SizePreview {
  size: SizeNum
  dataUrl: string
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Failed to read file'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

/** Draw text favicon to a canvas of `size` px. Returns data URL. */
function drawTextFavicon(
  size: number,
  text: string,
  fontSizePct: number,
  bg: string,
  fg: string,
  bold: boolean
): string {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, size, size)
  const fontSize = Math.max(1, Math.round((fontSizePct / 100) * size))
  ctx.font = `${bold ? 'bold ' : ''}${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = fg
  ctx.fillText(text || '', size / 2, size / 2 + Math.round(size * 0.02))
  return canvas.toDataURL('image/png')
}

/** Draw image favicon (center-cropped to square) to a canvas of `size` px. */
function drawImageFavicon(size: number, img: HTMLImageElement): string {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  // Center crop to square
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height
  if (iw === 0 || ih === 0) return ''
  const side = Math.min(iw, ih)
  const sx = (iw - side) / 2
  const sy = (ih - side) / 2
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)
  return canvas.toDataURL('image/png')
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(',')
  const mime = (head.match(/data:([^;]+)/) || [, 'image/png'])[1]
  const bin = atob(body)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

function dataUrlToUint8(dataUrl: string): Uint8Array {
  const body = dataUrl.split(',')[1] ?? ''
  const bin = atob(body)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return arr
}

/**
 * Build a Windows .ico file containing a single 32x32 PNG.
 * Limitation: this only embeds one size (32x32). Real ICO files can embed
 * multiple sizes — for multi-size favicons, use the ZIP download option.
 */
function buildIco(png32DataUrl: string): Uint8Array {
  const pngBytes = dataUrlToUint8(png32DataUrl)
  const buf = new Uint8Array(6 + 16 + pngBytes.length)
  const dv = new DataView(buf.buffer)
  // ICONDIR
  dv.setUint16(0, 0, true) // reserved
  dv.setUint16(2, 1, true) // type = 1 (ICO)
  dv.setUint16(4, 1, true) // count = 1
  // ICONDIRENTRY
  buf[6] = 32 // width (0 = 256)
  buf[7] = 32 // height
  buf[8] = 0 // color count
  buf[9] = 0 // reserved
  dv.setUint16(10, 1, true) // planes
  dv.setUint16(12, 32, true) // bits per pixel
  dv.setUint32(14, pngBytes.length, true) // bytes in resource
  dv.setUint32(18, 22, true) // offset (6 + 16 = 22)
  buf.set(pngBytes, 22)
  return buf
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function FaviconGenerator() {
  const [mode, setMode] = React.useState<Mode>('text')
  // Text mode state
  const [text, setText] = React.useState<string>('T')
  const [fontSize, setFontSize] = React.useState<number>(60)
  const [bg, setBg] = React.useState<string>('#10B981')
  const [fg, setFg] = React.useState<string>('#FFFFFF')
  const [bold, setBold] = React.useState<boolean>(true)
  // Image mode state
  const [imageDataUrl, setImageDataUrl] = React.useState<string | null>(null)
  const [imageEl, setImageEl] = React.useState<HTMLImageElement | null>(null)
  const [dragOver, setDragOver] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const [previews, setPreviews] = React.useState<SizePreview[]>([])
  const [generated, setGenerated] = React.useState(false)

  async function handleFile(file: File | undefined | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    try {
      const url = await fileToDataUrl(file)
      const img = await loadImage(url)
      setImageDataUrl(url)
      setImageEl(img)
      setPreviews([])
      setGenerated(false)
    } catch {
      toast.error('Failed to load image')
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    void handleFile(file)
  }

  const generate = React.useCallback(() => {
    if (mode === 'text') {
      if (!text.trim()) {
        toast.error('Enter 1-2 characters for the text')
        return
      }
      const next = SIZES.map((size) => ({
        size,
        dataUrl: drawTextFavicon(size, text.trim().slice(0, 2), fontSize, bg, fg, bold),
      }))
      setPreviews(next)
      setGenerated(true)
      toast.success('Favicons generated')
    } else {
      if (!imageEl) {
        toast.error('Upload an image first')
        return
      }
      const next = SIZES.map((size) => ({
        size,
        dataUrl: drawImageFavicon(size, imageEl),
      }))
      setPreviews(next)
      setGenerated(true)
      toast.success('Favicons generated')
    }
  }, [mode, text, fontSize, bg, fg, bold, imageEl])

  // Live preview while editing (text mode only, image mode requires explicit generate)
  React.useEffect(() => {
    if (mode !== 'text') return
    if (!text.trim()) {
      setPreviews([])
      setGenerated(false)
      return
    }
    const next = SIZES.map((size) => ({
      size,
      dataUrl: drawTextFavicon(size, text.trim().slice(0, 2), fontSize, bg, fg, bold),
    }))
    setPreviews(next)
    setGenerated(true)
  }, [mode, text, fontSize, bg, fg, bold])

  function resetImage() {
    setImageDataUrl(null)
    setImageEl(null)
    setPreviews([])
    setGenerated(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  function downloadPng512() {
    const p = previews.find((x) => x.size === 512)
    if (!p) {
      toast.error('Generate first')
      return
    }
    triggerDownload(dataUrlToBlob(p.dataUrl), 'favicon-512.png')
    toast.success('Downloaded favicon-512.png')
  }

  async function downloadZip() {
    if (previews.length === 0) {
      toast.error('Generate favicons first')
      return
    }
    const zip = new JSZip()
    for (const p of previews) {
      zip.file(`favicon-${p.size}.png`, dataUrlToUint8(p.dataUrl))
    }
    // Add apple-touch-icon alias for 180
    const apple = previews.find((x) => x.size === 180)
    if (apple) zip.file('apple-touch-icon.png', dataUrlToUint8(apple.dataUrl))
    const blob = await zip.generateAsync({ type: 'blob' })
    triggerDownload(blob, 'favicons.zip')
    toast.success('Downloaded favicons.zip')
  }

  function downloadIco() {
    const p = previews.find((x) => x.size === 32)
    if (!p) {
      toast.error('Generate favicons first')
      return
    }
    const ico = buildIco(p.dataUrl)
    triggerDownload(new Blob([ico], { type: 'image/x-icon' }), 'favicon.ico')
    toast.success('Downloaded favicon.ico (32x32)')
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
          <TabsList className="mb-4">
            <TabsTrigger value="text">From Text</TabsTrigger>
            <TabsTrigger value="image">From Image</TabsTrigger>
          </TabsList>

          <TabsContent value="text">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <FieldLabel>Text (1-2 chars)</FieldLabel>
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="e.g. T, A1, 鬼"
                    maxLength={2}
                    className="text-center text-2xl font-bold"
                  />
                </div>
                <div>
                  <FieldLabel>Font size: {fontSize}%</FieldLabel>
                  <Slider
                    min={20}
                    max={90}
                    step={1}
                    value={[fontSize]}
                    onValueChange={(v) => setFontSize(v[0] ?? 60)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Background</FieldLabel>
                    <div className="flex items-center gap-2">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border">
                        <div className="absolute inset-0" style={{ backgroundColor: bg }} />
                        <input
                          type="color"
                          aria-label="Background color"
                          value={bg}
                          onChange={(e) => setBg(e.target.value.toUpperCase())}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                      </div>
                      <Input
                        value={bg}
                        onChange={(e) => setBg(e.target.value.toUpperCase())}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Text color</FieldLabel>
                    <div className="flex items-center gap-2">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border">
                        <div className="absolute inset-0" style={{ backgroundColor: fg }} />
                        <input
                          type="color"
                          aria-label="Text color"
                          value={fg}
                          onChange={(e) => setFg(e.target.value.toUpperCase())}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                      </div>
                      <Input
                        value={fg}
                        onChange={(e) => setFg(e.target.value.toUpperCase())}
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Bold className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Bold text</span>
                  </div>
                  <Switch checked={bold} onCheckedChange={setBold} />
                </div>
                <Button onClick={generate} className="gap-1.5 w-full sm:w-auto">
                  <Globe className="h-4 w-4" />
                  Generate favicons
                </Button>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-5 flex items-center justify-center">
                <div className="text-center">
                  <div
                    className="mx-auto mb-3 flex h-32 w-32 items-center justify-center rounded-2xl border border-border shadow-sm"
                    style={{ backgroundColor: bg }}
                  >
                    <span
                      style={{
                        color: fg,
                        fontSize: `${(fontSize / 100) * 128}px`,
                        fontWeight: bold ? 700 : 400,
                        fontFamily: 'sans-serif',
                        lineHeight: 1,
                      }}
                    >
                      {text.trim().slice(0, 2) || '?'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Live preview · 128px</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="image">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {!imageDataUrl ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    inputRef.current?.click()
                  }
                }}
                className={
                  'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-12 text-center cursor-pointer transition-colors ' +
                  (dragOver
                    ? 'border-primary bg-accent'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50')
                }
              >
                <div className="rounded-full bg-primary/10 p-3">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Drop an image here, or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPEG, or WebP · image will be center-cropped to a square
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-4 flex-col sm:flex-row">
                  <img
                    src={imageDataUrl}
                    alt="Source preview"
                    className="w-full sm:w-48 h-48 object-cover rounded-md border border-border bg-muted"
                  />
                  <div className="flex-1 flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">
                      Source image ready. Click &ldquo;Generate&rdquo; to crop to square and
                      render at all sizes.
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button onClick={generate} className="gap-1.5">
                        <Globe className="h-4 w-4" />
                        Generate favicons
                      </Button>
                      <Button variant="outline" onClick={resetImage} className="gap-1.5">
                        <X className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </ToolCardWrapper>

      {/* Size preview grid */}
      {previews.length > 0 ? (
        <ToolCardWrapper>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileImage className="h-4 w-4 text-primary" />
              Size previews
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={downloadPng512} variant="outline" size="sm" className="gap-1.5">
                <Download className="h-4 w-4" />
                PNG (512)
              </Button>
              <Button onClick={downloadZip} variant="outline" size="sm" className="gap-1.5">
                <FileArchive className="h-4 w-4" />
                ZIP (all)
              </Button>
              <Button onClick={downloadIco} size="sm" className="gap-1.5">
                <Download className="h-4 w-4" />
                ICO (32)
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {previews.map((p) => (
              <div
                key={p.size}
                className="flex flex-col items-center gap-2 rounded-md border border-border bg-muted/30 p-4"
              >
                <div className="flex h-24 w-full items-center justify-center bg-[conic-gradient(at_top_left,#fff_25%,#e5e7eb_25%_50%,#fff_50%_75%,#e5e7eb_75%)] bg-[length:12px_12px] rounded">
                  <img
                    src={p.dataUrl}
                    alt={`Favicon preview at ${p.size}×${p.size}`}
                    width={Math.min(p.size, 96)}
                    height={Math.min(p.size, 96)}
                    className="rounded-sm"
                    style={{
                      width: Math.min(p.size, 96),
                      height: Math.min(p.size, 96),
                      imageRendering: p.size <= 32 ? 'pixelated' : 'auto',
                    }}
                  />
                </div>
                <Badge variant="secondary" className="font-mono">
                  {p.size}×{p.size}
                </Badge>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <p className="text-xs text-muted-foreground">
            <strong>ICO limitation:</strong> the .ico file embeds only the 32×32 PNG.
            Modern browsers prefer PNG favicons — use the ZIP for full multi-size coverage
            (including <code>apple-touch-icon.png</code> at 180×180).
          </p>
        </ToolCardWrapper>
      ) : (
        <EmptyState
          message={
            mode === 'text'
              ? 'Type 1-2 characters and pick colors to see live favicon previews at all sizes.'
              : 'Upload an image and click Generate to preview favicons at all sizes.'
          }
        />
      )}
    </div>
  )
}
