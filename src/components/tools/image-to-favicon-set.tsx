'use client'

import * as React from 'react'
import JSZip from 'jszip'
import {
  Upload,
  Download,
  Copy,
  Check,
  Image as ImageIcon,
  FileImage,
  Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  ToolCardWrapper,
  FieldLabel,
  EmptyState,
  CopyButton,
  DownloadButton,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

const SIZES = [16, 32, 48, 64, 96, 180, 192, 256, 384, 512]

interface PreviewItem {
  size: number
  dataUrl: string
}

function renderToCanvas(
  source: HTMLImageElement,
  size: number,
  background?: string
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  if (background) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, size, size)
  }
  // Cover-fit drawing
  const sw = source.naturalWidth || source.width
  const sh = source.naturalHeight || source.height
  if (sw > 0 && sh > 0) {
    const ratio = Math.max(size / sw, size / sh)
    const dw = sw * ratio
    const dh = sh * ratio
    const dx = (size - dw) / 2
    const dy = (size - dh) / 2
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(source, dx, dy, dw, dh)
  }
  return canvas
}

function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b)
      else reject(new Error('toBlob failed'))
    }, type)
  })
}

// Generate an .ico file containing one PNG (32x32) entry
async function generateIco(png32: Blob): Promise<Blob> {
  const pngData = new Uint8Array(await png32.arrayBuffer())
  // ICONDIR (6 bytes) + ICONDIRENTRY (16 bytes) + PNG data
  const buf = new Uint8Array(6 + 16 + pngData.length)
  const dv = new DataView(buf.buffer)
  // ICONDIR
  dv.setUint16(0, 0, true) // reserved
  dv.setUint16(2, 1, true) // type = 1 (icon)
  dv.setUint16(4, 1, true) // count
  // ICONDIRENTRY
  buf[6] = 32 // width (0 = 256)
  buf[7] = 32 // height
  buf[8] = 0 // color count
  buf[9] = 0 // reserved
  dv.setUint16(10, 1, true) // planes
  dv.setUint16(12, 32, true) // bpp
  dv.setUint32(14, pngData.length, true) // bytes-in-res
  dv.setUint32(18, 6 + 16, true) // image offset
  buf.set(pngData, 22)
  return new Blob([buf.buffer], { type: 'image/x-icon' })
}

