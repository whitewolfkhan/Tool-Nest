'use client'

import * as React from 'react'
import {
  FileDown,
  Trash2,
  FileWarning,
  FileType2,
  HardDrive,
  Hash,
  ClipboardPaste,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  ToolCardWrapper,
  FieldLabel,
  EmptyState,
} from '@/components/tool-page-shell'
import { toast } from 'sonner'

interface MagicMatch {
  type: string
  ext: string
  mime: string
  test: (bytes: Uint8Array) => boolean
}

const SIGNATURES: MagicMatch[] = [
  { type: 'PNG image', ext: 'png', mime: 'image/png', test: (b) => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a },
  { type: 'JPEG image', ext: 'jpg', mime: 'image/jpeg', test: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: 'GIF image', ext: 'gif', mime: 'image/gif', test: (b) => b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 && (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61 },
  { type: 'WebP image', ext: 'webp', mime: 'image/webp', test: (b) => b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
  { type: 'PDF document', ext: 'pdf', mime: 'application/pdf', test: (b) => b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 },
  { type: 'ZIP archive', ext: 'zip', mime: 'application/zip', test: (b) => b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b && (b[2] === 0x03 || b[2] === 0x05) && (b[3] === 0x04 || b[3] === 0x06) },
  { type: 'GZIP archive', ext: 'gz', mime: 'application/gzip', test: (b) => b.length >= 3 && b[0] === 0x1f && b[1] === 0x8b && b[2] === 0x08 },
  { type: 'MP3 audio', ext: 'mp3', mime: 'audio/mpeg', test: (b) => b.length >= 3 && b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33 },
  { type: 'WAV audio', ext: 'wav', mime: 'audio/wav', test: (b) => b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x41 && b[10] === 0x56 && b[11] === 0x45 },
  { type: 'MP4 video', ext: 'mp4', mime: 'video/mp4', test: (b) => b.length >= 12 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 },
  { type: 'BMP image', ext: 'bmp', mime: 'image/bmp', test: (b) => b.length >= 2 && b[0] === 0x42 && b[1] === 0x4d },
  { type: 'ICO icon', ext: 'ico', mime: 'image/x-icon', test: (b) => b.length >= 4 && b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x01 && b[3] === 0x00 },
  { type: 'SVG (XML)', ext: 'svg', mime: 'image/svg+xml', test: (b) => b.length >= 5 && b[0] === 0x3c && b[1] === 0x3f && b[2] === 0x78 && b[3] === 0x6d && b[4] === 0x6c },
]

function stripDataUri(input: string): string {
  const trimmed = input.trim()
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(trimmed)
  if (match) return match[3].trim()
  return trimmed
}

function base64ToBytes(b64: string): Uint8Array {
  const cleaned = b64.replace(/\s+/g, '')
  const bin = atob(cleaned)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function detectType(bytes: Uint8Array): MagicMatch | null {
  for (const sig of SIGNATURES) {
    if (sig.test(bytes)) return sig
  }
  return null
}

function formatSize(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

function toHexView(bytes: Uint8Array, maxBytes = 256): { offset: string; hex: string; ascii: string }[] {
  const slice = bytes.slice(0, maxBytes)
  const rows: { offset: string; hex: string; ascii: string }[] = []
  for (let i = 0; i < slice.length; i += 16) {
    const chunk = slice.slice(i, i + 16)
    const hex = Array.from(chunk).map((b) => b.toString(16).padStart(2, '0')).join(' ')
    const ascii = Array.from(chunk).map((b) => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('')
    rows.push({
      offset: i.toString(16).padStart(8, '0'),
      hex: hex.padEnd(47, ' '),
      ascii,
    })
  }
  return rows
}

export default function Base64ToFile() {
  const [input, setInput] = React.useState('')
  const [bytes, setBytes] = React.useState<Uint8Array | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [filename, setFilename] = React.useState('download')

  const decoded = React.useMemo(() => {
    if (!input.trim()) return null
    try {
      const stripped = stripDataUri(input)
      const b = base64ToBytes(stripped)
      return { bytes: b, error: null }
    } catch (e) {
      return { bytes: null, error: (e as Error).message }
    }
  }, [input])

  React.useEffect(() => {
    if (!decoded) {
      setBytes(null)
      setError(null)
      return
    }
    setBytes(decoded.bytes)
    setError(decoded.error)
  }, [decoded])

  const detected = bytes ? detectType(bytes) : null
  const fileExt = detected?.ext ?? 'bin'
  const finalName = filename.trim() || 'download'
  const mime = detected?.mime ?? 'application/octet-stream'

  const hexRows = bytes ? toHexView(bytes, 256) : []

  function pasteFromClipboard() {
    navigator.clipboard
      .readText()
      .then((text) => {
        setInput(text)
        toast.success('Pasted from clipboard')
      })
      .catch(() => toast.error('Clipboard access denied'))
  }

  function download() {
    if (!bytes || bytes.length === 0) {
      toast.info('Nothing to download')
      return
    }
    const blob = new Blob([bytes], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${finalName}.${fileExt}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1500)
    toast.success(`Downloaded ${finalName}.${fileExt} (${formatSize(bytes.length)})`)
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <FieldLabel className="mb-0 flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                Base64 input
              </FieldLabel>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={pasteFromClipboard}>
                  <ClipboardPaste className="h-3.5 w-3.5" /> Paste
                </Button>
                {input && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={() => { setInput(''); setFilename('download') }}>
                    <Trash2 className="h-3.5 w-3.5" /> Clear
                  </Button>
                )}
              </div>
            </div>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={'Paste Base64 here, with or without the data: prefix…\n\ne.g. data:image/png;base64,iVBORw0KGgo…'}
              className="min-h-[240px] font-mono text-xs"
              spellCheck={false}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Filename</FieldLabel>
                <Input
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="download"
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <FieldLabel>Extension</FieldLabel>
                <Input value={fileExt} readOnly className="font-mono text-sm bg-muted/40" />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                <FileWarning className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Decode error</p>
                  <p className="font-mono mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <Button onClick={download} disabled={!bytes || bytes.length === 0} className="w-full gap-1.5">
              <FileDown className="h-4 w-4" /> Download file ({formatSize(bytes?.length ?? 0)})
            </Button>
          </div>

          {/* Info + hex preview */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <InfoRow icon={<FileType2 className="h-4 w-4" />} label="Detected type">
                {bytes ? (
                  detected ? (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15">
                        {detected.type}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">{detected.mime}</span>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="font-mono">unknown / binary</Badge>
                  )
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </InfoRow>
              <InfoRow icon={<HardDrive className="h-4 w-4" />} label="Estimated size">
                <span className="font-mono">{bytes ? formatSize(bytes.length) : '—'}</span>
              </InfoRow>
              <InfoRow icon={<Hash className="h-4 w-4" />} label="Bytes">
                <span className="font-mono tabular-nums">{bytes ? bytes.length.toLocaleString() : '—'}</span>
              </InfoRow>
            </div>

            <div>
              <FieldLabel>Hex preview (first 256 bytes)</FieldLabel>
              {hexRows.length > 0 ? (
                <div className="rounded-md border border-border bg-zinc-950 overflow-x-auto">
                  <pre className="text-[11px] leading-5 font-mono text-emerald-300 p-3">
                    {hexRows.map((r) => (
                      <div key={r.offset}>
                        <span className="text-zinc-500">{r.offset}</span>
                        {'  '}
                        <span className="text-emerald-200">{r.hex}</span>
                        {'  '}
                        <span className="text-amber-300">{r.ascii}</span>
                      </div>
                    ))}
                  </pre>
                </div>
              ) : (
                <EmptyState message="Decode Base64 on the left to see a hex preview of the first 256 bytes." />
              )}
            </div>
          </div>
        </div>
      </ToolCardWrapper>

      <ToolCardWrapper>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">How it works</h3>
        </div>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>The <code className="font-mono">data:...</code> URL prefix is detected and stripped automatically before decoding.</li>
          <li>Whitespace and line breaks inside the Base64 string are ignored (so you can paste multi-line PEM-style blocks).</li>
          <li>File type is detected via <strong>magic-byte signatures</strong> for common formats (PNG, JPG, GIF, WebP, PDF, ZIP, GZIP, MP3, WAV, MP4, BMP, ICO, SVG).</li>
          <li>If the type is unknown, the file is saved with the <code className="font-mono">.bin</code> extension and <code className="font-mono">application/octet-stream</code> MIME type.</li>
          <li>All processing is 100% client-side — your Base64 never leaves your browser.</li>
        </ul>
      </ToolCardWrapper>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-card/50 px-3 py-2.5">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {icon}
        {label}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  )
}
