'use client'

import * as React from 'react'
import {
  Image as ImageIcon,
  Upload,
  Download,
  Trash2,
  Copy,
  Check,
  Type,
  Palette,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
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

type Charset = 'standard' | 'blocks' | 'minimal' | 'custom'

const CHARSETS: Record<Charset, string> = {
  standard: ' .:-=+*#%@',
  blocks: '░▒▓█',
  minimal: ' .:#@',
  custom: ' .:-=+*#%@',
}

function rgbToAnsi(r: number, g: number, b: number): string {
  // 24-bit foreground ANSI escape
  return `\x1b[38;2;${r};${g};${b}m`
}

function generateAscii(
  img: HTMLImageElement,
  width: number,
  charset: string,
  invert: boolean,
  color: boolean,
): { text: string; cols: number; rows: number } {
  const canvas = document.createElement('canvas')
  // Maintain aspect ratio; chars are roughly 2x taller than wide.
  const aspectRatio = img.height / img.width
  const cols = width
  const rows = Math.max(1, Math.floor(width * aspectRatio * 0.5))
  canvas.width = cols
  canvas.height = rows * 2 // sample twice as many pixels vertically
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { text: '', cols, rows }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  const chars = invert ? [...charset].reverse().join('') : charset
  const last = chars.length - 1
  let out = ''
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // Average two vertical pixels (since rows canvas height = rows*2).
      const i1 = ((y * 2) * canvas.width + x) * 4
      const i2 = ((y * 2 + 1) * canvas.width + x) * 4
      const r = (data[i1] + data[i2]) / 2
      const g = (data[i1 + 1] + data[i2 + 1]) / 2
      const b = (data[i1 + 2] + data[i2 + 2]) / 2
      const a = (data[i1 + 3] + data[i2 + 3]) / 2 / 255
      // perceived luminance
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) * a
      const idx = Math.min(last, Math.max(0, Math.floor((lum / 255) * (last + 0.0001))))
      const ch = chars[idx] ?? ' '
      if (color) {
        out += rgbToAnsi(Math.round(r), Math.round(g), Math.round(b)) + ch
      } else {
        out += ch
      }
    }
    out += '\n'
  }
  if (color) out += '\x1b[0m'
  return { text: out, cols, rows }
}

export default function ImageToAscii() {
  const [img, setImg] = React.useState<HTMLImageElement | null>(null)
  const [srcPreview, setSrcPreview] = React.useState('')
  const [width, setWidth] = React.useState(80)
  const [charset, setCharset] = React.useState<Charset>('standard')
  const [customChars, setCustomChars] = React.useState(' .:-=+*#%@')
  const [invert, setInvert] = React.useState(false)
  const [color, setColor] = React.useState(false)
  const [result, setResult] = React.useState<{ text: string; cols: number; rows: number } | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      setImg(image)
      setSrcPreview(url)
      toast.success(`Loaded ${file.name} (${image.width}×${image.height})`)
    }
    image.onerror = () => toast.error('Failed to load image')
    image.src = url
    e.target.value = ''
  }

  // Regenerate when options change
  React.useEffect(() => {
    if (!img) {
      setResult(null)
      return
    }
    const chars = charset === 'custom' ? (customChars || ' .:-=+*#%@') : CHARSETS[charset]
    try {
      const r = generateAscii(img, width, chars, invert, color)
      setResult(r)
    } catch {
      toast.error('Failed to generate ASCII art')
    }
  }, [img, width, charset, customChars, invert, color])

  function copyText() {
    if (!result) return
    navigator.clipboard
      .writeText(result.text)
      .then(() => toast.success(`Copied ${result.cols}×${result.rows} ASCII art`))
      .catch(() => toast.error('Copy failed'))
  }

  function downloadTxt() {
    if (!result) return
    const blob = new Blob([result.text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ascii-art.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast.success('Downloaded ascii-art.txt')
  }

  return (
    <div className="space-y-6">
      <ToolCardWrapper>
        <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
          {/* Controls */}
          <div className="space-y-4">
            <FieldLabel className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              Source image
            </FieldLabel>
            <div
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer rounded-lg border-2 border-dashed border-border hover:border-primary/60 transition-colors p-6 text-center"
            >
              {srcPreview ? (
                <img src={srcPreview} alt="source preview" className="mx-auto max-h-32 rounded-md" />
              ) : (
                <>
                  <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">Click to upload an image</p>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>

            <div>
              <FieldLabel>Width (characters): {width}</FieldLabel>
              <Slider value={[width]} min={20} max={200} step={1} onValueChange={(v) => setWidth(v[0])} />
            </div>

            <div>
              <FieldLabel>Character set</FieldLabel>
              <Select value={charset} onValueChange={(v) => setCharset(v as Charset)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard · ` .:-=+*#%@`</SelectItem>
                  <SelectItem value="blocks">Blocks · `░▒▓█`</SelectItem>
                  <SelectItem value="minimal">Minimal · ` .:#@`</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {charset === 'custom' && (
              <div>
                <FieldLabel>Custom characters (darkest → lightest)</FieldLabel>
                <Input
                  value={customChars}
                  onChange={(e) => setCustomChars(e.target.value)}
                  className="font-mono text-sm"
                  placeholder=" .:-=+*#%@"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2">
                <span className="text-xs font-medium flex items-center gap-1.5">
                  <Type className="h-3.5 w-3.5" /> Invert
                </span>
                <Switch checked={invert} onCheckedChange={setInvert} />
              </div>
              <div className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2">
                <span className="text-xs font-medium flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5" /> ANSI color
                </span>
                <Switch checked={color} onCheckedChange={setColor} />
              </div>
            </div>

            {img && (
              <Button variant="ghost" size="sm" className="w-full gap-1.5" onClick={() => { setImg(null); setSrcPreview(''); setResult(null) }}>
                <Trash2 className="h-4 w-4" /> Clear image
              </Button>
            )}
          </div>

          {/* Output */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {result && (
                  <>
                    <Badge variant="secondary" className="font-mono">
                      {result.cols} × {result.rows}
                    </Badge>
                    <Badge variant="outline" className="font-mono">
                      {result.text.split('\n').length - 1} lines
                    </Badge>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={copyText} disabled={!result}>
                  <Copy className="h-4 w-4" /> Copy
                </Button>
                <Button size="sm" className="gap-1.5" onClick={downloadTxt} disabled={!result}>
                  <Download className="h-4 w-4" /> Download .txt
                </Button>
              </div>
            </div>

            {result ? (
              <div className="rounded-lg border border-border bg-zinc-950 overflow-auto">
                <pre
                  className="text-[8px] sm:text-[10px] leading-[1.05] font-mono p-3 text-emerald-300 whitespace-pre"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                >
                  {result.text.replace(/\x1b\[[0-9;]*m/g, '')}
                </pre>
              </div>
            ) : (
              <EmptyState message="Upload an image to see the ASCII art preview." />
            )}

            {color && (
              <p className="text-xs text-muted-foreground">
                <Badge variant="outline" className="font-mono text-[10px] mr-1">Tip</Badge>
                ANSI color codes are embedded in the copied text. Paste into a terminal (or <code className="font-mono">echo -e</code>) to see colors. The preview above shows the plain-text version.
              </p>
            )}
          </div>
        </div>
      </ToolCardWrapper>
    </div>
  )
}
