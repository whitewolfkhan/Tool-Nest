'use client'

import * as React from 'react'
import {
  Image as ImageIcon,
  Download,
  Trash2,
  Upload,
  ClipboardPaste,
  FileImage,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  ToolCardWrapper,
  FieldLabel,
  EmptyState,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

type ImgType = 'png' | 'jpeg' | 'gif' | 'webp' | 'bmp' | 'svg' | 'ico' | 'unknown'

const TYPE_LABELS: Record<ImgType, string> = {
  png: 'PNG',
  jpeg: 'JPEG',
  gif: 'GIF',
  webp: 'WebP',
  bmp: 'BMP',
  svg: 'SVG',
  ico: 'ICO',
  unknown: 'Unknown',
}

const TYPE_MIME: Record<ImgType, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  unknown: 'application/octet-stream',
}

/**
 * Heuristically detect image type from a raw base64 string (no data: prefix).
 * Based on well-known magic-byte prefixes encoded as base64.
 */
function detectType(raw: string): ImgType {
  const s = raw.trim()
  if (!s) return 'unknown'
  // SVG is XML text — either contains <svg in decoded form, or base64-decoded starts with <?xml / <svg
  if (/^(PHN2Z|PD94b|PHTmd|PCEt|PHN2ZWc)/.test(s)) return 'svg'
  if (/^iVBORw/.test(s)) return 'png'
  if (/^\/9j\//.test(s) || /^\/9j\/4/.test(s)) return 'jpeg'
  if (/^R0lGOD/.test(s)) return 'gif'
  if (/^UklGR/.test(s)) return 'webp'
  if (/^Qk/.test(s)) return 'bmp'
  // ICO: starts with 00 00 01 00 — base64 of "\x00\x00\x01\x00" → "AAABAA"
  if (/^AAABAA/.test(s)) return 'ico'
  return 'unknown'
}

/** Strip optional data: URI prefix and return { raw, mime }. */
function splitDataUri(input: string): { raw: string; mime: string | null } {
  const m = input.match(/^data:([^;,]+)?(;base64)?,([\s\S]*)$/i)
  if (m) {
    return { raw: m[3] ?? '', mime: m[1] ?? null }
  }
  return { raw: input, mime: null }
}

function base64ToBytes(b64: string): Uint8Array {
  // atob handles standard base64 — strip whitespace
  const cleaned = b64.replace(/\s+/g, '')
  try {
    const bin = atob(cleaned)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return bytes
  } catch {
    return new Uint8Array(0)
  }
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

const SAMPLE_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAAAyCAYAAACqNX6+AAAAOklEQVR4nO3PAQ0AAAjDMMc/0EzuCSWyilEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBATkDFQWAAGrx4MpAAAAAElFTkSuQmCC'

export default function Base64ImageDecoder() {
  const [input, setInput] = React.useState('')
  const [override, setOverride] = React.useState<ImgType | 'auto'>('auto')

  const fileRef = React.useRef<HTMLInputElement>(null)
  const imgRef = React.useRef<HTMLImageElement>(null)

  const { raw, mime: detectedMime } = React.useMemo(() => {
    if (!input.trim()) return { raw: '', mime: null }
    const { raw, mime } = splitDataUri(input)
    return { raw, mime }
  }, [input])

  const detectedType = React.useMemo<ImgType>(() => {
    if (!raw) return 'unknown'
    // Prefer mime from data URI prefix, then heuristics on raw bytes
    if (detectedMime) {
      const m = detectedMime.toLowerCase()
      if (m.includes('png')) return 'png'
      if (m.includes('jpeg') || m.includes('jpg')) return 'jpeg'
      if (m.includes('gif')) return 'gif'
      if (m.includes('webp')) return 'webp'
      if (m.includes('bmp')) return 'bmp'
      if (m.includes('svg')) return 'svg'
      if (m.includes('icon')) return 'ico'
    }
    return detectType(raw)
  }, [raw, detectedMime])

  const type: ImgType = override === 'auto' ? detectedType : override

  const bytes = React.useMemo(() => (raw ? base64ToBytes(raw) : new Uint8Array()), [raw])
  const byteLen = bytes.length

  // Base64 length → estimated raw size (4 chars = 3 bytes, minus padding)
  const estimatedBytes = React.useMemo(() => {
    if (!raw) return 0
    const cleaned = raw.replace(/\s+/g, '')
    const pad = cleaned.endsWith('==') ? 2 : cleaned.endsWith('=') ? 1 : 0
    return Math.max(0, Math.floor((cleaned.length * 3) / 4) - pad)
  }, [raw])

  const [dims, setDims] = React.useState<{ w: number; h: number } | null>(null)

  // Build a data URL for preview & download
  const dataUrl = React.useMemo(() => {
    if (!raw) return ''
    if (input.trim().startsWith('data:') && override === 'auto') {
      return input.trim()
    }
    return `data:${TYPE_MIME[type]};base64,${raw.replace(/\s+/g, '')}`
  }, [raw, input, type, override])

  // Reset dims when image changes
  React.useEffect(() => {
    setDims(null)
    if (dataUrl && imgRef.current) {
      // Trigger dimension detection via load handler
      const img = imgRef.current
      if (img.complete && img.naturalWidth > 0) {
        setDims({ w: img.naturalWidth, h: img.naturalHeight })
      }
    }
  }, [dataUrl])

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      toast.error('File too large (max 4 MB)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      // Result is a data URL
      setInput(String(reader.result ?? ''))
      toast.success(`Loaded ${file.name} (${formatBytes(file.size)})`)
    }
    reader.onerror = () => toast.error('Failed to read file')
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      if (!text) {
        toast.info('Clipboard is empty')
        return
      }
      setInput(text)
      toast.success('Pasted from clipboard')
    } catch {
      toast.error('Clipboard read failed or denied')
    }
  }

  function downloadImage() {
    if (!dataUrl) {
      toast.info('Nothing to download')
      return
    }
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `decoded-image.${type === 'unknown' ? 'bin' : type}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success(`Downloaded decoded-image.${type === 'unknown' ? 'bin' : type}`)
  }

  const hasValidImage = Boolean(dataUrl && byteLen > 0)

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <Tabs defaultValue="decode">
          <TabsList className="mb-4">
            <TabsTrigger value="decode" className="gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" /> Decode Base64 → Image
            </TabsTrigger>
          </TabsList>

          <TabsContent value="decode">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <FieldLabel className="mb-0 flex items-center gap-2">
                    <FileImage className="h-4 w-4 text-primary" />
                    Base64 input
                  </FieldLabel>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload className="h-3.5 w-3.5" /> Upload file
                    </Button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={pasteFromClipboard}
                    >
                      <ClipboardPaste className="h-3.5 w-3.5" /> Paste
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setInput(SAMPLE_PNG)
                        toast.info('Sample PNG loaded')
                      }}
                    >
                      Sample
                    </Button>
                    {input && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => {
                          setInput('')
                          setOverride('auto')
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Clear
                      </Button>
                    )}
                  </div>
                </div>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste a base64 string or a data:image/... URL…"
                  className="min-h-[260px] font-mono text-xs"
                  spellCheck={false}
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <FieldLabel className="mb-0">Image type override</FieldLabel>
                  <Select
                    value={override}
                    onValueChange={(v) => setOverride(v as ImgType | 'auto')}
                  >
                    <SelectTrigger className="h-8 w-40 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-detect</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                      <SelectItem value="gif">GIF</SelectItem>
                      <SelectItem value="webp">WebP</SelectItem>
                      <SelectItem value="bmp">BMP</SelectItem>
                      <SelectItem value="svg">SVG</SelectItem>
                      <SelectItem value="ico">ICO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview + info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <FieldLabel className="mb-0">Preview</FieldLabel>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={downloadImage}
                    disabled={!hasValidImage}
                  >
                    <Download className="h-4 w-4" /> Download image
                  </Button>
                </div>

                {!hasValidImage ? (
                  <div className="rounded-md border border-dashed border-border bg-muted/30 h-[260px] flex items-center justify-center text-sm text-muted-foreground">
                    Image preview will appear here
                  </div>
                ) : (
                  <div className="rounded-md border border-border bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px] dark:bg-[repeating-conic-gradient(#1e293b_0%_25%,#0f172a_0%_50%)] p-2 flex items-center justify-center">
                    <img
                      ref={imgRef}
                      src={dataUrl}
                      alt="Decoded preview"
                      className="max-h-[260px] w-auto object-contain"
                      onLoad={(e) => {
                        const t = e.currentTarget
                        if (t.naturalWidth > 0) {
                          setDims({ w: t.naturalWidth, h: t.naturalHeight })
                        }
                      }}
                      onError={() => {
                        toast.error('Could not decode — input may not be a valid image')
                      }}
                    />
                  </div>
                )}

                {/* Info grid */}
                {hasValidImage && (
                  <div className="grid grid-cols-2 gap-2">
                    <InfoTile label="Detected type" value={TYPE_LABELS[type]} />
                    <InfoTile label="MIME" value={TYPE_MIME[type]} />
                    <InfoTile
                      label="Dimensions"
                      value={dims ? `${dims.w} × ${dims.h} px` : 'Loading…'}
                    />
                    <InfoTile label="Estimated size" value={formatBytes(estimatedBytes)} />
                    <InfoTile
                      label="Actual size"
                      value={byteLen > 0 ? formatBytes(byteLen) : '—'}
                    />
                    <InfoTile label="Base64 chars" value={raw.replace(/\s+/g, '').length.toLocaleString()} />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">How it works</h3>
        </div>
        <Separator className="mb-3" />
        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
          <li>Paste a raw base64 string or a full <code className="font-mono text-xs">data:image/...;base64,...</code> URL.</li>
          <li>Image type is auto-detected from magic-byte prefixes (PNG <code className="font-mono text-xs">iVBORw</code>, JPEG <code className="font-mono text-xs">/9j/</code>, GIF <code className="font-mono text-xs">R0lGOD</code>, WebP <code className="font-mono text-xs">UklGR</code>, BMP <code className="font-mono text-xs">Qk</code>, ICO <code className="font-mono text-xs">AAABAA</code>) or from the data-URI MIME.</li>
          <li>Use the override dropdown to force a specific type if auto-detection guesses wrong.</li>
          <li>File size is estimated from base64 length (4 chars ≈ 3 bytes, minus padding) and verified against the decoded byte count.</li>
          <li>Everything runs in your browser — your image never leaves your device.</li>
        </ul>
      </ToolCardWrapper>

      {!input && (
        <EmptyState message="Paste a base64 image string or upload a file to preview, inspect dimensions, and download as a binary image." />
      )}
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-border/60 bg-card/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium font-mono truncate">{value}</div>
    </div>
  )
}