export default function ImageToFaviconSet() {
  const [srcUrl, setSrcUrl] = React.useState<string>('')
  const [srcImg, setSrcImg] = React.useState<HTMLImageElement | null>(null)
  const [bgColor, setBgColor] = React.useState<string>('')
  const [previews, setPreviews] = React.useState<PreviewItem[]>([])
  const [busy, setBusy] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const dragRef = React.useRef<HTMLDivElement>(null)
  const [dragOver, setDragOver] = React.useState(false)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file (PNG, JPG, SVG)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      setSrcUrl(url)
      const img = new Image()
      img.onload = () => {
        setSrcImg(img)
        toast.success(`Loaded image (${img.naturalWidth}×${img.naturalHeight})`)
      }
      img.onerror = () => toast.error('Failed to load image')
      img.src = url
    }
    reader.onerror = () => toast.error('Failed to read file')
    reader.readAsDataURL(file)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  // Generate previews whenever srcImg or bgColor changes
  React.useEffect(() => {
    if (!srcImg) {
      setPreviews([])
      return
    }
    const items: PreviewItem[] = SIZES.map((size) => {
      const c = renderToCanvas(srcImg, size, bgColor || undefined)
      return { size, dataUrl: c.toDataURL('image/png') }
    })
    setPreviews(items)
  }, [srcImg, bgColor])

  const htmlSnippet = React.useMemo(() => {
    return `<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="#10B981" />`
  }, [])

  const manifestJson = React.useMemo(() => {
    return JSON.stringify(
      {
        name: 'My App',
        short_name: 'My App',
        icons: [
          { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/android-chrome-256x256.png', sizes: '256x256', type: 'image/png' },
          { src: '/android-chrome-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
        theme_color: '#10B981',
        background_color: '#ffffff',
        display: 'standalone',
      },
      null,
      2
    )
  }, [])

  const downloadAll = async () => {
    if (!srcImg) {
      toast.error('Upload an image first')
      return
    }
    setBusy(true)
    try {
      const zip = new JSZip()
      // Generate all PNGs
      const pngs: Record<number, Blob> = {}
      for (const size of SIZES) {
        const canvas = renderToCanvas(srcImg, size, bgColor || undefined)
        const blob = await canvasToBlob(canvas, 'image/png')
        pngs[size] = blob
        zip.file(`favicon-${size}x${size}.png`, blob)
      }
      // Standard web icons
      zip.file('favicon-32x32.png', pngs[32]!)
      zip.file('favicon-16x16.png', pngs[16]!)
      zip.file('favicon-96x96.png', pngs[96]!)
      // apple-touch-icon (180x180)
      zip.file('apple-touch-icon.png', pngs[180]!)
      // Android-chrome aliases
      zip.file('android-chrome-192x192.png', pngs[192]!)
      zip.file('android-chrome-256x256.png', pngs[256]!)
      zip.file('android-chrome-384x384.png', pngs[384]!)
      zip.file('android-chrome-512x512.png', pngs[512]!)
      // favicon.ico wrapping the 32x32 PNG
      const ico = await generateIco(pngs[32]!)
      zip.file('favicon.ico', ico)
      // manifest
      zip.file('site.webmanifest', manifestJson)
      // HTML snippet
      zip.file('index.html', `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <title>My App</title>\n${htmlSnippet.split('\n').join('\n  ')}\n</head>\n<body>\n  <h1>Hello, world.</h1>\n</body>\n</html>\n`)

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'favicon-set.zip'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Favicon set downloaded')
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate ZIP')
    } finally {
      setBusy(false)
    }
  }

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(htmlSnippet)
      setCopied(true)
      toast.success('HTML snippet copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Upload */}
          <div className="space-y-4">
            <div>
              <FieldLabel>Source image</FieldLabel>
              <div
                ref={dragRef}
                onClick={() => inputRef.current?.click()}
                onDrop={onDrop}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/60 hover:bg-accent'
                }`}
              >
                {srcUrl ? (
                  <div className="space-y-2">
                    <img
                      src={srcUrl}
                      alt="Source"
                      className="mx-auto max-h-32 rounded-md border border-border object-contain"
                    />
                    <p className="text-xs text-muted-foreground">
                      Click to replace · {srcImg?.naturalWidth}×{srcImg?.naturalHeight}
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Click or drop an image</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG or JPG · ideally 512×512 or larger
                    </p>
                  </>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              onChange={onInputChange}
              className="hidden"
            />
              </div>
            </div>

            <div>
              <FieldLabel>Background fill (optional)</FieldLabel>
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border">
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: bgColor || 'transparent' }}
                  />
                  <input
                    type="color"
                    aria-label="Background color"
                    value={bgColor || '#ffffff'}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
                <Input
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  placeholder="transparent (leave empty)"
                  className="font-mono"
                />
                {bgColor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBgColor('')}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Fill transparent areas (PNG with alpha) so favicons look good on any theme.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <DownloadButton
                onClick={downloadAll}
                disabled={!srcImg || busy}
                label={busy ? 'Generating...' : 'Download ZIP'}
              />
              {srcImg && (
                <Button variant="outline" onClick={() => setSrcUrl('')} className="gap-1.5">
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Right: Previews */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <FileImage className="h-4 w-4 text-primary" />
                Generated sizes
              </h3>
              <Badge variant="secondary">{SIZES.length} files</Badge>
            </div>
            {!previews.length ? (
              <EmptyState message="Upload a source image to see size previews." />
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {previews.map((p) => (
                  <div
                    key={p.size}
                    className="rounded-md border border-border bg-muted/30 p-3 flex flex-col items-center gap-2"
                  >
                    <div
                      className="flex items-center justify-center bg-white dark:bg-zinc-900 rounded border border-border"
                      style={{ width: 64, height: 64 }}
                    >
                      <img
                        src={p.dataUrl}
                        alt={`favicon-${p.size}x${p.size}`}
                        style={{ width: Math.min(p.size, 56), height: Math.min(p.size, 56) }}
                        className="object-contain"
                      />
                    </div>
                    <span className="text-xs font-mono">{p.size}×{p.size}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ToolCardWrapper>

      {/* HTML snippet */}
      <ToolCardWrapper>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <ImageIcon className="h-4 w-4 text-primary" />
            HTML snippet
          </h3>
          <Button onClick={copySnippet} variant="outline" size="sm" className="gap-1.5">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <pre className="max-h-72 overflow-auto rounded-md border border-border bg-muted/40 p-4 text-xs font-mono leading-relaxed">
          {htmlSnippet}
        </pre>
        <p className="mt-2 text-xs text-muted-foreground">
          Paste this inside the <code className="font-mono">&lt;head&gt;</code> of your HTML document.
        </p>
      </ToolCardWrapper>

      <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-primary" />
          What&apos;s inside the ZIP
        </p>
        <ul className="list-disc pl-5 space-y-0.5">
          <li>10 individual PNGs (16, 32, 48, 64, 96, 180, 192, 256, 384, 512 px)</li>
          <li><code className="font-mono">favicon.ico</code> (wrapping the 32×32 PNG)</li>
          <li><code className="font-mono">apple-touch-icon.png</code> (180×180)</li>
          <li><code className="font-mono">site.webmanifest</code> referencing all icons</li>
          <li>Aliased <code className="font-mono">android-chrome-*</code> icons for PWA support</li>
          <li>A sample <code className="font-mono">index.html</code> with the link tags pre-filled</li>
        </ul>
      </div>
    </div>
  )
}
